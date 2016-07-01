/*
 * grunt-csschecker
 * https://github.com/timeinfeldt/grunt-csschecker
 *
 * Copyright (c) 2014-2016 Tim Einfeldt
 * Licensed under the MIT license.
 */
/* global grunt, Promise */
'use strict';
var cssCheckerParse = require('../lib/parsers/csschecker'),
    codeCheckerParse = require('../lib/parsers/codechecker'),
    Queue = require('promise-queue'),
    glob = require('glob-promise'),
    flatten = require('flatten'),
    checks = require('../lib/checks/checks.js'),
    reporters = require('../lib/reporters'),
    sourceMap = require('source-map'),
    fs = require('fs'),
    path = require('path');

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

function getFilesFromPath(patterns) {
    if (!patterns) {
        grunt.fail.warn('No source file paths found.');
    }

    return Promise.all(patterns.map(function (pattern) {
        return glob(pattern);
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
    return new Promise(function(resolve, reject) { 
        fs.readFile(file + '.map', 'utf8', (err, content) => { err ? reject(err) : resolve(content); }); 
    })
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
                .then(function (results) {
                    resolveSourceMaps(results).then(function (innerResults) {
                        if (self.data.options.checkstyle) {
                            grunt.file.write(self.data.options.checkstyle, reporters.checkstyle(results));
                        }

                        done();
                    });
                });
        });
    });
};
