var utils = require('../src/utils'), assert = utils.assert, expandFileNames = utils.expandFileNames, asArray = utils.asArray,
    Report = require('../src/dependency-query').Report;

module.exports = function (files, query) {
    assert(files, 'Error, "files" argument is required.');
    assert(query, 'Error, "query" argument is required.');

    files = asArray(files);

    var rendererName = 'console', renderer = rendererName && require('../src/dependency-query/rendering/' + rendererName + '-renderer');

    new Report(expandFileNames(files, true), query).render(renderer);
};
