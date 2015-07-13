var jsParser = require('../utils').jsParser, defaultRenderer = require('./rendering/console-renderer'),
    ngExtractor = require('./ng-extractor'), extractModules = ngExtractor.extractModules,
    extractDependencies = ngExtractor.extractDependencies;

exports.Report = function (fileNames, urlTemplate) {
    var asts = fileNames.map(jsParser),
        modules = extractModules(asts, fileNames),
        injectedDependencies = extractDependencies(asts, fileNames),
        importNamesToFileNames = extractFileNames(modules, injectedDependencies);

    this.getUrlTemplate = function () {
        return urlTemplate;
    };

    this.getModules = function () {
        return modules;
    };

    this.getInjectedDependencies = function () {
        return injectedDependencies;
    };

    this.getImportNamesToFileNames = function () {
        return importNamesToFileNames;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };

    function extractFileNames(modules, injectedDependencies) {
        var importNamesToFileNames = {};

        modules.forEach(addImportNameToFileNameMapping);
        injectedDependencies.forEach(addImportNameToFileNameMapping);

        return importNamesToFileNames;

        function addImportNameToFileNameMapping(itemWithImportNameAndFileName) {
            importNamesToFileNames[itemWithImportNameAndFileName.importName] = itemWithImportNameAndFileName.fileName;
        }
    }
};
