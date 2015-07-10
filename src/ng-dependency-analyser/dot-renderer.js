var path = require('path'), fs = require('fs'), dot = require('dot');

module.exports = function (report) {
    var templateFile = fs.readFileSync(path.join(__dirname, 'template.dot')),
        dotTemplate = dot.template(templateFile);

    console.log(dotTemplate({entries: report.getEntries()}));
};
