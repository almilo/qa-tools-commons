var _ = require('lodash'), fs = require('fs'), glob = require('glob'), parserImplementation = require('acorn').parse;

exports.expandFilenames = function (args) {
    return glob.hasMagic(args[0]) ? glob.sync(args[0]) : args;
};

exports.jsParser = function (filename) {
    var options = {ecmaVersion: 6, sourceType: 'module'};

    return parserImplementation(fs.readFileSync(filename), options);
};

exports.concatAll = function (accumulated, current) {
    return accumulated.concat(current);
};

exports.indent = function (indentationLevel, text) {
    return _.repeat(' ', indentationLevel * 4) + text;
};
