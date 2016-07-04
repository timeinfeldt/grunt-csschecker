'use strict';
const fs = require('fs');

function parseClasses(file, contents, classNames) {
  const classCounts = {};

  classNames.forEach(className => {
    const matches = contents.match(className);

    if (matches) {
      if (!classCounts[className]) {
        classCounts[className] = 0;
      }

      classCounts[className] += matches.length;
    }
  });

  return classCounts;
}

module.exports = function codechecker(file, classNames) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, content) => {
      if (err) reject(err);
      else resolve(content);
    });
  })
  .then(content => parseClasses(file, content, classNames));
};
