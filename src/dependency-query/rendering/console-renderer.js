var AsciiTable = require('ascii-table');

module.exports = function consoleRenderer(report) {
    var lastFileName, table = new AsciiTable().setHeading('File', 'Dependency', 'Version');

    report.getDependencies()
        .sort(byFileName)
        .forEach(function (dependency) {
            var currentFileName = dependency.getFileName(),
                fileName = !lastFileName || lastFileName !== currentFileName ? currentFileName : '';

            table.addRow(fileName, dependency.getName(), dependency.getVersion());

            lastFileName = currentFileName;
        });

    console.log(table.toString());
};

function byFileName(dependency1, dependency2) {
    return dependency1.getFileName() < dependency2.getFileName() ? -1 : 1;
}
