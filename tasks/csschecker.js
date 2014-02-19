/*
 * grunt-csschecker
 * https://github.com/timeinfeldt/grunt-csschecker
 *
 * Copyright (c) 2014 Tim Einfeldt
 * Licensed under the MIT license.
 */

'use strict';
var CSSChecker = require('../lib/parsers/csschecker'),
    CodeChecker = require('../lib/parsers/codechecker'),
    glob = require('glob'),
    fs = require('fs'),
    checks = require('../lib/checks/checks.js'),
    async = require('async'),
    moment = require('moment'),
    reporters = require('../lib/reporters'),
    Collector = require('../lib/collectors/collector');

module.exports = function (grunt) {

    grunt.registerMultiTask('csschecker', 'Checks your CSS', function () {
        var done = this.async(),
            checksConfig = this.data.checks,
            data = {
                selectors : {},
                classes : {}
            },
            self = this,
            collector = new Collector(data),
            start = moment();

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

                report.types[type] = {};

                for (var check in checksConfig[type]) {
                    grunt.log.subhead('Running ' + check);

                    if (checks.hasOwnProperty(check)) {

                        report.types[type][check] = [];

                        for (var key in checkGroupData) {
                            var d = checkGroupData[key],
                                opts = checksConfig[type][check].options,
                                result = checks[check](d, opts);

                            if (result) {
                                report.types[type][check].push({
                                    message : result
                                });
                            }
                        }
                    } else {
                        grunt.log.error('Check ' + check + ' not found, skipping.');
                    }
                }
            }
            grunt.file.write(self.data.options.checkstyle, reporters.checkstyle(report));
            grunt.file.write(self.data.options.plaintext, reporters.plaintext(report));
            //grunt.file.write(self.data.options.plaintext, JSON.stringify(report, null, 4));
        }

        function analyseFiles(files, Analyser, callback) {
            grunt.log.subhead('Running ' + Analyser.name + ' (' + files.length + ' files)');
            var analyser = new Analyser();

            files.forEach(function (path) {
                if (!grunt.file.exists(path)) {
                    grunt.log.warn('File "' + path + '" not found.');
                    return;
                }

                grunt.log.verbose.writeln('Checking file: ' + path);

                analyser.run(path, collector, function () {
                    grunt.log.verbose.ok('Finished ' + path);
                });

            });

            callback();
        }

        function run() {
            async.series([
                function (callback) {
                    getFilesFromPath(self.data.cssSrc, function (files) {
                        analyseFiles(files, CSSChecker, callback);
                    });
                },
                function (callback) {
                    getFilesFromPath(self.data.codeSrc, function (files) {
                        analyseFiles(files, CodeChecker, callback);
                    });
                }
            ],
                function (err) {
                    if (!err) {
                        runChecks();
                        done();
                        grunt.log.ok('Done after ' + moment().diff(start, 'seconds', true) + ' seconds.');
                    }
                });
        }
        run();
    });
};