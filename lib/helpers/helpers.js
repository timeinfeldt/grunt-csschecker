'use strict';

function Helpers() {
}

Helpers.prototype = {
    getSelectorLength : function (selector) {
        var classRegEx = /[_a-zA-Z][_a-zA-Z0-9-]*/g;
        return selector.match(classRegEx) ? selector.match(classRegEx).length : 0;
    }
};

module.exports = Helpers;
