var utils = require('../utils'), jsParser = utils.jsParser, callWithAstAndFilename = utils.callWithAstAndFilename,
    estraverse = require('estraverse'), defaultRenderer = require('./rendering/console-renderer');

exports.Report = function (fileNames, urlTemplate) {
    var asts = fileNames.map(jsParser), files = extractSpecs(asts, fileNames);

    this.getFiles = function () {
        return files;
    };

    this.getUrlTemplate = function () {
        return urlTemplate;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };
};

function extractSpecs(asts, fileNames) {
    return asts.map(callWithAstAndFilename(extractSpec, fileNames));
}

function extractSpec(ast, fileName) {
    var indentationLevel = 0, fileEntries = [];

    estraverse.traverse(ast, {
        enter: function (node) {
            var calledFunction = functionCall(node);

            if (calledFunction === 'describe' || calledFunction === 'it') {
                fileEntries.push(new FileEntry(indentationLevel, node.arguments[0].value));

                if (calledFunction === 'describe') {
                    indentationLevel++;
                }
            }
        },
        leave: function (node) {
            if (functionCall(node) === 'describe') {
                indentationLevel--;
            }
        }
    });

    return new File(fileName, fileEntries);
}

function functionCall(node) {
    return node.type === 'CallExpression' && node.callee.type === 'Identifier' ? node.callee.name : undefined;
}

function File(name, entries) {
    this.getName = function () {
        return name;
    };

    this.getEntries = function () {
        return entries;
    };
}

function FileEntry(indentationLevel, text) {
    this.getIndentationLevel = function () {
        return indentationLevel;
    };

    this.getText = function () {
        return text;
    };
}
