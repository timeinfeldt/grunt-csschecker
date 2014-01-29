'use strict';
var parse = require('css-parse'),
    fs = require('fs');

function CodeChecker(path, data) {
    this.path = path;
    this.file = fs.readFileSync(this.path, 'utf8');
    this.data = data;
    this.selectors = this.data.selectors;
    this.classes = this.data.classes;
}

CodeChecker.prototype = {
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
        this.findClasses();
        callback(this.data);
    }
};

module.exports = CodeChecker;