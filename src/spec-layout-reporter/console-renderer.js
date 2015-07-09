var indent = require('../utils').indent;

module.exports = function consoleRenderer(report) {
    report.getEntries().forEach(function (entry) {
        console.log(indent(entry.indentationLevel, entry.text));
    });
};
