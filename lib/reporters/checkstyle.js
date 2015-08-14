'use strict';

var builder = require('xmlbuilder');

module.exports = function (results) {
    var xml = builder.create('checkstyle', { version: '1.0', encoding: 'utf-8' });

    var resultsByFile = {};
    results.forEach(function (result) {
        resultsByFile[result.path] = resultsByFile[result.path] || [];
        resultsByFile[result.path].push(result);
    });

    Object.keys(resultsByFile).forEach(function (path) {
        var results = resultsByFile[path];

        results.forEach(function (result) {
            var file = xml.ele('file', { name: result.path });

            result.errors.forEach(function (error) {
                file.ele('error', {
                    line: result.line,
                    column: result.column,
                    severity: 'warning',
                    message: error,
                    source: 'com.csschecker'
                });
            });

            file.end();
        });
    });

    return xml.end({ pretty: true })
};
