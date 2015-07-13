var utils = require('../src/utils'), assert = utils.assert, expandFilenames = utils.expandFilenames, asArray = utils.asArray,
    Report = require('../src/ng-dependency-analyser').Report;

module.exports = function (files, rendererName, outputFilename, overwrite) {
    assert(files, 'Error, "files" argument is required.');

    files = asArray(files);

    var renderer = rendererName && require('../src/ng-dependency-analyser/rendering/' + rendererName + '-renderer');

    new Report(expandFilenames(files)).render(renderer, outputFilename, overwrite);
};
