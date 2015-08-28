#! /usr/bin/env node

var yargs = require('yargs'), depq = require('../depq');

var argv = yargs
    .usage('Usage: $0 -f <files matcher> -q <query>')
    .array('f')
    .demand('f')
    .alias('f', 'files')
    .describe('f', 'Files to process. It can be one or more files, a shell wildcard or a "glob" matcher (use quotes to avoid the shell expanding it).')
    .string('q')
    .demand('q')
    .alias('q', 'query')
    .describe('q', 'Query to execute. Typically a text to match partially against the dependency name.')
    .help('h')
    .alias('h', 'help')
    .example('$0 -f "/*/*.package.json" -q "lodash"', 'Processes the files matcher as a "glob" matcher and prints the dependencies which contain "lodash" in the name.')
    .strict()
    .argv;

depq(argv.files, argv.query);
