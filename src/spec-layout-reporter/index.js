var utils = require('../utils'), jsParser = utils.jsParser, estraverse = require('estraverse'),
    defaultRenderer = require('./rendering/console-renderer');

exports.Report = function (urlTemplate) {
    var files = [];

    this.getFiles = function () {
        return files;
    };

    this.getUrlTemplate = function () {
        return urlTemplate;
    };

    this.addFile = function (fileName) {
        var indentationLevel = 0, entries = [];

        estraverse.traverse(jsParser(fileName), {
            enter: function (node) {
                var calledFunction = functionCall(node);

                if (calledFunction === 'describe' || calledFunction === 'it') {
                    entries.push(createEntry(indentationLevel, node.arguments[0].value));

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

        files.push(new File(fileName, entries));

        function functionCall(node) {
            return node.type === 'CallExpression' && node.callee.type === 'Identifier' ? node.callee.name : undefined;
        }
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };

    function createEntry(indentationLevel, text) {
        return {
            indentationLevel: indentationLevel,
            text: text
        };
    }
};

function File(fileName, entries) {
    this.getFileName = function () {
        return fileName;
    };

    this.getEntries = function () {
        return entries;
    };
}
