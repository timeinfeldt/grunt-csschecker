var Helpers = require('../helpers/helpers'),
    helpers = new Helpers();

exports.selectorLengthCheck = function (data, options) {
    var length = helpers.getSelectorLength(data.string);

    if (length > options.maxLength) {
        return data.string + ' is deeper than ' + options.maxLength + ' levels.';
    }
};

exports.classUsageCheck = function (data, options) {
    if (options.reportAll) {
        return data.string + ' has ' + data.usages.count + ' usages.';
    }
    if (data.usages && data.usages.count < options.minUsage) {
        return data.string + ' has less than ' + options.minUsage + ' usages.';
    }
};

exports.classNoUsageCheck = function (data, options) {
    if (!data.usages) {
        return data.string + ' is not used.';
    }
};

exports.declarationsDefinitionsCheck = function (data, options) {
    if (!data.definitions) {
        return data.string + ' is not used.';
    }

    if (!(options.whiteList.indexOf(data.string) < 0)) {
        return data.string + ' has ' + data.definitions.count + ' usages.';
    }
};
