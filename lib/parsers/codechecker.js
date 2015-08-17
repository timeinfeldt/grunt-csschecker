'use strict';
var Promise = require('promise'),
    fs = require('fs');

function parseClasses(path, file, classNames) {
    var classCounts = {};

    classNames.forEach(function (className) {
        var matches = file.match(className),
            count = matches ? matches.length : 0;

        if (!classCounts[className]) {
            classCounts[className] = 0;
        }

        classCounts[className] += count;
    });

    return classCounts;
}

module.exports = function (path, classNames) {
    var readFile = Promise.denodeify(fs.readFile);

    return readFile(path, 'utf8')
        .then(function (file) {
            return parseClasses(path, file, classNames);
        });
};
