var helpers = require('../helpers/helpers');

exports.selectorLengthCheck = function (data, options) {
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
            result.errors.push(result.selector + ' is deeper than ' + options.maxLength + ' levels.');

            result.errorsTags = result.errorsTags || [];
            result.errorsTags.push('selectorLengthCheck');

            return result;
        });
};

exports.classUsageCheck = function (data, options) {
    var classUsages = data.filter(function (result) {
        return result.type === 'classUsage';
    });

    var counts = {};
    classUsages.forEach(function (result) {
        counts[result.className] = counts[result.className] || 0;
        counts[result.className]++;
    });

    var classes = data.filter(function (result) {
        return result.type === 'class';
    });

    if (options.reportAll) {
        return classes
            .map(function (result) {
                result.errors = result.errors || [];
                result.errors.push(data.className + ' has ' + counts[data.className] + ' usages.');

                result.errorsTags = result.errorsTags || [];
                result.errorsTags.push('classUsageCheck');

                return result;
            });
    }

    return classes
        .filter(function (result) {
            return counts[result.className] && counts[result.className] < options.minUsage;
        })
        .map(function (result) {
            result.errors = result.errors || [];
            result.errors.push(result.className + ' has less than ' + options.minUsage + ' usages.');

            result.errorsTags = result.errorsTags || [];
            result.errorsTags.push('classUsageCheck');

            return result;
        });
};

exports.classNoUsageCheck = function (data, options) {
    var classUsages = data.filter(function (result) {
        return result.type === 'classUsage';
    });

    var counts = {};
    classUsages.forEach(function (result) {
        counts[result.className] = counts[result.className] || 0;
        counts[result.className]++;
    });

    var classes = data.filter(function (result) {
        return result.type === 'class';
    });

    return classes
        .filter(function (result) {
            return !counts[result.className];
        })
        .map(function (result) {
            result.errors = result.errors || [];
            result.errors.push(result.className + ' is not used.');

            result.errorsTags = result.errorsTags || [];
            result.errorsTags.push('classNoUsageCheck');

            return result;
        });
};

exports.declarationsDefinitionsCheck = function (data, options) {
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
                result.errors.push(result.declaration.property + ' is not used.');

                result.errorsTags = result.errorsTags || [];
                result.errorsTags.push('declarationsDefinitionsCheck');
            } else if (options.whiteList.indexOf(result.declaration.property) >= 0) {
                result.errors = result.errors || [];
                result.errors.push(result.declaration.property + ' has ' + counts[result.declaration.property] + ' usages.');

                result.errorsTags = result.errorsTags || [];
                result.errorsTags.push('declarationsDefinitionsCheck');
            }

            return result;
        })
        .filter(function (result) {
            return result.errors && result.errors.length > 0;
        });
};
