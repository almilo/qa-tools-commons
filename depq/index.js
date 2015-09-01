var utils = require('../src/utils'), assert = utils.assert, expandFileNames = utils.expandFileNames, asArray = utils.asArray,
    dependencyQuery = require('../src/dependency-query'), QueryReport = dependencyQuery.QueryReport,
    GraphReport = dependencyQuery.GraphReport;

exports.query = function (files, query, sorting) {
    assert(files, 'Error, "files" argument is required.');
    assert(query, 'Error, "query" argument is required.');

    files = asArray(files);

    var rendererName = 'console', renderer = rendererName && require('../src/dependency-query/rendering/table-' + rendererName + '-renderer');

    new QueryReport(expandFileNames(files, true), query, sorting).render(renderer);
};

exports.graph = function (files, query, rendererName, outputFilename, overwrite) {
    assert(files, 'Error, "files" argument is required.');
    assert(query, 'Error, "query" argument is required.');

    files = asArray(files);
    rendererName = rendererName || 'console';

    var renderer = rendererName && require('../src/dependency-query/rendering/graph-' + rendererName + '-renderer');

    new GraphReport(expandFileNames(files, true), query).render(renderer, outputFilename, overwrite);
};
