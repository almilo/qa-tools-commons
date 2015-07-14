var path = require('path'), _ = require('lodash');

exports.getImportNameForFileName = extractFileName;

exports.getImportNameForImportName = function (importName) {
    return isLocalModule(importName) ? extractFileName(importName) : asExternalModuleName(importName);

    function isLocalModule(importName) {
        return importName.indexOf('.') === 0;
    }

    function asExternalModuleName(importName) {
        var matches = importName.match(/(.*)\/module/);

        return (matches && matches[1]) || importName;
    }
};

function extractFileName(fileName) {
    return path.basename(fileName, path.extname(fileName));
}

exports.ImportResolver = function (fileName) {
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
            console.warn('Warning, could not resolve import for identifier: "' + identifier + '" in file: "' + fileName + '".');
        }

        return importNameAndIdentifiers && importNameAndIdentifiers.importName;
    };
};
