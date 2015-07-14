var _ = require('lodash'), fs = require('fs'), path = require('path'), glob = require('glob'),
    parserImplementation = require('acorn').parse, mkpath = require('mkpath');

exports.expandFileNames = function (args, includeSpecs) {
    return glob.hasMagic(args[0]) ? glob.sync(args[0]).filter(specs) : args;

    function specs(fileName) {
        return includeSpecs || fileName.match(/\.spec\.js$/) === null;
    }
};

exports.jsParser = function (fileName) {
    var options = {ecmaVersion: 6, sourceType: 'module'};

    return parserImplementation(fs.readFileSync(fileName), options);
};

exports.concatAll = function (accumulated, current) {
    return current ? accumulated.concat(current) : accumulated;
};

exports.indent = function (indentationLevel, text) {
    return _.repeat(' ', indentationLevel * 4) + text;
};

exports.assert = function (condition, errorMessage) {
    if (!condition) {
        throw new Error(errorMessage);
    }
};

exports.asArray = function (value) {
    return value && !_.isArray(value) ? [value] : value;
};

function checkPathExists(fileName) {
    var pathTo = path.relative(process.cwd(), path.dirname(fileName));

    mkpath.sync(pathTo);
}

exports.checkPathExists = checkPathExists;

exports.writeWithPath = function (fileName, content) {
    checkPathExists(fileName);

    fs.writeFileSync(fileName, content);
};
