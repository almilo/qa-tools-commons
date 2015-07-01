var fs = require('fs'), glob = require('glob'), parserImplementation = require('acorn').parse;

exports.expandFilenames = function (args) {
    return glob.hasMagic(args[0]) ? glob.sync(args[0]) : args;
};

exports.jsParser = function (filename) {
    var options = {ecmaVersion: 6, sourcetype: 'module'};

    return parserImplementation(fs.readFileSync(filename), options);
};

exports.concatAll = function (accumulated, current) {
    return accumulated.concat(current);
};

exports.indent = function (indentationLevel, text) {
    return indentation(indentationLevel) + text;

    function indentation(indentationLevel) {
        return range(indentationLevel).reduce(function (accumulated) {
            return accumulated + '    ';
        }, '');
    }
};

function range(length) {
    return Array.apply(null, new Array(length));
}
