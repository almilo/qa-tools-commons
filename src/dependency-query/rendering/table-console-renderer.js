var AsciiTable = require('ascii-table');

module.exports = function consoleRenderer(report) {
    var lastDependency, table = new AsciiTable().setHeading('File', 'Dependency', 'Version'),
        dependencies = report.getDependencies();

    if (dependencies.length === 0) {
        console.log('No matching results found.');
    } else {
        dependencies.forEach(function (dependency) {
            var currentDependency = dependency;

            dependency = filterRepetitions(lastDependency, currentDependency);
            table.addRow(dependency.referringFileName, dependency.name, dependency.version);

            lastDependency = currentDependency;
        });

        console.log(table.toString());
    }
};

function filterRepetitions(lastDependency, currentDependency) {
    if (!lastDependency) {
        return currentDependency
    } else {
        return filterRepeatedFields(lastDependency, currentDependency, ['referringFileName', 'name', 'version']);
    }

    function filterRepeatedFields(lastDependency, currentDependency, fieldNames) {
        var placeHolder = '  "  "';

        return fieldNames.reduce(function (result, fieldName) {
            result[fieldName] = lastDependency[fieldName] !== currentDependency[fieldName] ? currentDependency[fieldName] : placeHolder;

            return result;
        }, {});
    }
}