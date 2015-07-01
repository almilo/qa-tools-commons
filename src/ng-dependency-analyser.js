var utils = require('./utils'),
    expandFilenames = utils.expandFilenames,
    jsParser = utils.jsParser,
    concatAll = utils.concatAll,
    estraverse = require('estraverse');

if (process.argv.length < 3) {
    console.error('usage: node ng-dependency-analyser.js <file matcher>');
    console.error();
    console.error('examples:');
    console.error('    node ng-dependency-analyser.js *.js');
    console.error('    node ng-dependency-analyser.js src/lib/**/**/*.js');

    process.exit(1);
}

var filenames = expandFilenames(process.argv.slice(2));

extractInjectedInjectables(filenames)
    .forEach(function (item) {
        console.log(item);
    }
);

function extractInjectedInjectables(filenames) {
    var asts = filenames.map(jsParser),
        injectables = asts
            .map(extractInjectables)
            .reduce(concatAll, []);

    return asts
        .map(extractInjected(injectables, filenames))
        .reduce(concatAll, []);

    function extractInjectables(ast) {
        var injectables = [];

        estraverse.traverse(ast, {
            enter: function (node) {
                var calledMember = memberCall(node);

                if (calledMember === 'factory' || calledMember === 'service' || calledMember === 'provider') {
                    injectables.push(node.arguments[0].value);
                }
            }
        });

        return injectables;

        function memberCall(node) {
            if (node.type === 'CallExpression') {
                var callee = node.callee;

                return callee.type === 'MemberExpression' && callee.property.type === 'Identifier' ? callee.property.name : undefined;
            } else {
                return undefined;
            }
        }
    }

    function extractInjected(injectables, filenames) {
        return function (ast, index) {
            var injected = [];

            estraverse.traverse(ast, {
                enter: function (node) {
                    var injectableCandidates = functionParameterNames(node);

                    if (injectableCandidates) {
                        injectableCandidates.forEach(function (injectableCandidate) {
                            if (injectables.indexOf(injectableCandidate) >= 0) {
                                injected.push(filenames[index] + ' => ' + injectableCandidate);
                            }
                        });
                    }
                }
            });

            return injected;

            function functionParameterNames(node) {
                if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                    return node.params.map(function (param) {
                        return param.name;
                    });
                }
            }
        };
    }
}
