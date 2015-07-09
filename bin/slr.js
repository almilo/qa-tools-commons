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

var expandFilenames = require('../src/utils').expandFilenames, Report = require('../src/spec-layout-reporter').Report;

var report = new Report();

expandFilenames(process.argv.slice(2))
    .forEach(function (filename) {
        report.add(filename);
    });

report.render();
