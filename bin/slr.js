#! /usr/bin/env node

var _ = require('lodash'), assert = require('../src/utils').assert,
    expandFilenames = require('../src/utils').expandFilenames, Report = require('../src/spec-layout-reporter').Report;

assert(process.argv.length >= 3, [
    'usage: slr <file matcher>',
    '',
    'examples:',
    '    slr foo.spec.js',
    '    slr src/lib/*.spec.js',
    '    slr src/lib/**/**/*.spec.js'
]);

var params = process.argv.slice(2), options = processParams(params), report = new Report();

expandFilenames(params)
    .forEach(function (filename) {
        report.add(filename);
    });

report.render(options.renderer);

function processParams(params) {
    return _.extend({}, processOption(params, '--html'));

    function processOption(params, optionParam) {
        var option = {}, optionIndex = params.indexOf(optionParam);

        if (optionIndex >= 0) {
            params.splice(optionIndex, 1);

            option.renderer = require('../src/spec-layout-reporter/html-renderer');
        }

        return option
    }
}
