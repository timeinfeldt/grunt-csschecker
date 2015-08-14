'use strict';
var Promise = require('promise'),
    fs = require('fs');

function parseClasses(path, file, classNames) {
    var results = [];

    classNames.forEach(function (className) {
        var regex = new RegExp(className, 'g'),
            match;

        while (match = regex.exec(file)) {
            var substr = file.substring(0, match.index),
                line = (substr.match(/\n/g) || []).length,
                column = substr.length - substr.lastIndexOf("\n");

            results.push({
                type: 'classUsage',
                className: className,
                path: path,
                line: line,
                column: column
            });
        }
    });

    return results;
}

module.exports = function (path, classNames) {
    var readFile = Promise.denodeify(fs.readFile);

    return readFile(path, 'utf8')
        .then(function (file) {
            return parseClasses(path, file, classNames);
        });
};
