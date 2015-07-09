var utils = require('../utils'), jsParser = utils.jsParser, estraverse = require('estraverse'),
    defaultRenderer = require('./html-renderer');

exports.Report = function () {
    var entries = [];

    this.addEntry = function (indentationLevel, text) {
        entries.push(createEntry(indentationLevel, text));
    };

    this.getEntries = function () {
        return entries;
    };

    this.add = function (filename) {
        var indentationLevel = 0, report = this;

        report.addEntry(0, 'File: ' + filename);
        report.addEntry(0, '');

        estraverse.traverse(jsParser(filename), {
            enter: function (node) {
                var calledFunction = functionCall(node);

                if (calledFunction === 'describe' || calledFunction === 'it') {
                    report.addEntry(indentationLevel, node.arguments[0].value);

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

        report.addEntry(0, '');

        function functionCall(node) {
            return node.type === 'CallExpression' && node.callee.type === 'Identifier' ? node.callee.name : undefined;
        }
    };

    this.render = function (renderer) {
        (renderer || defaultRenderer)(this);
    };

    function createEntry(indentationLevel, text) {
        return {
            indentationLevel: indentationLevel,
            text: text
        };
    }
};
