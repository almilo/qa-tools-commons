var _ = require('lodash');

module.exports = function consoleRenderer(report) {
    var dependencies = report.getDependencies();

    if (dependencies.length === 0) {
        console.log('No matching results found.');
    } else {
        dependencies.forEach(function (dependency) {
            printDependencyTree(dependency);
        });
    }
};

function printDependencyTree(dependency, level, isLast) {
    level = level || 0;

    console.log(indent(level, isLast), dependency.name + '@' + dependency.version);

    (dependency.dependencies || []).forEach(function (dependency, index, collection) {
        printDependencyTree(dependency, level + 1, index === collection.length - 1);
    });

    function indent(level, last) {
        if (level === 0) {
            return '';
        }

        return spacer(level) + (last ? String.fromCharCode(9492) : String.fromCharCode(9500));

        function spacer(level) {
            return _.range(0, level).reduce(function (result, index) {
                var blanks = '    ', blanksWithPipe = blanks + String.fromCharCode(9474),
                    placeholder = level >= 2 && index < level - 1 ? blanksWithPipe : blanks;

                return result + placeholder;
            }, '');
        }
    }
}
