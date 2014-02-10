var fs = require('fs')

module.exports = walkSync
function walkSync (baseDir, relativePath) {
  // Inside this function, prefer string concatenation to the slower path.join
  // https://github.com/joyent/node/pull/6929
  if (relativePath == null) {
    relativePath = ''
  } else if (relativePath.slice(-1) !== '/') {
    relativePath += '/'
  }

  var results = []
  var entries = fs.readdirSync(baseDir + '/' + relativePath)
  for (var i = 0; i < entries.length; i++) {
    var stats = fs.statSync(baseDir + '/' + relativePath + entries[i])
    if (stats.isDirectory()) {
      results.push(relativePath + entries[i] + '/')
      results = results.concat(walkSync(baseDir, relativePath + entries[i]))
    } else {
      results.push(relativePath + entries[i])
    }
  }
  return results
}
