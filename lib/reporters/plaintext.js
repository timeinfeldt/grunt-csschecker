'use strict';

module.exports = function (report) {
    var txt = [];

    Object.keys(report.types).forEach(function (type) {
        txt.push('Checks for: ' + type);
        txt.push('====================');
        txt.push('\n');

        Object.keys(report.types[type]).forEach(function (check) {
            txt.push(check);
            txt.push('--------------------');

            var issues = report.types[type][check];
            issues.forEach(function (issue) {
                txt.push([
                    issue.message
                ].join(''))
            });
        });
        txt.push('\n');
    });
    return txt.join('\n');
};