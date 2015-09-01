var path = require('path'), pngRenderer = require('../../commons/rendering/png-renderer');

module.exports = function (report, outputFilename) {
    return pngRenderer(path.join(__dirname, 'template.dot'), report, outputFilename);
};
