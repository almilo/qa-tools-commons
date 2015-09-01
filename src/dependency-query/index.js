var path = require('path'), _ = require('lodash'), utils = require('../utils'),
    defaultRenderer = require('./rendering/console-renderer');

exports.QueryReport = function (fileNames, query, sorting) {
    query = query.trim();

    var sortings = {
            byDepName: by('name', 'fileName'),
            byFileName: by('fileName', 'name')
        },
        dependencies = executeQuery(fileNames, addMatchingChildDependencies, sorting || 'byDepName', sortings);

    return new Report(dependencies);

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

exports.GraphReport = function (fileNames, query, sorting) {
    query = query.trim();

    var sortings = {
            byDependencyChain: byInterDependency
        },
        dependencies = executeQuery(fileNames, addMatchingDependency, sorting || 'byDependencyChain', sortings);

    return new Report(dependencies);

    function addMatchingDependency(dependenciesAccumulator, dependency) {
        if (query === '*' || dependency.name.indexOf(query) >= 0) {
            dependenciesAccumulator.push(dependency);
        }

        return dependenciesAccumulator;
    }
};

function executeQuery(fileNames, queryCallback, sorting, sortings) {
    return fileNames
        .map(asDependency)
        .reduce(queryCallback, [])
        .sort(sortings[sorting]);
}

function asDependency(fileName) {
    var absoluteFileName = path.resolve(fileName), dependency = require(absoluteFileName);

    return new Dependency(dependency.name, dependency.dependencies, fileName);
}

function Report(dependencies) {
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

function Dependency(name, dependencies, fileName) {
    this.name = name;
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

function byInterDependency(dependency1, dependency2) {
    var dependencies1 = _.keys(dependency1.dependencies),
        dependencies2 = _.keys(dependency2.dependencies);

    if (_.includes(dependencies1, dependency2.name)) {
        return 1;
    }
    if (_.includes(dependencies2, dependency1.name)) {
        return -1;
    }
    return 0;
}
