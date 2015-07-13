#! /usr/bin/env node

var fs = require('fs'), yargs = require('yargs'), expandFilenames = require('../src/utils').expandFilenames,
    Report = require('../src/spec-layout-reporter').Report;

var argv = yargs
    .usage('Usage: $0 -f <files matcher> [options]')
    .array('f')
    .demand('f')
    .alias('f', 'files')
    .describe('f', 'Files to process. It can be one or more files, a shell wildcard or a "glob" matcher (use quotes to avoid the shell expanding it).')
    .string('html')
    .describe('html', 'Generates the specification layout as HTML file.')
    .boolean('overwrite')
    .describe('overwrite', 'Overwrites the output file if exists.')
    .help('h')
    .alias('h', 'help')
    .example('$0 -f "src/**/*.spec.js"', 'Processes the files matcher as a "glob" matcher and prints the specification layout of all matched files.')
    .example('$0 -f "foo.spec.js" --html spec/spec.html', 'Generates the specification layout of the file "foo.spec.js" in the file "spec/spec.html".')
    .check(argumentsChecker)
    .strict()
    .argv;

function argumentsChecker(argv) {
    var outputFile = argv.html;

    if (outputFile && fs.existsSync(outputFile) && !argv.overwrite) {
        throw new Error('Error, the output file: "' + outputFile + '" must not exist or --overwrite option must be set.');
    }

    return true;
}

var report = new Report(), renderer = argv.html && require('../src/spec-layout-reporter/rendering/html-renderer');

expandFilenames(argv.files, true)
    .forEach(function (filename) {
        report.add(filename);
    });

report.render(renderer, argv.html, argv.overwrite);
