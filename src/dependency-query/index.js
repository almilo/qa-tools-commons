var path = require('path'), _ = require('lodash'), utils = require('../utils'),
    defaultRenderer = require('./rendering/console-renderer');

exports.Report = function (fileNames, query, sorting) {
    var dependencies = queryDependencies(query, fileNames, sorting);

    this.getDependencies = function () {
        return dependencies;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };
};

function queryDependencies(query, fileNames, sorting) {
    query = query.trim();
    sorting = sorting || 'byDepName';

    var sortings = {
        byDepName: by('name', 'fileName'),
        byFileName: by('fileName', 'name')
    };

    return fileNames
        .map(toFileNameAndDependencies)
        .reduce(queryDependencies, [])
        .sort(sortings[sorting]);

    function toFileNameAndDependencies(fileName) {
        var absoluteFileName = path.resolve(fileName);

        return {
            fileName: fileName,
            dependencies: require(absoluteFileName).dependencies
        };
    }

    function queryDependencies(result, fileNameAndDependencies) {
        result.concat(_.reduce(fileNameAndDependencies.dependencies, addMatches, []));

        return result;

        function addMatches(results, dependencyVersion, dependencyName) {
            if (query === '*' || dependencyName.indexOf(query) >= 0) {
                results.push(new Dependency(fileNameAndDependencies.fileName, dependencyName, dependencyVersion));
            }

            return result;
        }
    }
}

function Dependency(fileName, name, version) {
    this.fileName = fileName;
    this.name = name;
    this.version = version;
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
