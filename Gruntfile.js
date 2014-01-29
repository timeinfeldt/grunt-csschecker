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
                cssSrc : [
                    'test/css/test.css'
                ],
                codeSrc : [
                    'test/code/test.html'
                ],
                options : {
                    verbose : false,
                    checkstyle : 'out/checkstyle.xml'
                },
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
                                minUsage : 2
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
    grunt.registerTask('test', ['csschecker', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'csschecker:dev']);
};
