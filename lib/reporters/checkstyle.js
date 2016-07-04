'use strict';

function encodeHTML(str) {
  return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = function checkstyle(results) {
  const xml = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<checkstyle>',
  ];

  const resultsByFile = {};
  results.forEach(result => {
    resultsByFile[result.file] = resultsByFile[result.file] || [];
    resultsByFile[result.file].push(result);
  });

  Object.keys(resultsByFile).forEach(file => {
    const fileResults = resultsByFile[file];

    xml.push(`<file name="${encodeHTML(file)}">`);

    fileResults.forEach(result => {
      result.errors.forEach(error => {
        const props = new Map([
          ['line', result.line],
          ['column', result.column],
          ['severity', 'warning'],
          ['message', encodeHTML(error.message)],
          ['source', `com.csschecker.${error.tag}`],
        ]);

        xml.push(
          `<error ${Array.from(props).map((entry) => `${entry[0]}="${entry[1]}"`).join(' ')} />`
        );
      });
    });

    xml.push('</file>');
  });

  xml.push('</checkstyle>');

  return xml.join('\n');
};
