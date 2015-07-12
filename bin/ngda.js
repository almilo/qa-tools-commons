#! /usr/bin/env node

var fs = require('fs'), yargs = require('yargs'), expandFilenames = require('../src/utils').expandFilenames,
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
        .boolean('overwrite')
        .help('h')
        .alias('h', 'help')
        .example('$0 -f "src/**/*.js"', 'Processes the files matcher as a "glob" matcher and prints the dependency report of all matched files.')
        .example('$0 -f "src/**/*.js" --dot', 'Processes the files matcher as a "glob" matcher and produces a directed graph of all matched files.')
        .example('$0 -f "src/**/*.js" --png foo.png', 'Processes the files matcher as a "glob" matcher and produces a directed graph of all matched files in PNG format.')
        .check(argsChecker)
        .argv,
    renderer = (argv.dot && getRenderer('dot')) || (argv.png && getRenderer('png'));

function argsChecker(argv) {
    if (argv.dot && argv.png) {
        throw new Error('Error, use only --dot or --png');
    }

    if (argv.png && fs.existsSync(argv.png) && !argv.overwrite) {
        throw new Error('Error, the output file: "' + argv.png + '" must not exist or --overwrite option must be set.');
    }

    return true;
}

new Report(expandFilenames(argv.files)).render(renderer, argv.png, argv.overwrite);

function getRenderer(name) {
    return require('../src/ng-dependency-analyser/rendering/' + name + '-renderer');
}
