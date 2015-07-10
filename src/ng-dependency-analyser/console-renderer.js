module.exports = function consoleRenderer(report) {
    report.getEntries().forEach(function (entry) {
        console.log(entry.filename + ' => ' + entry.dependency);
    });
};
