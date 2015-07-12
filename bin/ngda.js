#! /usr/bin/env node

var fs = require('fs'), _ = require('lodash'), yargs = require('yargs'), expandFilenames = require('../src/utils').expandFilenames,
    Report = require('../src/ng-dependency-analyser').Report;

var argv = yargs
        .usage('Usage: $0 -f <files matcher> [options]')
        .array('f')
        .demand('f')
        .alias('f', 'files')
        .describe('f', 'Files to process. It can be one or more files, a shell wildcard or a "glob" matcher (use quotes to avoid the shell expanding it).')
        .boolean('dot')
        .describe('dot', 'Produces the dependency graph as graphviz dot file.')
        .string('png')
        .describe('png', 'Produces the dependency graph as PNG file.')
        .string('html')
        .describe('html', 'Produces the dependency graph as HTML file.')
        .boolean('overwrite')
        .help('h')
        .alias('h', 'help')
        .example('$0 -f "src/**/*.js"', 'Processes the files matcher as a "glob" matcher and prints the dependency report of all matched files.')
        .example('$0 -f "src/**/*.js" --dot', 'Processes the files matcher as a "glob" matcher and produces a directed graph of all matched files.')
        .example('$0 -f "src/**/*.js" --png foo.png', 'Processes the files matcher as a "glob" matcher and produces a directed graph of all matched files in PNG format.')
        .check(argsChecker)
        .argv;

function argsChecker(argv) {
    if (moreThanOne(argv.dot, argv.png, argv.html)) {
        throw new Error('Error, use only --dot or --png or --html.');
    }

    var outputFile = argv.png || argv.html;

    if (outputFile && fs.existsSync(outputFile) && !argv.overwrite) {
        throw new Error('Error, the output file: "' + outputFile + '" must not exist or --overwrite option must be set.');
    }

    return true;
}

var rendererAndFilename = getRendererAndFilename(argv);

new Report(expandFilenames(argv.files)).render(rendererAndFilename.renderer, rendererAndFilename.filename, argv.overwrite);

function getRendererAndFilename(argv) {
    var rendererName = _.find(['dot', 'png', 'html'], function(rendererName) {
        return !!argv[rendererName];
    });

    return {
        renderer: require('../src/ng-dependency-analyser/rendering/' + rendererName + '-renderer'),
        filename: argv[rendererName]
    };
}

function moreThanOne() {
    var total = _.toArray(arguments).reduce(function (sum, argument) {
        return sum + (argument ? 1 : 0);
    }, 0);

    return total > 1;
}
