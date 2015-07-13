var _ = require('lodash'), estraverse = require('estraverse'),
    utils = require('../utils'), concatAll = utils.concatAll, assert = utils.assert, asArray = utils.asArray,
    esExtractor = require('./es-extractor'), extractImportSourceAndSpecifiers = esExtractor.extractImportSourceAndSpecifiers,
    extractFunctionParameterNames = esExtractor.extractFunctionParameterNames, extractCalledMember = esExtractor.extractCalledMember,
    importResolver = require('./import-resolver'), ImportResolver = importResolver.ImportResolver,
    getImportNameForFilename = importResolver.getImportNameForFilename;

exports.extractModules = function (asts, filenames) {
    return asts
        .map(callWithAstAndFilename(extractModuleDefinition, filenames))
        .reduce(concatAll, []);
};

exports.extractDependencies = function (asts, filenames) {
    var injectableDependencies = asts
        .map(callWithAstAndFilename(extractInjectableDependencies, filenames))
        .reduce(concatAll, []);

    return asts
        .map(callWithAstAndFilename(extractInjectedDependencies(injectableDependencies), filenames))
        .reduce(concatAll, []);
};

function extractModuleDefinition(ast, filename) {
    var module = undefined, requires = [], provides = [], importResolver = new ImportResolver(filename),
        importName = getImportNameForFilename(filename);

    estraverse.traverse(ast, {
        leave: function (node) {
            callIfNotFalsy(extractImportNameAndIdentifiers(node), importResolver.addImportNameAndIdentifiers.bind(importResolver));

            callIfNotFalsy(extractModuleNameAndRequires(node, filename), function (moduleNameAndRequires) {
                assert(!module, 'Error, more than one module defined in: "' + filename + '".');

                module = new Module(moduleNameAndRequires.name, importName);
                requires = moduleNameAndRequires.requires;
            });

            callIfNotFalsy(extractInjectableDependencyName(node), function (providedDependencyName) {
                if (module) {
                    provides.push(providedDependencyName);
                } else {
                    console.warn('Warning, found injectable: "' + providedDependencyName + '" without current module in: "' + filename + '".');
                }
            });
        }
    });

    if (module) {
        requires
            .map(importResolver.getImportNameForIdentifier)
            .filter(isNotUndefined)
            .forEach(function (require) {
                module.addRequire(require);
            });

        provides
            .map(_.partial(createResolvedDependency, importResolver))
            .filter(isNotUndefined)
            .forEach(function (require) {
                module.addProvide(require);
            });
    }

    return module;
}

function extractInjectableDependencies(ast, filename) {
    var injectableDependenciesNames = [], importResolver = new ImportResolver(filename);

    estraverse.traverse(ast, {
        enter: function (node) {
            callIfNotFalsy(extractImportNameAndIdentifiers(node), importResolver.addImportNameAndIdentifiers.bind(importResolver));

            callIfNotFalsy(extractInjectableDependencyName(node), injectableDependenciesNames.push.bind(injectableDependenciesNames));

            callIfNotFalsy(extractInjectedControllerIdentifier(node), injectableDependenciesNames.push.bind(injectableDependenciesNames));
        }
    });

    return injectableDependenciesNames
        .map(_.partial(createResolvedDependency, importResolver))
        .filter(isNotUndefined);
}

function extractInjectedDependencies(injectableDependencies) {
    return function (ast, filename) {
        var injectedDependencies = undefined, importName = getImportNameForFilename(filename);

        estraverse.traverse(ast, {
            enter: function (node) {
                var injectedDependenciesCandidates = extractFunctionParameterNames(node) ||
                    asArray(extractInjectedControllerIdentifier(node)) ||
                    [];

                injectedDependenciesCandidates.forEach(function (injectedDependencyCandidate) {
                    callIfNotFalsy(_.find(injectableDependencies, byName), function (injectableDependency) {
                        if (!injectedDependencies) {
                            injectedDependencies = [];
                        }

                        if (injectedDependencies.indexOf(injectableDependency) < 0) {
                            injectedDependencies.push(injectableDependency);
                        }
                    });

                    function byName(injectableDependency) {
                        return injectableDependency.name === injectedDependencyCandidate;
                    }
                });
            }
        });

        return injectedDependencies && new InjectedDependencies(importName, injectedDependencies);
    };
}

function extractModuleNameAndRequires(node, filename) {
    var calledMember = extractCalledMember(node);

    if (calledMember === 'module' && node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        var name = node.arguments[0].value;

        if (name) {
            if (node.arguments[1] && node.arguments[1].type !== 'ArrayExpression') {
                console.warn('Warning, found non-array expression as module requires in: "' + filename + '".');
            }

            var arrayElements = (node.arguments[1] && node.arguments[1].type === 'ArrayExpression' && node.arguments[1].elements);

            arrayElements = arrayElements ? _.cloneDeep(arrayElements) : [];

            return {name: name, requires: arrayElements.map(extractIdentifier)};
        }
    }

    function extractIdentifier(node) {
        return (node.type = 'MemberExpression' && node.object && node.object.name) || (node.type = 'Indentifier' && node.name);
    }
}

function extractImportNameAndIdentifiers(node) {
    var importSourceAndSpecifiers = extractImportSourceAndSpecifiers(node);

    if (importSourceAndSpecifiers) {
        var name = importSourceAndSpecifiers.source.value, identifiers = [];

        importSourceAndSpecifiers.specifiers.forEach(function (specifier) {
            identifiers.push(specifier.local.name);
        });

        return {importName: getImportNameForFilename(name), identifiers: identifiers};
    }
}

function extractInjectableDependencyName(node) {
    var injectableDependencyFactoryMethods = ['factory', 'service', 'provider', 'directive', 'controller'], calledMember = extractCalledMember(node);

    return injectableDependencyFactoryMethods.indexOf(calledMember) >= 0 && node.arguments[0].value;
}

function extractInjectedControllerIdentifier(node) {
    if (node.type === 'ObjectExpression') {
        var result = node.properties
            .filter(function (property) {
                return property.key.name === 'controller' && property.value.type === 'Identifier';
            })
            .map(function (controllerProperty) {
                return controllerProperty.value.name;
            });

        assert(result.length <= 1, 'Error, found more that one controller property: + "' + result + '".');

        return result[0];
    }
}

function createResolvedDependency(importResolver, identifier) {
    var importName = importResolver.getImportNameForIdentifier(identifier);

    return importName && new Dependency(identifier, importName);
}

function callWithAstAndFilename(fn, filenames) {
    return function (ast, index) {
        return fn.call(undefined, ast, filenames[index]);
    }
}

function callIfNotFalsy(value, fn) {
    if (value) {
        fn(value);
    }
}

function isNotUndefined(item) {
    return item !== undefined;
}

function Module(name, importName, requires, provides) {
    this.name = name;
    this.importName = importName;
    this.requires = requires || [];
    this.provides = provides || [];

    this.addRequire = function (require) {
        this.requires.push(require);
    };

    this.addProvide = function (provide) {
        this.provides.push(provide);
    };
}

function InjectedDependencies(importName, dependencies) {
    this.importName = importName;
    this.dependencies = dependencies;
}

function Dependency(name, importName) {
    this.name = name;
    this.importName = importName;
}
