var utils = require('../src/utils'), assert = utils.assert, expandFilenames = utils.expandFilenames, asArray = utils.asArray,
    Report = require('../src/spec-layout-reporter').Report;

module.exports = function (files, rendererName, outputFilename, overwrite) {
    assert(files, 'Error, "files" argument is required.');

    files = asArray(files);

    var renderer = rendererName && require('../src/spec-layout-reporter/rendering/' + rendererName + '-renderer'),
        report = new Report();

    expandFilenames(files, true)
        .forEach(function (filename) {
            report.add(filename);
        });

    report.render(renderer, outputFilename, overwrite);
};
