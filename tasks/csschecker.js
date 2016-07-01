/*
 * grunt-csschecker
 * https://github.com/timeinfeldt/grunt-csschecker
 *
 * Copyright (c) 2014-2016 Tim Einfeldt
 * Licensed under the MIT license.
 */
/* global grunt */
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
        return arr.indexOf(elem) === pos;
    });
};

function objectCombine(keys, values) {
    var result = {};
    for (var i = 0; i < keys.length; i++) {
        result[keys[i]] = values[i];
    }
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

function mapQueued(numConcurrent, keys, fn) {
    var queue = new Queue(numConcurrent, Infinity);
    var promises = keys.map(function (key) {
        return queue.add(function () {
            return fn(key);
        });
    });
    return promises;
}

function resolveSourceMaps(results) {
    var cssFiles = results
        .map(function (result) { return result.file; })
        .filter(function (file) { return file.match(/\.css$/); });
    cssFiles = uniqueArray(cssFiles);

    var promises = mapQueued(50, cssFiles, loadSourceMap);

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
                            var promises = mapQueued(50, files, function (file) {
                                return codeCheckerParse(file, classNames);
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
                .then(resolveSourceMaps)
                .then(function (results) {
                    if (self.data.options.checkstyle) {
                        grunt.file.write(self.data.options.checkstyle, reporters.checkstyle(results));
                    }

                    done();
                })
                .done();
        });
    });
};
