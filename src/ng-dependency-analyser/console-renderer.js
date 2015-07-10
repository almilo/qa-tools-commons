var indent = require('../utils').indent;

module.exports = function consoleRenderer(report) {
    console.log('Modules:');
    report.getModules().forEach(function (module) {
        console.log(module.name);

        renderCollection('requires:', module.requires);
        renderCollection('provides:', module.injectables);
    });

    console.log();

    console.log('Injected dependencies:');
    report.getInjectedDependencies().forEach(function (entry) {
        console.log(entry.injectable + ' is used in "' + entry.filename + '"');
    });

    function renderCollection(title, collection) {
        if (collection.length > 0) {
            console.log(indent(1, title));
            collection.forEach(function (item) {
                console.log(indent(2, item));
            });
        }
    }
};
