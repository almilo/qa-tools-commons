var _ = require('lodash'), fs = require('fs'), path = require('path'), glob = require('glob'),
    parserImplementation = require('acorn').parse, mkpath = require('mkpath');

exports.expandFilenames = function (args, includeSpecs) {
    return glob.hasMagic(args[0]) ? glob.sync(args[0]).filter(specs) : args;

    function specs(filename) {
        return includeSpecs || filename.match(/\.spec\.js$/) === null;
    }
};

exports.jsParser = function (filename) {
    var options = {ecmaVersion: 6, sourceType: 'module'};

    return parserImplementation(fs.readFileSync(filename), options);
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

function checkPathExists(filename) {
    var pathTo = path.relative(process.cwd(), path.dirname(filename));

    mkpath.sync(pathTo);
}

exports.checkPathExists = checkPathExists;

exports.writeWithPath = function (filename, content) {
    checkPathExists(filename);

    fs.writeFileSync(filename, content);
};
