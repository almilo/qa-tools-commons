var path = require('path'), fs = require('fs'), dot = require('dot'), indent = require('../../utils').indent;

module.exports = function (report) {
    var templateFile = fs.readFileSync(path.join(__dirname, 'template.html')),
        htmlTemplate = dot.template(templateFile),
        entries = report.getEntries().map(function (entry) {
            return indent(entry.indentationLevel, entry.text);
        });

    console.log(htmlTemplate({entries: entries}));
};
