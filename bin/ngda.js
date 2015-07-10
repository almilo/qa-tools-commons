#! /usr/bin/env node

var _ = require('lodash'), assert = require('../src/utils').assert,
    utils = require('../src/utils'), expandFilenames = utils.expandFilenames, processOption = utils.processOption,
    Report = require('../src/ng-dependency-analyser').Report;

assert(process.argv.length >= 3, [
    'usage: ngda <file matcher>',
    '',
    'examples:',
    '    ngda *.js',
    '    ngda src/lib/**/**/*.js'
]);

var params = process.argv.slice(2), options = processParams(params);

new Report(expandFilenames(params)).render(options.renderer, options.outputFilename, options.overwrite);

function processParams(params) {
    var dotOption = processOption(params, '--dot', {renderer: require('../src/ng-dependency-analyser/dot-renderer')}),
        jpegOption = processOption(params, '--jpeg', {renderer: require('../src/ng-dependency-analyser/jpeg-renderer')}),
        outputFilenameOption = processOption(params, '--output', 'outputFilename'),
        overwriteOption = processOption(params, '--overwrite', {overwrite: true});

    assert(!dotOption || !jpegOption, 'You must use either --dot or --jpeg but not both.');
    assert(!jpegOption || outputFilenameOption, '--output is required with --jpeg.');

    return _.extend({}, dotOption, jpegOption, outputFilenameOption, overwriteOption);
}
