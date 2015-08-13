'use strict';

//var util = require('./util');

var encodeHTML = function (str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

module.exports = function (report) {
    var xml = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<checkstyle>'
    ];

    Object.keys(report.types).forEach(function (type) {

        xml.push('<file name="' + type + '">');

        Object.keys(report.types[type]).forEach(function (check) {
            var issues = report.types[type][check];
            issues.forEach(function (issue) {
                xml.push([
                    '<error',
                    //' line="' + issue.line + '"',
                    //' column="' + issue.character + '"',
                    ' severity="warning"',
                    ' message="' + encodeHTML(issue.message) + '"',
                    ' source="com.csschecker"',
                    '/>'
                ].join(''))
            });
        });
        xml.push('</file>');
    });

    xml.push('</checkstyle>');

    return xml.join('\n');
};
