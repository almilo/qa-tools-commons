#! /usr/bin/env node

if (process.argv.length < 3) {
    console.error('usage: ngda <file matcher>');
    console.error();
    console.error('examples:');
    console.error('    ngda *.js');
    console.error('    ngda src/lib/**/**/*.js');

    process.exit(1);
}

var expandFilenames = require('../src/utils').expandFilenames,
    extractInjectedInjectables = require('../src/ng-dependency-analyser').extractInjectedInjectables,
    filenames = expandFilenames(process.argv.slice(2));

extractInjectedInjectables(filenames)
    .forEach(function (item) {
        console.log(item);
    }
);
