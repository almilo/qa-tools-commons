var utils = require('../utils'), jsParser = utils.jsParser, indent = utils.indent, estraverse = require('estraverse');

exports.addToReport = function (filename, report) {
    var indentationLevel = 0;

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

exports.Report = function () {
    var entries = [];

    this.addEntry = function (indentationLevel, text) {
        entries.push(createEntry(indentationLevel, text));
    };

    this.getEntries = function () {
        return entries;
    };

    this.render = function (renderer) {
        (renderer || consoleRenderer)(this);
    };

    function createEntry(indentationLevel, text) {
        return {
            indentationLevel: indentationLevel,
            text: text
        };
    }
};

function consoleRenderer(report) {
    report.getEntries().forEach(function (entry) {
        console.log(indent(entry.indentationLevel, entry.text));
    });
}

exports.consoleRenderer = consoleRenderer;

exports.htmlRenderer = function (report) {
    console.log('<!DOCTYPE html><html><body><pre>');

    report.getEntries().forEach(function (entry) {
        console.log(indent(entry.indentationLevel, entry.text));
    });

    console.log('</pre></body></html>');
};
