#! /usr/bin/env node

var _ = require('lodash'), utils = require('../src/utils'), assert = utils.assert, expandFilenames = utils.expandFilenames,
    processOption = utils.processOption, Report = require('../src/spec-layout-reporter').Report;

assert(process.argv.length >= 3, [
    'usage: slr <file matcher>',
    '',
    'examples:',
    '    slr foo.spec.js',
    '    slr src/lib/*.spec.js',
    '    slr src/lib/**/**/*.spec.js'
]);

var params = process.argv.slice(2), options = processParams(params), report = new Report();

expandFilenames(params, true)
    .forEach(function (filename) {
        report.add(filename);
    });

report.render(options.renderer);

function processParams(params) {
    var htmlOption = processOption(params, '--html', {renderer: require('../src/spec-layout-reporter/rendering/html-renderer')});

    return _.extend({}, htmlOption);
}
