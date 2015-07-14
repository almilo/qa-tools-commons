var utils = require('../src/utils'), assert = utils.assert, expandFileNames = utils.expandFileNames, asArray = utils.asArray,
    Report = require('../src/spec-layout-reporter').Report;

module.exports = function (files, rendererName, outputFilename, overwrite, urlTemplate) {
    assert(files, 'Error, "files" argument is required.');

    files = asArray(files);

    var renderer = rendererName && require('../src/spec-layout-reporter/rendering/' + rendererName + '-renderer'),
        report = new Report(urlTemplate);

    expandFileNames(files, true)
        .forEach(function (fileName) {
            report.addFile(fileName);
        });

    report.render(renderer, outputFilename, overwrite);
};
