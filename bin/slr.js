#! /usr/bin/env node

var assert = require('../src/utils').assert;

assert(process.argv.length >= 3, [
    'usage: slr <file matcher>',
    '',
    'examples:',
    '    slr foo.spec.js',
    '    slr src/lib/*.spec.js',
    '    slr src/lib/**/**/*.spec.js'
]);

var expandFilenames = require('../src/utils').expandFilenames,
    slr = require('../src/spec-layout-reporter'), Report = slr.Report, addToReport = slr.addToReport,
    report = new Report();

expandFilenames(process.argv.slice(2))
    .forEach(function (filename) {
        addToReport(filename, report);
    });

report.render();
