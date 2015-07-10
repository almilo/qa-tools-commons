var indent = require('../../utils').indent;

module.exports = function consoleRenderer(report) {
    console.log('Modules:');
    report.getModules().forEach(function (module) {
        console.log(module.name);

        renderCollection('requires:', module.requires);
        renderCollection('provides:', module.injectables, 'name');
    });

    console.log();

    console.log('Dependencies:');
    report.getInjectedDependencies().forEach(function (dependency) {
        console.log(dependency.importName + ' uses:');
        dependency.injectables.forEach(function (injectable) {
            console.log(indent(1, injectable.name));
        });
    });

    function renderCollection(title, collection, property) {
        if (collection.length > 0) {
            console.log(indent(1, title));
            collection.forEach(function (item) {
                var text = property ? item[property] : item;

                console.log(indent(2, text));
            });
        }
    }
};
