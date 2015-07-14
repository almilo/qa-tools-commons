var utils = require('../src/utils'), assert = utils.assert, expandFileNames = utils.expandFileNames, asArray = utils.asArray,
    Report = require('../src/ng-dependency-analyser').Report;

module.exports = function (files, rendererName, outputFilename, overwrite, urlTemplate) {
    assert(files, 'Error, "files" argument is required.');

    files = asArray(files);

    var renderer = rendererName && require('../src/ng-dependency-analyser/rendering/' + rendererName + '-renderer');

    new Report(expandFileNames(files), urlTemplate).render(renderer, outputFilename, overwrite);
};
