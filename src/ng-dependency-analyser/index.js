var _ = require('lodash'), jsParser = require('../utils').jsParser, defaultRenderer = require('./rendering/console-renderer'),
    ngExtractor = require('./ng-extractor'), extractModules = ngExtractor.extractModules,
    extractDependencies = ngExtractor.extractDependencies;

exports.Report = function (fileNames, urlTemplate) {
    var asts = fileNames.map(jsParser),
        modules = extractModules(asts, fileNames),
        injectedDependencies = extractDependencies(asts, fileNames),
        dataById = indexByImportName(modules, injectedDependencies),
        data = extractData(dataById);

    this.getUrlTemplate = function () {
        return urlTemplate;
    };

    this.getModules = function () {
        return modules;
    };

    this.getInjectedDependencies = function () {
        return injectedDependencies;
    };

    this.getDataById = function () {
        return dataById;
    };

    this.getData = function () {
        return data;
    };

    this.render = function () {
        var renderer = arguments[0];

        arguments[0] = this;

        (renderer || defaultRenderer).apply(undefined, arguments);
    };

    function extractData(dataById) {
        return _.values(dataById);
    }

    function indexByImportName(modules, injectedDependencies) {
        var importNamesToItem = {};

        modules.forEach(addModuleItems);
        injectedDependencies.forEach(addInjectedDependencyItems);

        return importNamesToItem;

        function addModuleItems(module) {
            addItem(module);
            module.provides.forEach(addItem);
        }

        function addInjectedDependencyItems(injectedDependency) {
            addItem(injectedDependency);
            injectedDependency.dependencies.forEach(addItem);
        }

        function addItem(item) {
            var currentItem = importNamesToItem[item.importName] || {};

            importNamesToItem[item.importName] = _.extend(currentItem, item);
        }
    }
};
