/*
 * grunt-csschecker
 * https://github.com/timeinfeldt/grunt-csschecker
 *
 * Copyright (c) 2014 Tim Einfeldt
 * Licensed under the MIT license.
 */

'use strict';
var CSSChecker = require('../lib/csschecker'),
    CodeChecker = require('../lib/codechecker'),
    glob = require('glob'),
    fs = require('fs'),
    checks = require('../lib/checks/checks.js'),
    async = require('async'),
    reporters = require('../lib/reporters');

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('csschecker', 'Checks your CSS', function () {

        var done = this.async(),
            checksConfig = this.data.checks,
            data = {
                selectors : {},
                classes : {}
            },
            self = this;

        function getFilesFromPath(patterns, callback, options) {
            if (!patterns) {
                grunt.fail.warn('No source file paths found.');
            }
            var filesToBeAnalysed = [];
            async.eachSeries(patterns, function (f, next) {
                glob(f, options, function (er, files) {
                    if (files.length === 0) {
                        grunt.fail.warn('No files matching "' + f + '" found.');
                    }
                    for (var j = 0; j < files.length; j++) {
                        if (filesToBeAnalysed.indexOf(files[j]) < 0) {
                            filesToBeAnalysed.push(files[j]);
                        }
                    }
                    next();
                });
            }, function () {
                callback(filesToBeAnalysed);
            });
        }

        function runChecks() {
            var report = {
                types : {}
            };

            for (var type in checksConfig) {

                if (!data.hasOwnProperty(type)) {
                    grunt.fail.warn('No data for ' + type + ' checks.');
                }

                var checkGroupData = data[type];

                report.types[type] = [];

                for (var check in checksConfig[type]) {
                    grunt.log.subhead('Running ' + check);

                    if (checks.hasOwnProperty(check)) {
                        for (var key in checkGroupData) {
                            var d = checkGroupData[key],
                                opts = checksConfig[type][check].options,
                                result = checks[check](d, opts);

                            if (result) {
                                report.types[type].push({
                                    message : result
                                });
                            }
                        }
                    } else {
                        grunt.log.error('Check ' + check + ' not found, skipping.');
                    }
                }
            }
            grunt.log.ok(JSON.stringify(data, null, 4));
            //grunt.file.write(self.data.options.checkstyle, reporters.checkstyle(report));
        }

        function analyseFiles(files, Analyser, callback) {
            grunt.log.subhead('Running ' + Analyser.name + ' (' + files.length + ' files)');
            var analyser = new Analyser();
            async.eachSeries(files, function (path, next) {
                if (!grunt.file.exists(path)) {
                    grunt.log.warn('File "' + path + '" not found.');
                    next();
                }

                grunt.log.verbose.writeln('Checking file: ' + path);

                analyser.check(path, data, function () {
                    grunt.log.verbose.ok('Finished ' + path);
                    next();
                });
            }, function () {
                grunt.log.writeln('done');
                callback();
            });
        }

        function run() {
            async.series([
                function (callback) {
                    grunt.log.writeln('getting css files');
                    getFilesFromPath(self.data.cssSrc, function (files) {
                        grunt.log.writeln('analysing css files');
                        analyseFiles(files, CSSChecker, callback);
                    });
                },
                function (callback) {
                    grunt.log.writeln('getting code files');
                    getFilesFromPath(self.data.codeSrc, function (files) {
                        grunt.log.writeln('analysing code files');
                        analyseFiles(files, CodeChecker, callback);
                    });
                }
            ],
                function (err) {
                    if (!err) {
                        runChecks();
                        done();
                    }
                });
        }

        run();
    });
};