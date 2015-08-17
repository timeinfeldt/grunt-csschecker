/*
 * grunt-csschecker
 * https://github.com/timeinfeldt/grunt-csschecker
 *
 * Copyright (c) 2014 Tim Einfeldt
 * Licensed under the MIT license.
 */

'use strict';
var cssCheckerParse = require('../lib/parsers/csschecker'),
    codeCheckerParse = require('../lib/parsers/codechecker'),
    Promise = require('promise'),
    glob = Promise.denodeify(require('glob')),
    async = require('async'),
    flatten = require('flatten'),
    checks = require('../lib/checks/checks.js'),
    reporters = require('../lib/reporters');

function getCssResultsClassNames(results) {
    return results
        .filter(function (result) {
            return result.type === 'class';
        })
        .map(function (result) {
            return result.className;
        });
}

function getFilesFromPath(patterns, options) {
    if (!patterns) {
        grunt.fail.warn('No source file paths found.');
    }

    return Promise.all(patterns.map(function (pattern) {
        return glob(pattern, options);
    }));
}

var uniqueArray = function (arr) {
    return arr.filter(function(elem, pos) {
        return arr.indexOf(elem) == pos;
    });
};

var objectValues = function (obj) {
    var vals = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            vals.push(obj[key]);
        }
    }
    return vals;
};

var mergeClassCounts = function (classCountsList) {
    var merged = {};
    classCountsList.forEach(function (classCounts) {
        Object.keys(classCounts).forEach(function (key) {
            merged[key] = merged[key] || 0;
            merged[key] += classCounts[key];
        });
    });
    return merged;
};

module.exports = function (grunt) {
    grunt.registerMultiTask('csschecker', 'Checks your CSS', function () {
        var done = this.async(),
            checksConfig = this.data.checks,
            self = this;

        var cssResults = getFilesFromPath(this.data.cssSrc)
            .then(flatten)
            .then(function (paths) {
                return Promise.all(paths.map(cssCheckerParse));
            })
            .then(flatten);

        cssResults.then(function (results) {
            return Promise.resolve(getCssResultsClassNames(results))
                .then(function (classNames) {
                    return getFilesFromPath(self.data.codeSrc)
                        .then(flatten)
                        .then(function (paths) {
                            return Promise.all(paths.map(function (path) {
                                return codeCheckerParse(path, classNames);
                            }));
                        })
                        .then(mergeClassCounts);
                })
                .then(function (classCounts) {
                    return Object.keys(checksConfig).map(function (checkName) {
                        var check = checks[checkName],
                            config = checksConfig[checkName];

                        return check(results, classCounts, config);
                    });
                })
                .then(flatten)
                .then(function (results) {
                    return results
                        .reduce(function (acc, result) {
                            var key = [result.type, result.path, result.line, result.column].join(':');

                            if (!acc[key]) {
                                acc[key] = {
                                    type: result.type,
                                    path: result.path,
                                    line: result.line,
                                    column: result.column,
                                    errors: []
                                };
                            }

                            acc[key].errors = acc[key].errors.concat(result.errors);
                            acc[key].errors = uniqueArray(acc[key].errors);

                            return acc;
                        }, {});
                })
                .then(objectValues)
                .then(function (results) {
                    if (self.data.options.checkstyle) {
                        grunt.file.write(self.data.options.checkstyle, reporters.checkstyle(results));
                    }
                    /*if (self.data.options.plaintext) {
                     grunt.file.write(self.data.options.plaintext, reporters.plaintext(results));
                     }
                     if (self.data.options.json) {
                     grunt.file.write(self.data.options.json, reporters.json(results));
                     }
                     if (self.data.options.html) {
                     grunt.file.write(self.data.options.html, reporters.html(results));
                     }*/

                    done();
                })
                .done();
        });
    });
};
