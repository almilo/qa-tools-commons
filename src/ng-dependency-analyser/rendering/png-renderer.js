var path = require('path'), fs = require('fs'), dot = require('dot'), shelljs = require('shelljs'),
    assert = require('../../utils').assert;

dot.templateSettings.strip = false;

module.exports = function (report, outputFilename) {
    assert(outputFilename, 'Error: no output file name has been provided to the png renderer.');

    var templateFile = fs.readFileSync(path.join(__dirname, 'template.dot')),
        dotTemplate = dot.template(templateFile), tempDotFilename = path.join(shelljs.tempdir(), 'deps.dot'),
        dotCommand = 'dot ' + tempDotFilename + ' -Tpng -o' + outputFilename;

    fs.writeFileSync(tempDotFilename, dotTemplate(report));

    var dotExitCode = shelljs.exec(dotCommand).code;

    assert(dotExitCode === 0, 'Error executing "' + dotCommand + '". Please, make sure that "graphviz" is installed in your system and that the "dot" line command is available from the shell.');
};
