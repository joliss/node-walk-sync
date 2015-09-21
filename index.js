'use strict';

var fs = require('fs');
var MatcherCollection = require('matcher-collection');

function handleOptions(_options) {
  var options = {};
  if (Array.isArray(_options)) {
    options.globs = _options;
  } else if (_options) {
    options = _options;
  }

  return options;
}

function handleRelativePath(_relativePath) {
  if (_relativePath == null) {
    return '';
  } else if (_relativePath.slice(-1) !== '/') {
    return _relativePath + '/';
  }
}

module.exports = walkSync;
function walkSync (baseDir, _options, _relativePath) {
  // Inside this function, prefer string concatenation to the slower path.join
  // https://github.com/joyent/node/pull/6929
  var options = handleOptions(_options);
  var relativePath = handleRelativePath(_relativePath);
  var globs = options.globs;
  var m;

  if (globs) {
    m = new MatcherCollection(globs);
  }

  var results = [];
  if (m && !m.mayContain(relativePath)) {
    return results;
  }
  var entries = fs.readdirSync(baseDir + '/' + relativePath).sort();
  for (var i = 0; i < entries.length; i++) {
    var entryRelativePath = relativePath + entries[i];
    var stats = getStat(baseDir + '/' + entryRelativePath);

    if (stats && stats.isDirectory()) {
      if (options.directories !== false && (!m || m.match(entryRelativePath))) {
        results.push(entryRelativePath + '/');
      }
      results = results.concat(walkSync(baseDir, options, entryRelativePath));
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
