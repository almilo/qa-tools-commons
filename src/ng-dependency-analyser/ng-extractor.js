var _ = require('lodash'), estraverse = require('estraverse'),
    utils = require('../utils'), concatAll = utils.concatAll, assert = utils.assert, asArray = utils.asArray,
    callWithAstAndFilename = utils.callWithAstAndFilename,
    esExtractor = require('./es-extractor'), extractImportSourceAndSpecifiers = esExtractor.extractImportSourceAndSpecifiers,
    extractFunctionParameterNames = esExtractor.extractFunctionParameterNames, extractCalledMember = esExtractor.extractCalledMember,
    extractVariableIdentifierAndInitializer = esExtractor.extractVariableIdentifierAndInitializer,
    extractCalledFunctionAndArguments = esExtractor.extractCalledFunctionAndArguments,
    importResolver = require('./import-resolver'), ImportResolver = importResolver.ImportResolver,
    getImportNameForFileName = importResolver.getImportNameForFileName, getImportNameForImportName = importResolver.getImportNameForImportName;

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

function extractModuleDefinition(ast, fileName) {
    var module = undefined, requires = [], provides = [], importResolver = new ImportResolver(fileName),
        importName = getImportNameForFileName(fileName);

    estraverse.traverse(ast, {
        leave: function (node) {
            callIfNotFalsy(extractImportNameAndIdentifiers(node), importResolver.addImportNameAndIdentifiers.bind(importResolver));

            callIfNotFalsy(extractModuleNameAndRequires(node, fileName), function (moduleNameAndRequires) {
                assert(!module, 'Error, more than one module defined in: "' + fileName + '".');

                module = new Module(moduleNameAndRequires.name, importName, fileName);
                requires = moduleNameAndRequires.requires;
            });

            callIfNotFalsy(extractInjectableDependencyName(node), function (providedDependencyName) {
                if (module) {
                    provides.push(providedDependencyName);
                } else {
                    console.warn('Warning, found injectable: "' + providedDependencyName + '" without current module in: "' + fileName + '".');
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

function extractInjectableDependencies(ast, fileName) {
    var injectableDependenciesNames = [], importResolver = new ImportResolver(fileName);

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
    return function (ast, fileName) {
        var injectedDependencies = undefined, importName = getImportNameForFileName(fileName);

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

        return injectedDependencies && new InjectedDependencies(importName, fileName, injectedDependencies);
    };
}

function extractModuleNameAndRequires(node, fileName) {
    var calledMember = extractCalledMember(node);

    if (calledMember === 'module' && node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        var name = node.arguments[0].value;

        if (name) {
            if (node.arguments[1] && node.arguments[1].type !== 'ArrayExpression') {
                console.warn('Warning, found non-array expression as module requires in: "' + fileName + '".');
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

        return {importName: getImportNameForImportName(name), identifiers: identifiers};
    }

    var variableIdentifierAndInitializer = extractVariableIdentifierAndInitializer(node),
        initializerFunctionAndArguments = variableIdentifierAndInitializer && extractCalledFunctionAndArguments(variableIdentifierAndInitializer.initializer);

    if (initializerFunctionAndArguments && initializerFunctionAndArguments.identifier === 'require' && initializerFunctionAndArguments.arguments[0].type === 'Literal') {
        return {
            importName: getImportNameForFileName(initializerFunctionAndArguments.arguments[0].value),
            identifiers: [variableIdentifierAndInitializer.identifier]
        };
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

function callIfNotFalsy(value, fn) {
    if (value) {
        fn(value);
    }
}

function isNotUndefined(item) {
    return item !== undefined;
}

function Module(name, importName, fileName, requires, provides) {
    this.name = name;
    this.importName = importName;
    this.fileName = fileName;
    this.requires = requires || [];
    this.provides = provides || [];

    this.addRequire = function (require) {
        this.requires.push(require);
    };

    this.addProvide = function (provide) {
        this.provides.push(provide);
    };
}

function InjectedDependencies(importName, fileName, dependencies) {
    this.importName = importName;
    this.fileName = fileName;
    this.dependencies = dependencies;
}

function Dependency(name, importName) {
    this.name = name;
    this.importName = importName;
}
