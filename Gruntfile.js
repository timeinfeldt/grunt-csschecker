/*
 * grunt-csschecker
 * https://github.com/timeinfeldt/grunt-csschecker
 *
 * Copyright (c) 2014 Tim Einfeldt
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    grunt.option('stack', true);

    grunt.initConfig({
        csschecker : {
            dev : {
                options : {
                    checkstyle : 'out/checkstyle.xml'
                },
                cssSrc : [
                    'test/**/*.css'
                ],
                codeSrc : [
                    'test/**/*.html'
                ],
                checks : {
                    selectorLengthCheck : {
                        maxLength : 4
                    },
                    classUsageCheck : {
                        reportAll : false,
                        minUsage : 3
                    },
                    classNoUsageCheck : {
                    },
                    declarationsDefinitionsCheck : {
                        whiteList : [
                            'background',
                            'color'
                        ]
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
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    //grunt.registerTask('test', ['csschecker', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'csschecker:dev']);
};
