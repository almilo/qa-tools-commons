var fs = require('fs'), path = require('path'), _ = require('lodash'), utils = require('../utils'),
    defaultRenderer = require('./rendering/console-renderer');

exports.Report = function (fileNames, query) {
    var dependencies = queryDependencies(query, fileNames);

    this.getDependencies = function () {
        return dependencies;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };
};

function queryDependencies(query, fileNames) {
    return fileNames
        .map(toFileNameAndDependencies)
        .reduce(queryDependencies, []);

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
            if (dependencyName.indexOf(query) >= 0) {
                var dependency = dependencyName + '@' + dependencyVersion;

                results.push(new Dependency(fileNameAndDependencies.fileName, dependency));
            }

            return result;
        }
    }
}

function Dependency(fileName, name) {
    this.getFileName = function () {
        return fileName;
    };

    this.getName = function () {
        return name;
    };
}
