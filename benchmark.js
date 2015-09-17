#!/usr/bin/env node

var rimraf = require('rimraf')
var fs = require('fs')
var childProcess = require('child_process')
var walkSync = require('./')

rimraf.sync('benchmark.tmp')

var directories = 100, files = 1000
function createDirWithFiles(dir) {
  fs.mkdirSync(dir)
  for (var i = 0; i < files; i++) {
    fs.writeFileSync(dir + '/' + i, 'foo')
  }
}
console.log('Creating ' + (directories * files) + ' files across ' + directories + ' directories')
createDirWithFiles('benchmark.tmp')
for (var i = 0; i < directories - 1; i++) {
  createDirWithFiles('benchmark.tmp/dir' + i)
}
childProcess.spawnSync('sync')

console.time('walkSync')
for (i = 0; i < 5; i++) {
  walkSync('benchmark.tmp')
}
console.timeEnd('walkSync')

console.time('walkSync with **/* glob')
for (i = 0; i < 5; i++) {
  walkSync('benchmark.tmp', ['**/*'])
}
console.timeEnd('walkSync with **/* glob')

console.time('walkSync with **/*DOESNOTMATCH glob')
for (i = 0; i < 5; i++) {
  walkSync('benchmark.tmp', ['**/*DOESNOTMATCH'])
}
console.timeEnd('walkSync with **/*DOESNOTMATCH glob')

console.time('walkSync with DOESNOTMATCH*/** glob')
for (i = 0; i < 5; i++) {
  walkSync('benchmark.tmp', ['DOESNOTMATCH*/**'])
}
console.timeEnd('walkSync with DOESNOTMATCH*/** glob')

rimraf.sync('benchmark.tmp')
