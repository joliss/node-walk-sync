var fs = require('fs');
var path = require('path');

module.exports = function(destination, filePath, shouldBreakLink) {
  var root = path.dirname(filePath);
  var link = path.join(root, destination);
  if (shouldBreakLink && !fs.existsSync(link)) {
    fs.mkdirSync(link);
  }
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  fs.symlinkSync(destination, filePath);
  if (shouldBreakLink && fs.existsSync(link)) {
    fs.rmdirSync(link);
  }
}
