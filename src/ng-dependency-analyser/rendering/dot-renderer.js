var path = require('path'), fs = require('fs'), dot = require('dot'),
    utils = require('../../utils'), assert = utils.assert, writeWithPath = utils.writeWithPath;

dot.templateSettings.strip = false;

module.exports = function (report, outputFilename) {
    assert(outputFilename, 'Error: no output file name has been provided to the dot renderer.');

    var templateFile = fs.readFileSync(path.join(__dirname, 'template.dot')),
        dotTemplate = dot.template(templateFile);

    writeWithPath(outputFilename, dotTemplate(report));
};
