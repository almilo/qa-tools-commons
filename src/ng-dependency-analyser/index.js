var _ = require('lodash'), path = require('path'), estraverse = require('estraverse'),
    utils = require('../utils'), jsParser = utils.jsParser, concatAll = utils.concatAll, assert = utils.assert, asArray = utils.asArray,
    extractor = require('./extractor'), extractImportSourceAndSpecifiers = extractor.extractImportSourceAndSpecifiers,
    extractFunctionParameterNames = extractor.extractFunctionParameterNames, extractCalledMember = extractor.extractCalledMember,
    defaultRenderer = require('./rendering/console-renderer');

exports.Report = function (filenames) {
    var asts = filenames.map(jsParser),
        modules = extractModules(asts, filenames),
        injectedDependencies = extractInjectedDependencies(asts, filenames);

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

    function extractModules(asts, filenames) {
        return asts
            .map(extractModuleDefinitions(filenames))
            .reduce(concatAll, []);
    }

    function extractInjectedDependencies(asts, filenames) {
        var injectables = asts
            .map(extractInjectables)
            .reduce(concatAll, []);

        return asts
            .map(extractInjectedInjectables(injectables, filenames))
            .reduce(concatAll, []);
    }
};


function extractModuleDefinitions(filenames) {
    return function (ast, index) {
        var module = undefined, importsNamesAndIdentifiers = [], filename = filenames[index], importName = getImportName(filename);

        estraverse.traverse(ast, {
            leave: function (node) {
                var importNameAndIdentifiers = extractImportNameAndIdentifiers(node);

                if (importNameAndIdentifiers) {
                    importsNamesAndIdentifiers.push(importNameAndIdentifiers);
                }

                var moduleNameAndRequires = extractModuleNameAndRequires(node, filename);

                if (moduleNameAndRequires) {
                    assert(!module, 'Error, more than one module defined in: "' + filename + '".');

                    module = {
                        name: moduleNameAndRequires.name,
                        requires: moduleNameAndRequires.requires,
                        injectables: [],
                        importName: importName
                    };
                }

                var injectableName = extractInjectableName(node);

                if (injectableName) {
                    if (module) {
                        module.injectables.push(injectableName);
                    } else {
                        console.warn('Warning, found injectable: "' + injectableName + '" without current module in: "' + filename + '".');
                    }
                }
            }
        });

        return module && resolveDependenciesToImportNames(module, importsNamesAndIdentifiers);
    };

    function resolveDependenciesToImportNames(module, importsNamesAndIdentifiers) {
        module.requires = module.requires.map(resolveRequire);
        module.injectables = module.injectables.map(resolveInjectable);

        return module;

        function resolveRequire(require) {
            return resolveImport(require, importsNamesAndIdentifiers);
        }

        function resolveInjectable(injectableName) {
            return {name: injectableName, importName: resolveImport(injectableName, importsNamesAndIdentifiers)};
        }
    }
}

function extractInjectables(ast) {
    var injectables = [], importsNamesAndIdentifiers = [];

    estraverse.traverse(ast, {
        enter: function (node) {
            var importNameAndIdentifiers = extractImportNameAndIdentifiers(node);

            if (importNameAndIdentifiers) {
                importsNamesAndIdentifiers.push(importNameAndIdentifiers);
            }

            var injectableName = extractInjectableName(node);

            if (injectableName) {
                injectables.push(injectableName);
            }

            var injectedControllerIdentifier = extractControllerIdentifier(node);

            if (injectedControllerIdentifier) {
                injectables.push(injectedControllerIdentifier);
            }
        }
    });

    return resolveDependenciesToImportNames(injectables, importsNamesAndIdentifiers);

    function resolveDependenciesToImportNames(injectables, importsNamesAndIdentifiers) {
        return injectables.map(resolveInjectable);

        function resolveInjectable(injectableName) {
            return {name: injectableName, importName: resolveImport(injectableName, importsNamesAndIdentifiers)};
        }
    }
}

function extractInjectedInjectables(injectables, filenames) {
    return function (ast, index) {
        var injectedDependencies = undefined, filename = filenames[index], importName = getImportName(filename);

        estraverse.traverse(ast, {
            enter: function (node) {
                var injectableCandidateNames = extractFunctionParameterNames(node) ||
                    asArray(extractControllerIdentifier(node)) ||
                    [];

                injectableCandidateNames.forEach(function (injectableCandidateName) {
                    var injectable = _.find(injectables, function (injectable) {
                        return injectable.name === injectableCandidateName;
                    });

                    if (injectable) {
                        if (!injectedDependencies) {
                            injectedDependencies = {importName: importName, injectables: []}
                        }

                        injectedDependencies.injectables.push(injectable);
                    }
                });
            }
        });

        return injectedDependencies;
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

        return {importName: getImportName(name), identifiers: identifiers};
    }
}

function extractInjectableName(node) {
    var injectables = ['factory', 'service', 'provider', 'directive', 'controller'], calledMember = extractCalledMember(node);

    return injectables.indexOf(calledMember) >= 0 && node.arguments[0].value;
}

function extractControllerIdentifier(node) {
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

function getImportName(filename) {
    return path.basename(filename, path.extname(filename));
}

function resolveImport(identifier, importsNamesAndIdentifiers) {
    var importNameAndIdentifiers = _.find(importsNamesAndIdentifiers, function (importNameAndIdentifiers) {
        return importNameAndIdentifiers.identifiers.indexOf(identifier) >= 0 ||
            importNameAndIdentifiers.identifiers.indexOf(identifier + 'Directive') >= 0;
    });

    if (!importNameAndIdentifiers) {
        console.warn('Warning, could not resolve import for identifier: "' + identifier + '".');
    }

    return importNameAndIdentifiers && importNameAndIdentifiers.importName;
}
