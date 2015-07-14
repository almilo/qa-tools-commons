var _ = require('lodash');

exports.extractVariableIdentifierAndInitializer = function (node) {
    if (node.type === 'VariableDeclarator') {
        var identifier = node.id && node.id.type === 'Identifier' && node.id.name, initializer = node.init;

        return identifier && initializer && {identifier: identifier, initializer: initializer};
    }
};

exports.extractCalledFunctionAndArguments = function (node) {
    if (node.type === 'CallExpression') {
        var callee = node.callee;

        if (callee.type === 'Identifier') {
            return {identifier: callee.name, arguments: node.arguments};
        }
    }
};

exports.extractCalledMember = function (node) {
    if (node.type === 'CallExpression') {
        var callee = node.callee;

        return (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') && callee.property.name;
    }
};

exports.extractFunctionParameterNames = function (node) {
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        return _.pluck(node.params, 'name');
    }
};

exports.extractImportSourceAndSpecifiers = function (node) {
    if (node.type === 'ImportDeclaration') {
        return {source: node.source, specifiers: node.specifiers};
    }
};
