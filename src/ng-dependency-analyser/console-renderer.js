var indent = require('../utils').indent;

module.exports = function consoleRenderer(report) {
    console.log('Modules:');
    report.getModules().forEach(function (module) {
        console.log(module.name);

        module.injectables.forEach(function(injectable) {
            console.log(indent(1, injectable));
        });
    });

    console.log();

    console.log('Injected dependencies:');
    report.getInjectedDependencies().forEach(function (entry) {
        console.log(entry.injectable + ' => ' + entry.filename);
    });
};
