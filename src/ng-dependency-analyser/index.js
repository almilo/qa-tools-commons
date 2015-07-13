var jsParser = require('../utils').jsParser, defaultRenderer = require('./rendering/console-renderer'),
    ngExtractor = require('./ng-extractor'), extractModules = ngExtractor.extractModules,
    extractDependencies = ngExtractor.extractDependencies;

exports.Report = function (filenames) {
    var asts = filenames.map(jsParser),
        modules = extractModules(asts, filenames),
        injectedDependencies = extractDependencies(asts, filenames);

    this.getModules = function () {
        return modules;
    };

    this.getInjectedDependencies = function () {
        return injectedDependencies;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };
};
