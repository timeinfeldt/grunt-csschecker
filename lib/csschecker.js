'use strict';
var parse = require('css-parse'),
    fs = require('fs'),
    humanize = require('humanize');

function CSSChecker(path, data) {
    this.path = path;
    this.file = fs.readFileSync(this.path, 'utf8');
    this.parsedData = parse(this.file).stylesheet;
    this.data = data;
    this.selectors = this.data.selectors;
    this.classes = this.data.classes;
}

CSSChecker.prototype = {

    humanize : function (bytes) {
        return humanize.filesize(bytes);
    },

    rules : function () {
        return this.parsedData.rules;
    },

    getSelectors : function () {
        var rules = this.rules(),
            rulesCount = rules.length,
            selectors = this.selectors;

        for (var i = 0; i < rulesCount; i++) {
            var rule = rules[i];
            if (rule.type === 'rule') {
                var selectorsCount = rule.selectors.length;
                for (var j = 0; j < selectorsCount; j++) {
                    var selector = rule.selectors[j];

                    if (selectors.hasOwnProperty(selector)) {
                        selectors[selector].definitions.count += 1;
                        if (selectors[selector].definitions.locations.indexOf(this.path) < 0) {
                            selectors[selector].definitions.locations.push(this.path);
                        }
                    } else {
                        selectors[selector] = {
                            string : selector,
                            definitions : {
                                count : 1,
                                locations : [this.path]
                            }
                        };
                    }
                }
            }
        }
    },

    getClasses : function () {
        var rules = this.rules(),
            l = rules.length,
            classes = this.classes;

        for (var i = 0; i < l; i++) {
            var rule = rules[i];
            if (rule.type === 'rule') {
                var selectorsCount = rule.selectors.length;
                for (var j = 0; j < selectorsCount; j++) {
                    var selector = rule.selectors[j],
                        matches = selector.match(/(\.[_a-z]+[_a-z0-9-:\\]*)/ig),
                        matchesCount = matches && matches.length;

                    if (matchesCount) {
                        for (var x = 0; x < matchesCount; x++) {
                            var className = matches[x];
                            if (classes.hasOwnProperty(className)) {
                                classes[className].definitions.count += 1;
                                if (classes[className].definitions.locations.indexOf(this.path) < 0) {
                                    classes[className].definitions.locations.push(this.path);
                                }
                            } else {
                                classes[className] = {
                                    string : className,
                                    definitions : {
                                        count : 1,
                                        locations : [this.path]
                                    }
                                };
                            }
                        }
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
        this.getSelectors();
        this.getClasses();

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

module.exports = CSSChecker;