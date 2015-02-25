'use strict';

var Handlebars = require('handlebars'),
    fs = require('fs'),
    Helpers = require('../helpers/helpers'),
    helpers = new Helpers();

var getSummarystats = function (data) {
    var stats = {
        classes : {
            count : 0,
            usedCount : 0,
            unusedCount : 0,
            unusedPercentage : 0,
            totalUsage : 0,
            avgUsage : 0,
            definitionsDistribution : [],
            usagesDistribution : []
        },
        selectors : {
            count : 0,
            totalLength : 0,
            avgLength : 0,
            lengthsDistribution : []
        }
    };

    for (var cKey in data.classes) {
        var c = data.classes[cKey];
        stats.classes.count++;
        stats.classes.definitionsDistribution.push(c.definitions.count);

        if (c.usages) {
            stats.classes.totalUsage += c.usages.count;
            stats.classes.usedCount++;
            stats.classes.usagesDistribution.push(c.usages.count);
        } else {
            stats.classes.unusedCount++;
        }
    }

    for (var sKey in data.selectors) {
        var s = data.selectors[sKey],
            length = helpers.getSelectorLength(s.string);

        stats.selectors.count++;
        stats.selectors.totalLength += length;
        stats.selectors.lengthsDistribution.push(length);
    }

    if (stats.classes.count) {
        stats.classes.unusedPercentage = ((stats.classes.unusedCount / stats.classes.count) * 100).toFixed(1);
        stats.classes.avgUsage = (stats.classes.totalUsage / stats.classes.usedCount).toFixed(1);
    }

    if (stats.selectors.count) {
        stats.selectors.avgLength = (stats.selectors.totalLength / stats.selectors.count).toFixed(1);
    }

    return stats;
};

module.exports = function (data, report) {
    var templateSrc = fs.readFileSync(__dirname + '/report_template.html').toString(),
        template = Handlebars.compile(templateSrc);

    var stats = getSummarystats(data);

    //stringified json for d3 charts
    stats['stringifiedJSON'] = JSON.stringify(stats);
    stats['report'] = report;

    return template(stats);
};


//# of classes - done
//# of unused classes - done
//unusued % - done

//avg usage per class - done
//class definition distribution - done
//class usage distribution - done

//avg selector length - done
//selector length distribution - done

//warnings dump
