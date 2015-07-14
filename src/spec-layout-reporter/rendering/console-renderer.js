var indent = require('../../utils').indent;

module.exports = function consoleRenderer(report) {
    report.getFiles().forEach(renderFile);

    function renderFile(file) {
        console.log('File: ' + file.getName());

        file.getEntries().forEach(renderEntry);

        console.log();
    }

    function renderEntry(entry) {
        console.log(indent(entry.getIndentationLevel() + 1, entry.getText()));
    }
};
