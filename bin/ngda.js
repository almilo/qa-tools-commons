#! /usr/bin/env node

var fs = require('fs'), _ = require('lodash'), yargs = require('yargs'), ngda = require('../ngda');

var argv = yargs
    .usage('Usage: $0 -f <files matcher> [options]')
    .option('f', {
        array: true,
        demand: true,
        alias: 'files',
        describe: 'Files to process. It can be one or more files, a shell wildcard or a "glob" matcher (use quotes to avoid the shell expanding it).'
    })
    .string('dot')
    .describe('dot', 'Generates the dependency graph as graphviz dot file.')
    .string('png')
    .describe('png', 'Generates the dependency graph as PNG file.')
    .string('html')
    .describe('html', 'Generates the dependency graph as HTML file.')
    .boolean('overwrite')
    .describe('overwrite', 'Overwrites the output file if exists.')
    .string('urlTemplate')
    .describe('urlTemplate', 'Template for the URL to link the nodes to. The placeholder "${fileName}" will be substituted with the name of the file.')
    .help('h')
    .alias('h', 'help')
    .example('$0 -f "src/**/*.js"', 'Processes the files matcher as a "glob" matcher and prints the dependency report of all matched files.')
    .example('$0 -f "src/**/*.js" --dot foo.dot', 'Processes the files matcher as a "glob" matcher and generates a directed graph of all matched files in dot format.')
    .example('$0 -f "src/**/*.js" --png foo.png', 'Processes the files matcher as a "glob" matcher and generates a directed graph of all matched files in PNG format.')
    .check(argumentsChecker)
    .strict()
    .argv;

function argumentsChecker(argv) {
    if (moreThanOne(argv.dot, argv.png, argv.html)) {
        throw new Error('Error, use only --dot or --png or --html.');
    }

    var outputFile = argv.dot || argv.png || argv.html;

    if (outputFile && fs.existsSync(outputFile) && !argv.overwrite) {
        throw new Error('Error, the output file: "' + outputFile + '" must not exist or --overwrite option must be set.');
    }

    return true;
}

var rendererNameAndFilename = getRendererNameAndFileName(argv);

ngda(argv.files, rendererNameAndFilename.rendererName, rendererNameAndFilename.fileName, argv.overwrite, argv.urlTemplate);

function getRendererNameAndFileName(argv) {
    var rendererName = _.find(['dot', 'png', 'html'], function (rendererName) {
        return !!argv[rendererName];
    });

    return (rendererName && {
            rendererName: rendererName,
            fileName: argv[rendererName]
        }) || {};
}

function moreThanOne() {
    var total = _.toArray(arguments).reduce(function (sum, argument) {
        return sum + (argument ? 1 : 0);
    }, 0);

    return total > 1;
}
