var path = require('path'), fs = require('fs'), dot = require('dot'), utils = require('../../utils'),
    assert = utils.assert, writeWithPath = utils.writeWithPath;

dot.templateSettings.strip = false;

module.exports = function (report, outputFilename) {
    assert(outputFilename, 'Error: no output file name has been provided to the HTML renderer.');

    var htmlTemplateFile = fs.readFileSync(path.join(__dirname, 'template.html')),
        htmlTemplate = dot.template(htmlTemplateFile),
        dotTemplateFile = fs.readFileSync(path.join(__dirname, 'template.dot')),
        dotTemplate = dot.template(dotTemplateFile);

    writeWithPath(outputFilename, htmlTemplate({report: report, dot: dotTemplate(report)}));
};
