var path = require('path'), _ = require('lodash');

exports.getImportNameForFilename = function (filename) {
    return path.basename(filename, path.extname(filename));
};

exports.ImportResolver = function (filename) {
    var importsNamesAndIdentifiers = [];

    this.addImportNameAndIdentifiers = function (importNameAndIdentifiers) {
        importsNamesAndIdentifiers.push(importNameAndIdentifiers);
    };

    this.getImportNameForIdentifier = function (identifier) {
        var importNameAndIdentifiers = _.find(importsNamesAndIdentifiers, function (importNameAndIdentifiers) {
            return importNameAndIdentifiers.identifiers.indexOf(identifier) >= 0 ||
                importNameAndIdentifiers.identifiers.indexOf(identifier + 'Directive') >= 0;
        });

        if (!importNameAndIdentifiers) {
            console.warn('Warning, could not resolve import for identifier: "' + identifier + '" in file: "' + filename + '".');
        }

        return importNameAndIdentifiers && importNameAndIdentifiers.importName;
    };
};
