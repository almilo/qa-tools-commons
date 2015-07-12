var path = require('path'), fs = require('fs'), dot = require('dot'), assert = require('../../utils').assert;

dot.templateSettings.strip = false;

module.exports = function (report, outputFilename) {
    assert(outputFilename, 'Error: no output file name has been provided to the HTML renderer.');

    var templateFile = fs.readFileSync(path.join(__dirname, 'template.html')),
        htmlTemplate = dot.template(templateFile);

    fs.writeFileSync(outputFilename, htmlTemplate(report));
};
