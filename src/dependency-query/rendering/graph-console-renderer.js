var _ = require('lodash'), model = require('../model'), Dependency = model.Dependency, ChildDependency = model.ChildDependency;

module.exports = function consoleRenderer(report) {
    var dependencyTrees = asDependencyTrees(report.getDependencies());

    if (dependencyTrees.length === 0) {
        console.log('No matching results found.');
    } else {
        dependencyTrees.forEach(function (dependency) {
            printDependencyTree(dependency);
        });
    }
};

function asDependencyTrees(allDependencies) {
    var allDependenciesIndex = _.indexBy(allDependencies, 'name'), nonTopDependencyNames = [];

    return allDependencies
        .map(function (dependency) {
            return new Dependency(
                dependency.name,
                dependency.version,
                resolveDependencies(dependency.dependencies, allDependenciesIndex, nonTopDependencyNames),
                dependency.fileName
            );
        })
        .filter(function (dependency) {
            return nonTopDependencyNames.indexOf(dependency.name) < 0;
        });

    function resolveDependencies(flatDependencies, allDependenciesIndex, nonTopDependencyNames) {
        return _.reduce(flatDependencies, function (resolvedDependencies, flatDependencyVersion, flatDependencyName) {
            var childDependency = allDependenciesIndex[flatDependencyName], resolvedDependency;

            if (childDependency) {
                resolvedDependency = new Dependency(
                    childDependency.name,
                    childDependency.version,
                    resolveDependencies(childDependency.dependencies, allDependenciesIndex, nonTopDependencyNames),
                    childDependency.fileName
                );

                if (nonTopDependencyNames.indexOf(childDependency.name) < 0) {
                    nonTopDependencyNames.push(childDependency.name);
                }
            } else {
                resolvedDependency = new ChildDependency('', flatDependencyName, flatDependencyVersion);
            }

            resolvedDependencies.push(resolvedDependency);

            return resolvedDependencies;
        }, []);
    }
}

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
