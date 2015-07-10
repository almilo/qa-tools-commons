module.exports = function consoleRenderer(report) {
    console.log('Modules:');
    report.getModules().forEach(function (module) {
        console.log(module);
    });

    console.log();

    console.log('Injected dependencies:');
    report.getInjectedDependencies().forEach(function (entry) {
        console.log(entry.filename + ' => ' + entry.dependency);
    });
};
