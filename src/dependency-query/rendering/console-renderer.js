var AsciiTable = require('ascii-table');

module.exports = function consoleRenderer(report) {
    var lastDependency, table = new AsciiTable().setHeading('File', 'Dependency', 'Version');

    report.getDependencies()
        .forEach(function (dependency) {
            var currentDependency = dependency;

            dependency = filterRepetitions(lastDependency, currentDependency);
            table.addRow(dependency.referringFileName, dependency.name, dependency.version);

            lastDependency = currentDependency;
        });

    console.log(table.toString());
};

function filterRepetitions(lastDependency, currentDependency) {
    var placeHolder = '   "   "';

    if (!lastDependency) {
        return currentDependency
    } else {
        return {
            referringFileName: lastDependency.referringFileName !== currentDependency.referringFileName ? currentDependency.referringFileName : placeHolder,
            name: lastDependency.name !== currentDependency.name ? currentDependency.name : placeHolder,
            version: lastDependency.version !== currentDependency.version ? currentDependency.version : placeHolder
        };
    }
}
