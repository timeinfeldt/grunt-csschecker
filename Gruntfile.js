/*
 * grunt-csschecker
 * https://github.com/timeinfeldt/grunt-csschecker
 *
 * Copyright (c) 2014 Tim Einfeldt
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        csschecker : {
            dev : {
                options : {
                    json : 'out/report.json',
                    plaintext : 'out/report.txt',
                    checkstyle : 'out/checkstyle.xml',
                    html : 'out/report.html'
                },
                cssSrc : [
                    'test/css/test.css'
                ],
                codeSrc : [
                    'test/code/test.html'
                ],
                checks : {
                    selectors : {
                        selectorLengthCheck : {
                            options : {
                                maxLength : 4
                            }
                        }
                    },
                    classes : {
                        classUsageCheck : {
                            options : {
                                reportAll : false,
                                minUsage : 3
                            }
                        },
                        classNoUsageCheck : {
                            options : {}
                        }
                    },
                    declarations : {
                        declarationsDefinitionsCheck : {
                            options : {
                                whiteList : [
                                    'background',
                                    'color'
                                ]
                            }
                        }
                    }
                }
            },
            rg: {
                options: {
                    html : 'out/report.html'
                },
                cssSrc: [
                    '/Users/einfeldt/checkouts/trunk/webroot/styles/**/*.css'
                ],
                codeSrc: [
                    '/Users/einfeldt/checkouts/trunk/webroot/modules/**/*.html'
                ],
                checks: {
                    selectors: {
                        selectorLengthCheck: {
                            options: {
                                maxLength: 4
                            }
                        }
                    },
                    classes: {
                        classUsageCheck: {
                            options: {
                                reportAll: false,
                                minUsage: 2
                            }
                        },
                        classNoUsageCheck: {
                            options: {}
                        }
                    },
                    declarations: {
                        declarationsDefinitionsCheck: {
                            options: {
                                whiteList: [
                                    'font-size',
                                    'color'
                                ]
                            }
                        }
                    }
                }
            }
        },
        jshint : {
            all : [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>'
            ],
            options : {
                jshintrc : '.jshintrc'
            }
        },
        // Unit tests.
        nodeunit : {
            tests : ['test/*_test.js']
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    //grunt.registerTask('test', ['csschecker', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'csschecker:dev']);
};
