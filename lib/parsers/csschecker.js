'use strict';
const parse = require('css-parse');
const fs = require('fs');
const flatten = require('flatten');
const helpers = require('../helpers/helpers');

function parseRules(file, parseResult) {
  const rules = parseResult.rules;

  return flatten(rules.map(rule => {
    if (rule.type !== 'rule') return [];

    const results = [];

    rule.selectors.forEach(selector => {
      const classMatches = helpers.getClassesFromSelector(selector);

      results.push({
        type: 'selector',
        selector,
        file,
        line: rule.position.start.line,
        column: rule.position.start.column,
      });

      classMatches.forEach(className => {
        results.push({
          type: 'class',
          className,
          file,
          line: rule.position.start.line,
          column: rule.position.start.column,
        });
      });
    });

    rule.declarations.forEach(declaration => {
      results.push({
        type: 'declaration',
        declaration,
        file,
        line: rule.position.start.line,
        column: rule.position.start.column,
      });
    });

    return results;
  }));
}

module.exports = function csschecker(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, content) => {
      if (err) reject(err);
      else resolve(content);
    });
  })
    .then(contents => parse(contents).stylesheet)
    .then(parseResult => parseRules(file, parseResult));
};
