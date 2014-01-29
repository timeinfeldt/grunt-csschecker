'use strict';

//var util = require('./util');

module.exports = function (report) {
    var xml = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<checkstyle>'
    ];

    Object.keys(report.types).forEach(function (type) {
        var issues = report.types[type];

        xml.push('<file name="' + type + '">');

        issues.forEach(function (issue) {
            xml.push([
                '<error',
                //' line="' + issue.line + '"',
                //' column="' + issue.character + '"',
                ' severity="warning"',
                ' message="' + issue.message + '"',
                ' source="com.csschecker"',
                '/>'
            ].join(''))
        });

        xml.push('</file>');
    });

    xml.push('</checkstyle>');

    return xml.join('\n');
};