var path = require('path');

module.exports = function(filePath) {
  return path.normalize(filePath).replace(/\\/g, '\\\\').replace(/\//g, '\\/');
}
