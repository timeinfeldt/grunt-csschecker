'use strict';

module.exports = function gruntConfig(grunt) {
  grunt.option('stack', true);

  grunt.initConfig({
    csschecker: {
      dev: {
        options: {
          checkstyle: 'out/checkstyle.xml',
        },
        cssSrc: [
          'test/**/*.css',
        ],
        codeSrc: [
          'test/**/*.html',
        ],
        checks: {
          selectorLengthCheck: {
            maxLength: 4,
          },
          classUsageCheck: {
            reportAll: false,
            minUsage: 3,
          },
          classNoUsageCheck: {
          },
          declarationsDefinitionsCheck: {
            whiteList: [
              'background',
              'color',
            ],
          },
        },
      },
    },
  });

    // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  grunt.registerTask('test', ['csschecker:dev']);
  grunt.registerTask('default', ['test']);
};
