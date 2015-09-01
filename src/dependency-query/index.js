var path = require('path'), _ = require('lodash'), utils = require('../utils'),
    model = require('./model'), Dependency = model.Dependency, ChildDependency = model.ChildDependency,
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

    return new Report(dependencies, defaultGraphRenderer);

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
