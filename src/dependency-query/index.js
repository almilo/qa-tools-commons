var path = require('path'), _ = require('lodash'), utils = require('../utils'),
    defaultTableRenderer = require('./rendering/table-console-renderer'),
    defaultGraphRenderer = require('./rendering/graph-console-renderer');

exports.QueryReport = function (fileNames, query, sorting) {
    query = query.trim();

    var sortings = {
            byDepName: by('name', 'referringFileName'),
            byFileName: by('referringFileName', 'name')
        },
        dependencies = executeQuery(fileNames, addMatchingChildDependencies, sortings[sorting] || sortings.byDepName);

    return new Report(dependencies, defaultTableRenderer);

    function addMatchingChildDependencies(childDependenciesAccumulator, dependency) {
        _.forEach(dependency.dependencies, match);

        return childDependenciesAccumulator;

        function match(dependencyVersion, dependencyName) {
            if (query === '*' || dependencyName.indexOf(query) >= 0) {
                var childDependency = new ChildDependency(dependency.fileName, dependencyName, dependencyVersion);

                childDependenciesAccumulator.push(childDependency);
            }
        }
    }
};

exports.GraphReport = function (fileNames, query) {
    query = query.trim();

    var dependencies = executeQuery(fileNames, addMatchingDependency);

    return new Report(toGraphDependencies(dependencies), defaultGraphRenderer);

    function addMatchingDependency(dependenciesAccumulator, dependency) {
        if (matches(dependency.name)) {
            dependenciesAccumulator.push(filterNonMatchingDependencies(dependency));
        }

        return dependenciesAccumulator;

        function filterNonMatchingDependencies(dependency) {
            var filteredDependencies = _.reduce(dependency.dependencies, function (dependencyAccumulator, dependencyVersion, dependencyName) {
                if (matches(dependencyName)) {
                    dependencyAccumulator[dependencyName] = dependencyVersion;
                }

                return dependencyAccumulator;
            }, {});

            return new Dependency(dependency.name, dependency.version, filteredDependencies, dependency.fileName);
        }

        function matches(dependencyName) {
            return query === '*' || dependencyName.indexOf(query) >= 0;
        }
    }

    function toGraphDependencies(allDependencies) {
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
};

function executeQuery(fileNames, queryCallback, sorter) {
    var unsortedResults = fileNames
        .map(asDependency)
        .reduce(queryCallback, []);

    return sorter ? unsortedResults.sort(sorter) : unsortedResults;
}

function asDependency(fileName) {
    var absoluteFileName = path.resolve(fileName), dependency = require(absoluteFileName);

    return new Dependency(dependency.name, dependency.version, dependency.dependencies, fileName);
}

function Report(dependencies, defaultRenderer) {
    this.getDependencies = function () {
        return dependencies;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };
}

function ChildDependency(referringFileName, name, version) {
    this.referringFileName = referringFileName;
    this.name = name;
    this.version = version;
}

function Dependency(name, version, dependencies, fileName) {
    this.name = name;
    this.version = version;
    this.dependencies = dependencies;
    this.fileName = fileName;
}

function by(property1, property2) {
    return function (dependency1, dependency2) {
        var value1 = dependency1[property1], value2 = dependency2[property1];

        if (value1 === value2) {
            value1 = dependency1[property2];
            value2 = dependency2[property2];
        }

        return value1 < value2 ? -1 : 1;
    }
}
