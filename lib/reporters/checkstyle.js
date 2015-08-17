'use strict';

var encodeHTML = function (str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

module.exports = function (results) {
    var xml = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<checkstyle>'
    ];

    var resultsByFile = {};
    results.forEach(function (result) {
        resultsByFile[result.path] = resultsByFile[result.path] || [];
        resultsByFile[result.path].push(result);
    });

    Object.keys(resultsByFile).forEach(function (path) {
        var results = resultsByFile[path];

        results.forEach(function (result) {
            xml.push(['<file name="' + encodeHTML(result.path) + '">']);

            result.errors.forEach(function (error) {
                xml.push(['<error line="' + result.line + '" column="' + result.column + '" severity="warning" message="' + encodeHTML(error) + '" source="com.csschecker" />']);
            });

            xml.push(['</file>']);
        });
    });

    xml.push(['</checkstyle>']);

    return xml.join('\n');
};
