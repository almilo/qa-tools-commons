#! /usr/bin/env node

if (process.argv.length < 3) {
    console.error('usage: slr <file matcher>');
    console.error();
    console.error('examples:');
    console.error('slr foo.spec.js');
    console.error('slr src/lib/*.spec.js');
    console.error('slr src/lib/**/**/*.spec.js');

    process.exit(1);
}

var expandFilenames = require('../src/utils').expandFilenames,
    slr = require('../src/spec-layout-reporter'), Report = slr.Report, addToReport = slr.addToReport,
    report = new Report();

expandFilenames(process.argv.slice(2))
    .forEach(function (filename) {
        addToReport(filename, report);
    });

report.render();
