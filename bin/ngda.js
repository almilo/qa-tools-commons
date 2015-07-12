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
        .boolean('jpeg')
        .describe('jpeg', 'Produces the dependency graph as JPEG file.')
        .string('output')
        .boolean('overwrite')
        .help('h')
        .alias('h', 'help')
        .example('$0 -f "src/**/*.js"', 'Processes the files matcher as a "glob" matcher and prints the dependency report of all matched files.')
        .example('$0 -f "src/**/*.js" --dot', 'Processes the files matcher as a "glob" matcher and produces a directed graph of all matched files.')
        .example('$0 -f "src/**/*.js" --jpeg --output', 'Processes the files matcher as a "glob" matcher and produces a directed graph of all matched files in JPEG format.')
        .check(argsChecker)
        .argv,
    renderer = (argv.dot && getRenderer('dot')) || (argv.jpeg && getRenderer('jpeg'));

function argsChecker(argv) {
    if (argv.dot && argv.jpeg) {
        throw new Error('Error, use only --dot or --jpeg');
    }
    if (argv.jpeg && !argv.output) {
        throw new Error('Error, using --jpeg option --output option is also required.');
    }

    if (argv.jpeg && argv.output && fs.existsSync(argv.output) && !argv.overwrite) {
        throw new Error('Error, the output file: "' + argv.output + '" must not exist or --overwrite option must be set.');
    }

    return true;
}

new Report(expandFilenames(argv.files)).render(renderer, argv.output, argv.overwrite);

function getRenderer(name) {
    return require('../src/ng-dependency-analyser/rendering/' + name + '-renderer');
}
