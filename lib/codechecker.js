'use strict';
var parse = require('css-parse'),
    fs = require('fs'),
    humanize = require('humanize');

function CodeChecker(path, data) {
    this.path = path;
    this.file = fs.readFileSync(this.path, 'utf8');
    this.data = data;
    this.selectors = this.data.selectors;
    this.classes = this.data.classes;
}

CodeChecker.prototype = {

    humanize : function (bytes) {
        return humanize.filesize(bytes);
    },

    findClasses : function () {
        var classes = this.classes;

        for (var key in classes) {
            var obj = classes[key];

            var matches = this.file.match(obj['string']),
                matchesCount = matches && matches.length;

            if (matchesCount) {
                for (var i = 0; i < matchesCount; i++) {
                    if (obj.hasOwnProperty('usages')) {
                        obj['usages'].count += 1;
                        if (obj['usages'].locations.indexOf(this.path) < 0) {
                            obj['usages'].locations.push(this.path);
                        }
                    } else {
                        obj['usages'] = {
                            count : 1,
                            locations : [this.path]
                        };
                    }
                }
            }
        }
    },

    check : function (callback) {
        /*
         var selectors = this.selectors(),
         classes = this.classes(),
         rules = this.rules();
         */
        this.findClasses();

        /*
         callback({
         selectors : selectors,
         classes : classes,
         rules : rules
         });
         */

        callback(this.data);

        /*
         var self = this,
         rules = this.rules(),
         totalSelectors = this.selectors(),
         fileSize = this.fileSize();

         this.gzipSize(function (gzipSize) {
         callback({
         rules : rules,
         totalSelectors : totalSelectors,
         averageSelectors : +(totalSelectors / rules).toFixed(1),
         rawFileSize : fileSize,
         fileSize : self.humanize(fileSize),
         gzipSize : self.humanize(gzipSize)
         });
         });
         */
    }
};

module.exports = CodeChecker;