#! /usr/bin/env node

var assert = require('../src/utils').assert,
    expandFilenames = require('../src/utils').expandFilenames,
    extractInjectedInjectables = require('../src/ng-dependency-analyser').extractInjectedInjectables;

assert(process.argv.length >= 3, [
    'usage: ngda <file matcher>',
    '',
    'examples:',
    '    ngda *.js',
    '    ngda src/lib/**/**/*.js'
]);

var filenames = expandFilenames(process.argv.slice(2));

extractInjectedInjectables(filenames)
    .forEach(function (item) {
        console.log(item);
    }
);
