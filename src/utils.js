var _ = require('lodash'), fs = require('fs'), glob = require('glob'), parserImplementation = require('acorn').parse;

exports.expandFilenames = function (args) {
    return glob.hasMagic(args[0]) ? glob.sync(args[0]).filter(specs) : args;

    function specs(filename) {
        return filename.match(/\.spec\.js$/) === null;
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
    errorMessage = _.isString(errorMessage) ? [errorMessage] : errorMessage;

    if (!condition) {
        errorMessage.map(function (line) {
            console.error(line);
        });

        process.exit(1);
    }
};

exports.processOption = function (params, optionName, optionValue) {
    var optionIndex = params.indexOf(optionName);

    if (optionIndex >= 0) {
        params.splice(optionIndex, 1);

        return _.isString(optionValue) ? parseOption(optionValue, optionIndex, params) : optionValue;

        function parseOption(optionValue, optionIndex, params) {
            var option = {};

            option[optionValue] = params[optionIndex];
            params.splice(optionIndex, 1);

            return option;
        }
    }
};
