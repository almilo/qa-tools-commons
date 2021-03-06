var path = require('path'), fs = require('fs'), dot = require('dot'), shelljs = require('shelljs'),
    utils = require('../../utils'), assert = utils.assert, checkPathExists = utils.checkPathExists;

dot.templateSettings.strip = false;

module.exports = function (report, outputFilename) {
    assert(outputFilename, 'Error: no output file name has been provided to the PNG renderer.');

    var templateFile = fs.readFileSync(path.join(__dirname, 'template.dot')),
        dotTemplate = dot.template(templateFile), tempDotFilename = path.join(shelljs.tempdir(), 'ngda.dot'),
        dotCommand = 'dot ' + tempDotFilename + ' -Tpng -o' + outputFilename;

    fs.writeFileSync(tempDotFilename, dotTemplate(report));

    checkPathExists(outputFilename);

    assert(shelljs.exec(dotCommand).code === 0, 'Error executing "' + dotCommand + '". Please, make sure that "graphviz" is installed in your system and that the "dot" line command is available from the shell.');
};
