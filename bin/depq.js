#! /usr/bin/env node

var yargs = require('yargs'), depq = require('../depq');

var argv = yargs
    .usage('Usage: $0 -f <files matcher> -q <query> [options]')
    .option('f', {
        array: true,
        demand: true,
        alias: 'files',
        describe: 'Files to process. It can be one or more files, a shell wildcard or a "glob" matcher (use quotes to avoid the shell expanding it).'
    })
    .option('q', {
        string: true,
        demand: true,
        alias: 'query',
        describe: 'Query to execute. Typically a text to match partially against the dependency name. If it is the "*" wildcard, then any dependency will be matched.'
    })
    .string('sorting')
    .describe('sorting', '"byDepName", sorts the result first by dependency name and second by file name. "byFileName", sorts the result first by file name and second by dependency name.')
    .help('h')
    .alias('h', 'help')
    .example('$0 -f "/*/package.json" -q "lodash"', 'Processes the files matcher as a "glob" matcher and prints the dependencies whose name contain "lodash".')
    .strict()
    .argv;

depq(argv.files, argv.query, argv.sorting);
