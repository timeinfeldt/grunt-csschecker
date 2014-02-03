'use strict';
var fs = require('fs');

function CodeChecker() {
    console.log('Launching codechecker');
}

CodeChecker.prototype = {
    findClasses : function (path, data) {
        var classes = data.classes,
            file = this.readFile(path);

        for (var key in classes) {

            var obj = classes[key];

            var matches = file.match(obj['string']),
                matchesCount = matches && matches.length;

            if (matchesCount) {
                for (var i = 0; i < matchesCount; i++) {
                    if (obj.hasOwnProperty('usages')) {
                        obj['usages'].count += 1;
                        if (obj['usages'].locations.indexOf(path) < 0) {
                            obj['usages'].locations.push(path);
                        }
                    } else {
                        obj['usages'] = {
                            count : 1,
                            locations : [path]
                        };
                    }
                }
            }
        }
    },
    readFile : function (path) {
        return fs.readFileSync(path, 'utf8');
    },
    check : function (path, data, callback) {
        this.findClasses(path, data);
        return callback();
    }
};

module.exports = CodeChecker;