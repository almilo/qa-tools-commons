var _ = require('lodash'), jsParser = require('../utils').jsParser, defaultRenderer = require('./rendering/console-renderer'),
    ngExtractor = require('./ng-extractor'), extractModules = ngExtractor.extractModules,
    extractDependencies = ngExtractor.extractDependencies;

exports.Report = function (fileNames, urlTemplate) {
    var asts = fileNames.map(jsParser),
        modules = extractModules(asts, fileNames),
        injectedDependencies = extractDependencies(asts, fileNames),
        importNameToItem = indexByImportName(modules, injectedDependencies);

    this.getUrlTemplate = function () {
        return urlTemplate;
    };

    this.getModules = function () {
        return modules;
    };

    this.getInjectedDependencies = function () {
        return injectedDependencies;
    };


    this.getData = function () {
        return importNameToItem;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };

    function indexByImportName(modules, injectedDependencies) {
        var importNamesToItem = {};

        modules.forEach(addModuleItems);
        injectedDependencies.forEach(addItem);

        return importNamesToItem;

        function addModuleItems(module) {
            addItem(module);
            module.provides.forEach(addItem);
        }

        function addItem(item) {
            var currentItem = importNamesToItem[item.importName] || {};

            importNamesToItem[item.importName] = _.extend(currentItem, item);
        }
    }
};
