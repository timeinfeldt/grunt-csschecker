'use strict';
var fs = require('fs');

function Collector(data) {
    this.data = data;
}

Collector.prototype = {
    setPath : function (path) {
        this.path = path;
    },
    addClassUsage : function (classObj) {
        var path = this.path;
        if (classObj.hasOwnProperty('usages')) {
            classObj['usages'].count += 1;
            if (classObj['usages'].locations.indexOf(path) < 0) {
                classObj['usages'].locations.push(path);
            }
        } else {
            classObj['usages'] = {
                count : 1,
                locations : [path]
            };
        }
    },
    addClassDefinition : function (className) {
        var classes = this.data.classes,
            path = this.path;

        if (classes.hasOwnProperty(className)) {
            classes[className].definitions.count += 1;
            if (classes[className].definitions.locations.indexOf(path) < 0) {
                classes[className].definitions.locations.push(path);
            }
        } else {
            classes[className] = {
                string : className,
                definitions : {
                    count : 1,
                    locations : [path]
                }
            };
        }
    },
    addSelectorDefinition : function (selector) {
        var selectors = this.data.selectors,
            path = this.path;

        if (selectors.hasOwnProperty(selector)) {
            selectors[selector].definitions.count += 1;
            if (selectors[selector].definitions.locations.indexOf(path) < 0) {
                selectors[selector].definitions.locations.push(path);
            }
        } else {
            selectors[selector] = {
                string : selector,
                definitions : {
                    count : 1,
                    locations : [path]
                }
            };
        }
    },
    addDeclarationDefinition : function (declaration) {
        if (!(declaration.type == 'declaration')) {
            console.log('Declaration type is ' + declaration.type + ' ?');
            return;
        }

        var declarations = this.data.declarations,
            path = this.path,
            property = declaration.property,
            value = declaration.value;


        if (declarations.hasOwnProperty(property)) {
            declarations[property].definitions.count += 1;
        } else {
            declarations[property] = {
                string : property,
                definitions : {
                    count : 1,
                    locations : [path]
                },
                values : {}
            };
        }

        if (declarations[property].definitions.locations.indexOf(path) < 0) {
            declarations[property].definitions.locations.push(path);
        }

        if (declarations[property].values.hasOwnProperty(value)) {
            declarations[property].values[value].count += 1;
        } else {
            declarations[property].values[value] = {
                count : 1
            };
        }
    },
    getClasses : function () {
        return this.data.classes;
    }
};

module.exports = Collector;