import fs = require('fs');
import path = require('path');

export = function(destination: string, filePath: string, shouldBreakLink?: boolean) {
  const  root = path.dirname(filePath);
  const  link = path.join(root, destination);

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
