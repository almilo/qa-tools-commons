#! /usr/bin/env node

var _ = require('lodash'), yargs = require('yargs'), depq = require('../depq');

var argv = yargs
    .usage('Usage: $0 -f <files matcher> [-q | -g] <query> [options]')
    .option('f', {
        array: true,
        demand: true,
        alias: 'files',
        describe: 'Files to process. It can be one or more files, a shell wildcard or a "glob" matcher (use quotes to avoid the shell expanding it).'
    })
    .option('q', {
        string: true,
        alias: 'query',
        describe: 'Query to execute. Typically a text to match partially against the dependency name. If it is the "*" wildcard, then any dependency will be matched.'
    })
    .option('g', {
        string: true,
        alias: 'graph',
        describe: 'Create a graph of dependencies.'
    })
    .string('sorting')
    .describe('sorting', '"byDepName", sorts the result first by dependency name and second by file name. "byFileName", sorts the result first by file name and second by dependency name.')
    .help('h')
    .alias('h', 'help')
    .example('$0 -f "/*/package.json" -q "lodash"', 'Processes the files matcher as a "glob" matcher and prints the dependencies whose name contain "lodash".')
    .example('$0 -f "/*.package.json" -g "acme"', 'Processes the files matcher as a "glob" matcher and prints the dependency graph of the dependencies whose name contain "acme".')
    .strict()
    .check(argumentsChecker)
    .argv;

function argumentsChecker(argv) {
    if (!exactlyOne(argv.query, argv.graph)) {
        throw new Error('Error, use exactly one of -q or -g.');
    }

    return true;
}

if (argv.query) {
    depq.query(argv.files, argv.query, argv.sorting);
} else {
    depq.graph(argv.files, argv.graph);
}

function exactlyOne() {
    var total = _.toArray(arguments).reduce(function (sum, argument) {
        return sum + (argument ? 1 : 0);
    }, 0);

    return total === 1;
}
