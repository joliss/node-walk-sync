'use strict';

var fs = require('fs');
var MatcherCollection = require('./matcher-collection');

module.exports = walkSync;
function walkSync (baseDir, globs, _relativePath) {
  // Inside this function, prefer string concatenation to the slower path.join
  // https://github.com/joyent/node/pull/6929
  if (_relativePath == null) {
    _relativePath = '';
  } else if (_relativePath.slice(-1) !== '/') {
    _relativePath += '/';
  }
  var m;

  if (globs) {
    m = new MatcherCollection(globs);
  }

  var results = [];
  if (m && !m.mayContain(_relativePath)) {
    return results;
  }
  var entries = fs.readdirSync(baseDir + '/' + _relativePath).sort();
  for (var i = 0; i < entries.length; i++) {
    var entryRelativePath = _relativePath + entries[i];
    var stats = getStat(baseDir + '/' + entryRelativePath);

    if (stats && stats.isDirectory()) {
      if (!m || m.match(entryRelativePath)) {
        results.push(entryRelativePath + '/');
      }
      results = results.concat(walkSync(baseDir, globs, entryRelativePath));
    } else {
      if (!m || m.match(entryRelativePath)) {
        results.push(entryRelativePath);
      }
    }
  }
  return results;
}

function getStat(path) {
  var stat;

  try {
    stat = fs.statSync(path);
  } catch(error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return stat;
}
