'use strict';
var parse = require('css-parse'),
    fs = require('fs'),
    Helpers = require('../helpers/helpers'),
    helpers = new Helpers();

function CSSChecker() {
}

CSSChecker.prototype = {
    rules: function () {
        return this.parsedData.rules;
    },
    parseFile: function () {
        var rules = this.rules(),
            rulesCount = rules.length,
            collector = this.collector;

        for (var i = 0; i < rulesCount; i++) {
            var rule = rules[i];
            if (rule.type === 'rule') {

                var selectorsCount = rule.selectors.length;

                for (var j = 0; j < selectorsCount; j++) {
                    var selector = rule.selectors[j],
                        classMatches = helpers.getClassesFromSelector(selector),
                        classMatchesCount = classMatches && classMatches.length;

                    //collect selector
                    collector.addSelectorDefinition(selector);

                    //collect classes
                    if (classMatchesCount) {
                        for (var x = 0; x < classMatchesCount; x++) {
                            var className = classMatches[x];

                            collector.addClassDefinition(className);
                        }
                    }
                }

                //collect declarations
                rule.declarations.forEach(function (declaration) {
                    collector.addDeclarationDefinition(declaration);
                });
            }
        }
    },

    run: function (path, Collector, callback) {
        this.file = fs.readFileSync(path, 'utf8');
        this.parsedData = parse(this.file).stylesheet;

        this.collector = Collector;
        this.collector.setPath(path);

        this.parseFile();
        return callback();
    }
};

module.exports = CSSChecker;
