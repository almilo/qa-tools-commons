module.exports = function consoleRenderer(report) {
    report.getDependencies().forEach(renderDependency);

    function renderDependency(dependency) {
        console.log('File: ' + dependency.getFileName() + ', dependency: ' + dependency.getName());
    }
};
