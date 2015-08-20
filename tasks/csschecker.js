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
    Queue = require('promise-queue'),
    glob = Promise.denodeify(require('glob')),
    async = require('async'),
    flatten = require('flatten'),
    checks = require('../lib/checks/checks.js'),
    reporters = require('../lib/reporters'),
    sourceMap = require('source-map'),
    fs = require('fs'),
    path = require('path');

Queue.configure(Promise);

function reduce(promises, fn, initialValue) {
    var acc = initialValue;
    promises.forEach(function (promise) {
        promise.then(function (value) {
            acc = fn(acc, value);
        });
    });
    return Promise
        .all(promises)
        .then(function () {
            return acc;
        });
}

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

function objectCombine(keys, values) {
    var result = {};
    for (var i = 0; i < keys.length; i++)
        result[keys[i]] = values[i];
    return result;
}

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

function loadSourceMap(file) {
    var readFile = Promise.denodeify(fs.readFile);

    return readFile(file + '.map', 'utf8')
        .then(function (contents) {
            var rawSourceMap = JSON.parse(contents);
            rawSourceMap.sourceRoot = path.dirname(file);
            return new sourceMap.SourceMapConsumer(rawSourceMap);
        }, function (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            return Promise.reject(err);
        });
}

function resolveSourceMaps(results) {
    var cssFiles = results
        .map(function (result) { return result.file })
        .filter(function (file) { return file.match(/\.css$/); });
    cssFiles = uniqueArray(cssFiles);

    var queue = new Queue(50, Infinity);
    var promises = cssFiles.map(function (file) {
        return queue.add(function () {
            return loadSourceMap(file);
        });
    });
    return Promise.all(promises)
        .then(function (sourceMaps) {
            var sourceMapsByCssFile = objectCombine(cssFiles, sourceMaps);

            return results.map(function (result) {
                var consumer = sourceMapsByCssFile[result.file];

                if (!consumer) {
                    return result;
                }

                var position = consumer.originalPositionFor({
                    line: result.line,
                    column: result.column
                });

                result.file = position.source;
                result.line = position.line;
                result.column = position.column;

                return result;
            });
        });
}

module.exports = function (grunt) {
    grunt.registerMultiTask('csschecker', 'Checks your CSS', function () {
        var done = this.async(),
            checksConfig = this.data.checks,
            self = this;

        var cssResults = getFilesFromPath(this.data.cssSrc)
            .then(flatten)
            .then(function (files) {
                return Promise.all(files.map(cssCheckerParse));
            })
            .then(flatten);

        cssResults.then(function (results) {
            return Promise.resolve(getCssResultsClassNames(results))
                .then(function (classNames) {
                    return getFilesFromPath(self.data.codeSrc)
                        .then(flatten)
                        .then(function (files) {
                            var queue = new Queue(50, Infinity);
                            var promises = files.map(function (file) {
                                return queue.add(function () {
                                    return codeCheckerParse(file, classNames);
                                });
                            });
                            return reduce(promises, function(acc, value) {
                                return mergeClassCounts([acc, value]);
                            }, {});
                        });
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
                            var key = [result.type, result.file, result.line, result.column].join(':');

                            if (!acc[key]) {
                                acc[key] = {
                                    type: result.type,
                                    file: result.file,
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
                .then(resolveSourceMaps)
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
