var indent = require('../utils').indent;

module.exports = function (report) {
    console.log('<!DOCTYPE html><html><body><pre>');

    report.getEntries().forEach(function (entry) {
        console.log(indent(entry.indentationLevel, entry.text));
    });

    console.log('</pre></body></html>');
};
