'use strict';
var fs = require('fs');

function CodeChecker() {
}

CodeChecker.prototype = {
    parseFile : function () {
        var classes = this.collector.getClasses(),
            file = this.file;

        for (var key in classes) {
            var obj = classes[key],
                matches = file.match(obj['string']),
                matchesCount = matches && matches.length;

            if (matchesCount) {
                for (var i = 0; i < matchesCount; i++) {
                    this.collector.addClassUsage(obj);
                }
            }
        }
    },
    run : function (path, Collector, callback) {
        this.file = fs.readFileSync(path, 'utf8');
        this.collector = Collector;
        this.collector.setPath(path);

        this.parseFile();
        return callback();
    }
};

module.exports = CodeChecker;