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
        injectedDependencies = extractInjectedDependencies(asts);

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

    function extractInjectedDependencies(asts) {
        var injectables = asts
            .map(callWithAstAndFilename(extractInjectables))
            .reduce(concatAll, []);

        return asts
            .map(callWithAstAndFilename(extractInjectedInjectables(injectables)))
            .reduce(concatAll, []);
    }

    function callWithAstAndFilename(fn) {
        return function (ast, index) {
            return fn.call(undefined, ast, filenames[index]);
        }
    }
};

function extractModuleDefinition(ast, filename) {
    var module = undefined, importResolver = new ImportResolver(filename), importName = getImportNameForFilename(filename);

    estraverse.traverse(ast, {
        leave: function (node) {
            var importNameAndIdentifiers = extractImportNameAndIdentifiers(node);

            if (importNameAndIdentifiers) {
                importResolver.addImportNameAndIdentifiers(importNameAndIdentifiers);
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

    return module && resolveImportNames(module, importResolver);

    function resolveImportNames(module, importResolver) {
        module.requires = module.requires.map(importResolver.getImportNameForIdentifier);
        module.injectables = module.injectables.map(_.partial(createResolvedInjectable, importResolver));

        return module;
    }
}

function extractInjectables(ast, filename) {
    var injectables = [], importResolver = new ImportResolver(filename);

    estraverse.traverse(ast, {
        enter: function (node) {
            var importNameAndIdentifiers = extractImportNameAndIdentifiers(node);

            if (importNameAndIdentifiers) {
                importResolver.addImportNameAndIdentifiers(importNameAndIdentifiers);
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

    return injectables.map(_.partial(createResolvedInjectable, importResolver));
}

function extractInjectedInjectables(injectables) {
    return function (ast, filename) {
        var injectedDependencies = undefined, importName = getImportNameForFilename(filename);

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

                        if (injectedDependencies.injectables.indexOf(injectable) < 0) {
                            injectedDependencies.injectables.push(injectable);
                        }
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

        return {importName: getImportNameForFilename(name), identifiers: identifiers};
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

function createResolvedInjectable(importResolver, injectableName) {
    return {name: injectableName, importName: importResolver.getImportNameForIdentifier(injectableName)};
}
