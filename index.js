var fs = require('fs')
var buildMatcher = require('./may-contain').buildMatcher;

module.exports = walkSync
function walkSync (baseDir, relativePath, matcher) {
  // Inside this function, prefer string concatenation to the slower path.join
  // https://github.com/joyent/node/pull/6929
  if (relativePath == null) {
    relativePath = ''
  } else if (relativePath.slice(-1) !== '/') {
    relativePath += '/'
  }

  if (matcher) {
    var m = buildMatcher(matcher);
  }

  var results = []
  if (m && !m.mayContain(relativePath)) {
    return results;
  }
  var entries = fs.readdirSync(baseDir + '/' + relativePath).sort()
  for (var i = 0; i < entries.length; i++) {
    var entryRelativePath = relativePath + entries[i]
    var stats = getStat(baseDir + '/' + entryRelativePath)

    if (stats && stats.isDirectory()) {
      if (!m || m.match(entryRelativePath)) {
        results.push(entryRelativePath + '/')
      }
      results = results.concat(walkSync(baseDir, entryRelativePath, matcher))
    } else {
      if (!m || m.match(entryRelativePath)) {
        results.push(entryRelativePath)
      }
    }
  }
  return results
}

function getStat(path) {
  var stat

  try {
    stat = fs.statSync(path)
  } catch(error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }

  return stat;
}
