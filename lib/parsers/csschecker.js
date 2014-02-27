'use strict';
var parse = require('css-parse'),
    fs = require('fs');

function CSSChecker() {
}

CSSChecker.prototype = {
    rules : function () {
        return this.parsedData.rules;
    },
    parseFile : function () {
        var rules = this.rules(),
            rulesCount = rules.length,
            collector = this.collector;

        for (var i = 0; i < rulesCount; i++) {
            var rule = rules[i];
            if (rule.type === 'rule') {

                var selectorsCount = rule.selectors.length;

                for (var j = 0; j < selectorsCount; j++) {
                    var selector = rule.selectors[j],
                        classMatches = selector.match(/(\.[_a-z]+[_a-z0-9-:\\]*)/ig),
                        classMatchesCount = classMatches && classMatches.length;

                    //extract selector
                    collector.addSelectorDefinition(selector);

                    //extract classes
                    if (classMatchesCount) {
                        for (var x = 0; x < classMatchesCount; x++) {
                            var className = classMatches[x];

                            collector.addClassDefinition(className);
                        }
                    }
                }

                rule.declarations.forEach(function(declaration){
                    //extract declaration
                    collector.addDeclarationDefinition(declaration);
                });

            }
        }
    },

    run : function (path, Collector, callback) {
        this.file = fs.readFileSync(path, 'utf8');
        this.parsedData = parse(this.file).stylesheet;

        this.collector = Collector;
        this.collector.setPath(path);

        this.parseFile();
        return callback();
    }
};

module.exports = CSSChecker;