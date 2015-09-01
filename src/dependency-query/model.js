exports.ChildDependency = function (referringFileName, name, version) {
    this.referringFileName = referringFileName;
    this.name = name;
    this.version = version;
};

exports.Dependency = function (name, version, dependencies, fileName) {
    this.name = name;
    this.version = version;
    this.dependencies = dependencies;
    this.fileName = fileName;
};
