var AsciiTable = require('ascii-table');

module.exports = function consoleRenderer(report) {
    var lastFileName, table = new AsciiTable().setHeading('File', 'Dependency', 'Version');

    report.getDependencies().forEach(function (dependency) {
        var currentFileName = dependency.getFileName(),
            fileName = !lastFileName || lastFileName !== currentFileName ? currentFileName : '';

        table.addRow(fileName, dependency.getName(), dependency.getVersion());

        lastFileName = currentFileName;
    });

    console.log(table.toString());
};
