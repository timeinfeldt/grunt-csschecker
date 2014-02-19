exports.selectorLengthCheck = function (data, options) {
    if(data.string.split(' ').length > options.maxLength) {
        return data.string + ' is deeper than ' + options.maxLength + ' levels.';
    }
};

exports.classUsageCheck = function (data, options) {
    if(!data.usages) {
        return data.string + ' is not used.';
    }
    if(options.reportAll) {
        return data.string + ' has ' + data.usages.count + ' usages.';
    }
    if(data.usages.count < options.minUsage) {
        return data.string + ' has less than ' + options.minUsage + ' usages.';
    }
};