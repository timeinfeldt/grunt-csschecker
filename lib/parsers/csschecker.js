'use strict';
var Promise = require('promise'),
    parse = require('css-parse'),
    fs = require('fs'),
    flatten = require('flatten'),
    helpers = require('../helpers/helpers');

function parseRules(path, parseResult) {
    var rules = parseResult.rules;

    return flatten(rules.map(function (rule) {
        if (rule.type !== 'rule') {
            return [];
        }

        var results = [];

        rule.selectors.forEach(function (selector) {
            var classMatches = helpers.getClassesFromSelector(selector);

            results.push({
                type: 'selector',
                selector: selector,
                path: path,
                line: rule.position.start.line,
                column: rule.position.start.column
            });

            classMatches.forEach(function (className) {
                results.push({
                    type: 'class',
                    className: className,
                    path: path,
                    line: rule.position.start.line,
                    column: rule.position.start.column
                });
            });
        });

        rule.declarations.forEach(function (declaration) {
            results.push({
                type: 'declaration',
                declaration: declaration,
                path: path,
                line: rule.position.start.line,
                column: rule.position.start.column
            });
        });

        return results;
    }));
}

module.exports = function (path) {
        var readFile = Promise.denodeify(fs.readFile);

    return readFile(path, 'utf8')
        .then(function (file) {
            return parse(file).stylesheet;
        })
        .then(function (parseResult) {
            return parseRules(path, parseResult);
        });
};
