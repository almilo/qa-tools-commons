var _ = require('lodash');

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
