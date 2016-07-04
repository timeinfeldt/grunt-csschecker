'use strict';
/* global grunt, Promise */

const cssCheckerParse = require('../lib/parsers/csschecker');
const codeCheckerParse = require('../lib/parsers/codechecker');
const Queue = require('promise-queue');
const glob = require('glob-promise');
const flatten = require('flatten');
const checks = require('../lib/checks/checks.js');
const reporters = require('../lib/reporters');
const sourceMap = require('source-map');
const fs = require('fs');
const path = require('path');

function reduce(promises, fn, initialValue) {
  let acc = initialValue;
  promises.forEach(promise => {
    promise.then(value => {
      acc = fn(acc, value);
    });
  });

  return Promise.all(promises).then(() => acc);
}

function getCssResultsClassNames(results) {
  return results
    .filter(result => result.type === 'class')
    .map(cls => cls.className);
}

function getFilesFromPath(patterns) {
  if (!patterns) {
    grunt.fail.warn('No source file paths found.');
  }

  return Promise.all(patterns.map(pattern => glob(pattern)));
}

function uniqueArray(arr) {
  return arr.filter((elem, pos) => arr.indexOf(elem) === pos);
}

function objectCombine(keys, values) {
  const result = {};
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = values[i];
  }
  return result;
}

function mergeClassCounts(classCountsList) {
  const merged = {};
  classCountsList.forEach(classCounts => {
    Object.keys(classCounts).forEach(key => {
      merged[key] = merged[key] || 0;
      merged[key] += classCounts[key];
    });
  });

  return merged;
}

function loadSourceMap(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(`${file}.map`, 'utf8', (err, content) => {
      if (err) reject(err);
      else resolve(content);
    });
  })
  .then(contents => {
    const rawSourceMap = JSON.parse(contents);
    rawSourceMap.sourceRoot = path.dirname(file);
    return new sourceMap.SourceMapConsumer(rawSourceMap);
  })
  .catch(err => {
    if (err.code === 'ENOENT') {
      return null;
    }
    return Promise.reject(err);
  });
}

function mapQueued(numConcurrent, keys, fn) {
  const queue = new Queue(numConcurrent, Infinity);

  return keys.map(key => queue.add(() => fn(key)));
}

function resolveSourceMaps(results) {
  let cssFiles = results
        .map(result => result.file)
        .filter(file => file.match(/\.css$/));
  cssFiles = uniqueArray(cssFiles);

  const promises = mapQueued(50, cssFiles, loadSourceMap);

  return Promise.all(promises)
    .then(sourceMaps => {
      const sourceMapsByCssFile = objectCombine(cssFiles, sourceMaps);

      return results.map(result => {
        const consumer = sourceMapsByCssFile[result.file];

        if (!consumer) return result;

        const position = consumer.originalPositionFor({
          line: result.line,
          column: result.column,
        });

        // eslint-disable-next-line no-param-reassign
        result.file = position.source;

        // eslint-disable-next-line no-param-reassign
        result.line = position.line;

        // eslint-disable-next-line no-param-reassign
        result.column = position.column;

        return result;
      });
    });
}

module.exports = grunt => {
  grunt.registerMultiTask('csschecker', 'Checks your CSS', function csschecker() {
    const done = this.async();
    const checksConfig = this.data.checks;

    getFilesFromPath(this.data.cssSrc)
      .then(flatten)
      .then(files => Promise.all(files.map(cssCheckerParse)))
      .then(flatten)
      .then(files => Promise.resolve(getCssResultsClassNames(files))
        .then(classNames => getFilesFromPath(this.data.codeSrc)
          .then(flatten)
          .then(classFiles => {
            const promises = mapQueued(50, classFiles, file => codeCheckerParse(file, classNames));
            return reduce(promises, (acc, value) => mergeClassCounts([acc, value]), {});
          })
          .catch(err => { throw err; })
        )
        .then(
          classCounts =>
            Object.keys(checksConfig)
              .map(checkName => checks[checkName](files, classCounts, checksConfig[checkName]))
        )
        .then(flatten)
        .then(results => {
          resolveSourceMaps(results).then(innerResults => {
            if (this.data.options.checkstyle) {
              grunt.file.write(this.data.options.checkstyle, reporters.checkstyle(innerResults));
            }

            done();
          });
        })
      );
  });
};
