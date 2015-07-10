var _ = require('lodash'), path = require('path'), utils = require('../utils'), jsParser = utils.jsParser,
    concatAll = utils.concatAll, assert = utils.assert, estraverse = require('estraverse'),
    defaultRenderer = require('./rendering/console-renderer');

exports.Report = function (filenames) {
    var asts = filenames.map(jsParser);

    this.injectedDependencies = extractInjectedDependencies(asts, filenames);
    this.modules = extractModules(asts, filenames);

    this.getInjectedDependencies = function () {
        return this.injectedDependencies;
    };

    this.getModules = function () {
        return this.modules;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };
};

function extractInjectedDependencies(asts, filenames) {
    var injectables = asts
        .map(extractInjectables)
        .reduce(concatAll, []);

    return asts
        .map(extractInjected(injectables, filenames))
        .reduce(concatAll, []);
}

function extractModules(asts, filenames) {
    return asts
        .map(extractModuleDefinition(filenames))
        .reduce(concatAll, []);
}

function extractModuleDefinition(filenames) {
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

function extractInjected(injectables, filenames) {
    return function (ast, index) {
        var injectedDependencies = undefined, filename = filenames[index], importName = getImportName(filename);

        estraverse.traverse(ast, {
            enter: function (node) {
                var injectableCandidateNames = functionParameterNames(node) || [];

                injectableCandidateNames.forEach(function (injectableCandidateName) {
                    var injectable = _.find(injectables, function (injectable) {
                        return injectable.name === injectableCandidateName;
                    });

                    if (injectable) {
                        if (!injectedDependencies) {
                            injectedDependencies = {
                                importName: importName,
                                injectables: []
                            }
                        }

                        injectedDependencies.injectables.push(injectable);
                    }
                });
            }
        });

        return injectedDependencies;
    };
}

function extractInjectableName(node) {
    var injectables = ['factory', 'service', 'provider', 'directive', 'controller'], calledMember = memberCall(node);

    return injectables.indexOf(calledMember) >= 0 && node.arguments[0].value;
}

function extractModuleNameAndRequires(node, filename) {
    var calledMember = memberCall(node);

    if (calledMember === 'module' && node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        var name = node.arguments[0].value;

        if (name) {
            var elements = (node.arguments[1] && node.arguments[1].type === 'ArrayExpression' && node.arguments[1].elements) || [];

            if (node.arguments[1] && node.arguments[1].type !== 'ArrayExpression') {
                console.warn('Warning, found non-array expression as module requires in: "' + filename + '".');
            }

            return {name: name, requires: elements.map(extractIdentifier)};
        }
    }

    function extractIdentifier(node) {
        return (node.type = 'MemberExpression' && node.object && node.object.name) || (node.type = 'Indentifier' && node.name);
    }
}

function extractImportNameAndIdentifiers(node) {
    var importSourceAndSpecifiers = importDeclaration(node);

    if (importSourceAndSpecifiers) {
        var name = importSourceAndSpecifiers.source.value, identifiers = [];

        importSourceAndSpecifiers.specifiers.forEach(function (specifier) {
            identifiers.push(specifier.local.name);
        });

        return {importName: getImportName(name), identifiers: identifiers};
    }
}

function importDeclaration(node) {
    if (node.type === 'ImportDeclaration') {
        return {source: node.source, specifiers: node.specifiers};
    }
}

function memberCall(node) {
    if (node.type === 'CallExpression') {
        var callee = node.callee;

        return (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') && callee.property.name;
    }
}

function functionParameterNames(node) {
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        return _.pluck(node.params, 'name');
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
