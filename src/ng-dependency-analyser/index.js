var _ = require('lodash'), estraverse = require('estraverse'),
    utils = require('../utils'), jsParser = utils.jsParser, concatAll = utils.concatAll, assert = utils.assert, asArray = utils.asArray,
    extractor = require('./extractor'), extractImportSourceAndSpecifiers = extractor.extractImportSourceAndSpecifiers,
    extractFunctionParameterNames = extractor.extractFunctionParameterNames, extractCalledMember = extractor.extractCalledMember,
    importResolver = require('./import-resolver'), ImportResolver = importResolver.ImportResolver,
    getImportNameForFilename = importResolver.getImportNameForFilename,
    defaultRenderer = require('./rendering/console-renderer');

exports.Report = function (filenames) {
    var asts = filenames.map(jsParser),
        modules = extractModules(asts),
        injectedDependencies = extractDependencies(asts);

    this.getModules = function () {
        return modules;
    };

    this.getInjectedDependencies = function () {
        return injectedDependencies;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };

    function extractModules(asts) {
        return asts
            .map(callWithAstAndFilename(extractModuleDefinition))
            .reduce(concatAll, []);
    }

    function extractDependencies(asts) {
        var injectableDependencies = asts
            .map(callWithAstAndFilename(extractInjectableDependencies))
            .reduce(concatAll, []);

        return asts
            .map(callWithAstAndFilename(extractInjectedDependencies(injectableDependencies)))
            .reduce(concatAll, []);
    }

    function callWithAstAndFilename(fn) {
        return function (ast, index) {
            return fn.call(undefined, ast, filenames[index]);
        }
    }
};

function extractModuleDefinition(ast, filename) {
    var module = undefined, requires = [], provides = [], importResolver = new ImportResolver(filename),
        importName = getImportNameForFilename(filename);

    estraverse.traverse(ast, {
        leave: function (node) {
            var importNameAndIdentifiers = extractImportNameAndIdentifiers(node);

            if (importNameAndIdentifiers) {
                importResolver.addImportNameAndIdentifiers(importNameAndIdentifiers);
            }

            var moduleNameAndRequires = extractModuleNameAndRequires(node, filename);

            if (moduleNameAndRequires) {
                assert(!module, 'Error, more than one module defined in: "' + filename + '".');

                module = new Module(moduleNameAndRequires.name, importName);
                requires = moduleNameAndRequires.requires;
            }

            var providedDependencyName = extractInjectableDependencyName(node);

            if (providedDependencyName) {
                if (module) {
                    provides.push(providedDependencyName);
                } else {
                    console.warn('Warning, found injectable: "' + providedDependencyName + '" without current module in: "' + filename + '".');
                }
            }
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
            var importNameAndIdentifiers = extractImportNameAndIdentifiers(node);

            if (importNameAndIdentifiers) {
                importResolver.addImportNameAndIdentifiers(importNameAndIdentifiers);
            }

            var injectableDependencyName = extractInjectableDependencyName(node);

            if (injectableDependencyName) {
                injectableDependenciesNames.push(injectableDependencyName);
            }

            var injectedControllerIdentifier = extractInjectedControllerIdentifier(node);

            if (injectedControllerIdentifier) {
                injectableDependenciesNames.push(injectedControllerIdentifier);
            }
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
                    var injectableDependency = _.find(injectableDependencies, byName);

                    function byName(injectableDependency) {
                        return injectableDependency.name === injectedDependencyCandidate;
                    }

                    if (injectableDependency) {
                        if (!injectedDependencies) {
                            injectedDependencies = [];
                        }

                        if (injectedDependencies.indexOf(injectableDependency) < 0) {
                            injectedDependencies.push(injectableDependency);
                        }
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
