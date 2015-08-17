var helpers = require('../helpers/helpers');

exports.selectorLengthCheck = function (data, classCounts, options) {
    var selectors = data.filter(function (result) {
        return result.type === 'selector';
    });

    return selectors
        .map(function (result) {
            result.selectorLength = helpers.getSelectorLength(result.selector);

            return result;
        })
        .filter(function (result) {
            return result.selectorLength > options.maxLength;
        })
        .map(function (result) {
            result.errors = result.errors || [];
            result.errors.push({
                message: result.selector + ' is deeper than ' + options.maxLength + ' levels.',
                tag: 'selectorLengthCheck'
            });

            return result;
        });
};

exports.classUsageCheck = function (data, classCounts, options) {
    var classes = data.filter(function (result) {
        return result.type === 'class';
    });

    if (options.reportAll) {
        return classes
            .map(function (result) {
                result.errors = result.errors || [];
                result.errors.push({
                    message: data.className + ' has ' + classCounts[data.className] + ' usages.',
                    tag: 'classUsageCheck'
                });

                return result;
            });
    }

    return classes
        .filter(function (result) {
            return classCounts[result.className] && classCounts[result.className] < options.minUsage;
        })
        .map(function (result) {
            result.errors = result.errors || [];
            result.errors.push({
                message: result.className + ' has less than ' + options.minUsage + ' usages.',
                tag: 'classUsageCheck'
            });

            return result;
        });
};

exports.classNoUsageCheck = function (data, classCounts, options) {
    var classes = data.filter(function (result) {
        return result.type === 'class';
    });

    return classes
        .filter(function (result) {
            return !classCounts[result.className];
        })
        .map(function (result) {
            result.errors = result.errors || [];
            result.errors.push({
                message: result.className + ' is not used.',
                tag: 'classNoUsageCheck'
            });

            return result;
        });
};

exports.declarationsDefinitionsCheck = function (data, classCounts, options) {
    var declarations = data.filter(function (result) {
        return result.type === 'declaration';
    });

    var counts = {};
    declarations.forEach(function (result) {
        counts[result.declaration.property] = counts[result.declaration.property] || 0;
        counts[result.declaration.property]++;
    });

    return declarations
        .map(function (result) {
            if (!counts[result.declaration.property]) {
                result.errors = result.errors || [];
                result.errors.push({
                    message: result.declaration.property + ' is not used.',
                    tag: 'declarationsDefinitionsCheck'
                });
            } else if (options.whiteList.indexOf(result.declaration.property) >= 0) {
                result.errors = result.errors || [];
                result.errors.push({
                    message: result.declaration.property + ' has ' + counts[result.declaration.property] + ' usages.',
                    tag: 'declarationsDefinitionsCheck'
                });
            }

            return result;
        })
        .filter(function (result) {
            return result.errors && result.errors.length > 0;
        });
};
