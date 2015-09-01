var path = require('path'), _ = require('lodash'), pngRenderer = require('../../commons/rendering/png-renderer');

module.exports = function (report, outputFilename) {
    var flatDependencies = asFlatDependencies(report.getDependencies());

    return pngRenderer(path.join(__dirname, 'template.dot'), flatDependencies, outputFilename);

    function asFlatDependencies(dependencies) {
        return dependencies.reduce(function (result, dependency) {
            result.push({
                name: dependency.name,
                version: dependency.version,
                dependencies: _.keys(dependency.dependencies)
            });

            return result;
        }, []);
    }
};
