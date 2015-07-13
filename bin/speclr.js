#! /usr/bin/env node

var yargs = require('yargs'), expandFilenames = require('../src/utils').expandFilenames,
    Report = require('../src/spec-layout-reporter').Report;

var argv = yargs
    .usage('Usage: $0 -f <files matcher> [options]')
    .array('f')
    .demand('f')
    .alias('f', 'files')
    .describe('f', 'Files to process. It can be one or more files, a shell wildcard or a "glob" matcher (use quotes to avoid the shell expanding it).')
    .boolean('html')
    .describe('html', 'Produces the specification layout as HTML.')
    .help('h')
    .alias('h', 'help')
    .example('$0 -f "src/**/*.spec.js"', 'Processes the files matcher as a "glob" matcher and prints the specification layout of all matched files.')
    .example('$0 -f "foo.spec.js" --html', 'Prints the specification layout of the file "foo.spec.js" as HTML.')
    .argv;

var report = new Report(), renderer = argv.html && require('../src/spec-layout-reporter/rendering/html-renderer');

expandFilenames(argv.files, true)
    .forEach(function (filename) {
        report.add(filename);
    });

report.render(renderer);
