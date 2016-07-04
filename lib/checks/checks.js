'use strict';
const helpers = require('../helpers/helpers');

function selectorLengthCheck(data, classCounts, options) {
  const selectors = data.filter(result => result.type === 'selector');

  return selectors
    .map(selector => {
      // eslint-disable-next-line no-param-reassign
      selector.selectorLength = helpers.getSelectorLength(selector.selector);

      return selector;
    })
    .filter(selector => selector.selectorLength > options.maxLength)
    .map(selector => {
      // eslint-disable-next-line no-param-reassign
      selector.errors = selector.errors || [];
      selector.errors.push({
        message: `${selector.selector} is deeper than ${options.maxLength} levels.`,
        tag: 'selectorLengthCheck',
      });

      return selector;
    });
}

function classUsageCheck(data, classCounts, options) {
  const classes = data.filter(cls => cls.type === 'class');

  if (options.reportAll) {
    return classes.map(cls => {
      // eslint-disable-next-line no-param-reassign
      cls.errors = cls.errors || [];
      cls.errors.push({
        message: `${cls.className} has ${classCounts[cls.className]} usages.`,
        tag: 'classUsageCheck',
      });

      return cls;
    });
  }

  return classes
    .filter(cls => classCounts[cls.className] && classCounts[cls.className] < options.minUsage)
    .map(cls => {
      // eslint-disable-next-line no-param-reassign
      cls.errors = cls.errors || [];
      cls.errors.push({
        message: `${cls.className} has less than ${options.minUsage} usages.`,
        tag: 'classUsageCheck',
      });

      return cls;
    });
}

function classNoUsageCheck(data, classCounts, options) {
  const classes = data.filter(cls => cls.type === 'class');

  return classes
    .filter(cls => !classCounts[cls.className])
    .filter(cls =>
      !options.whitelist || !options.whitelist.some(pattern => cls.className.match(`^${pattern}$`))
    )
    .map(cls => {
      // eslint-disable-next-line no-param-reassign
      cls.errors = cls.errors || [];
      cls.errors.push({
        message: `${cls.className} is not used.`,
        tag: 'classNoUsageCheck',
      });

      return cls;
    });
}

function declarationsDefinitionsCheck(data, classCounts, options) {
  const declarations = data.filter(declaration => declaration.type === 'declaration');
  const counts = {};

  declarations.forEach(declaration => {
    counts[declaration.declaration.property] = counts[declaration.declaration.property] || 0;
    counts[declaration.declaration.property]++;
  });

  return declarations
    .map(declaration => {
      const property = declaration.declaration.property;
      if (!counts[property]) {
        // eslint-disable-next-line no-param-reassign
        declaration.errors = declaration.errors || [];
        declaration.errors.push({
          message: `${property} is not used.`,
          tag: 'declarationsDefinitionsCheck',
        });
      } else if (
        options.whiteList &&
        options.whiteList.indexOf(property) >= 0
      ) {
        // eslint-disable-next-line no-param-reassign
        declaration.errors = declaration.errors || [];
        declaration.errors.push({
          message: `${property} has ${counts[property]} usages.`,
          tag: 'declarationsDefinitionsCheck',
        });
      }

      return declaration;
    })
    .filter(declaration => declaration.errors && declaration.errors.length > 0);
}

exports.selectorLengthCheck = selectorLengthCheck;
exports.classUsageCheck = classUsageCheck;
exports.classNoUsageCheck = classNoUsageCheck;
exports.declarationsDefinitionsCheck = declarationsDefinitionsCheck;
