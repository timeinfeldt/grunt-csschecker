'use strict';
var Promise = require('promise'),
    fs = require('fs');

function parseClasses(file, contents, classNames) {
    var classCounts = {};

    classNames.forEach(function (className) {
        var matches = contents.match(className);

        if (matches) {
            if (!classCounts[className]) {
                classCounts[className] = 0;
            }

            classCounts[className] += matches.length;
        }
    });

    return classCounts;
}

module.exports = function (file, classNames) {
    var readFile = Promise.denodeify(fs.readFile);

    return readFile(file, 'utf8')
        .then(function (contents) {
            return parseClasses(file, contents, classNames);
        });
};
