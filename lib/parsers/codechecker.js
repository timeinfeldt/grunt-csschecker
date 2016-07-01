'use strict';
var fs = require('fs');

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
    var readFile = fs.readFile;

    return new Promise(function(resolve, reject) { 
        fs.readFile(file, 'utf8', (err, content) => { err ? reject(err) : resolve(content); }); 
    })
    .then(function (contents) {
        return parseClasses(file, contents, classNames);
    });
};
