var _ = require('lodash'), utils = require('../utils'), jsParser = utils.jsParser, concatAll = utils.concatAll,
    estraverse = require('estraverse'), defaultRenderer = require('./console-renderer');

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
        .map(extractModuleDefinitions(filenames))
        .reduce(concatAll, []);
}

function extractModuleDefinitions(filenames) {
    return function (ast, index) {
        var modules = [];

        estraverse.traverse(ast, {
            enter: function (node) {
                var calledMember = memberCall(node);

                if (calledMember === 'module' && node.arguments.length > 1 && node.arguments[0].type === 'Literal') {
                    modules.push(node.arguments[0].value);
                }
            }
        });

        return modules;
    };
}

function extractInjectables(ast) {
    var injectables = [];

    estraverse.traverse(ast, {
        enter: function (node) {
            var calledMember = memberCall(node);

            if (calledMember === 'factory' || calledMember === 'service' || calledMember === 'provider') {
                injectables.push(node.arguments[0].value);
            }
        }
    });

    return injectables;
}

function extractInjected(injectables, filenames) {
    return function (ast, index) {
        var injected = [];

        estraverse.traverse(ast, {
            enter: function (node) {
                var injectableCandidates = functionParameterNames(node) || [];

                injectableCandidates.forEach(function (injectableCandidate) {
                    if (injectables.indexOf(injectableCandidate) >= 0) {
                        injected.push({filename: filenames[index], dependency: injectableCandidate});
                    }
                });
            }
        });

        return injected;
    };
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
