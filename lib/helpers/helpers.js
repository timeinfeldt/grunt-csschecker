'use strict';

module.exports = {
  getClassesFromSelector(selector) {
    if (!selector) return [];

    return selector.match(/[_a-zA-Z][_a-zA-Z0-9-]*/g) || [];
  },
  getSelectorLength(selector) {
    return this.getClassesFromSelector(selector).length;
  },
};
