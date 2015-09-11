#!/usr/bin/env node

var rimraf = require('rimraf')
var fs = require('fs')
var childProcess = require('child_process')
var walkSync = require('./')

rimraf.sync('benchmark.tmp')

function createDirWithFiles(dir) {
  fs.mkdirSync(dir)
  for (var i = 0; i < 1000; i++) {
    fs.writeFileSync(dir + '/' + i, 'foo')
  }
}
createDirWithFiles('benchmark.tmp')
for (var i = 0; i < 100; i++) {
  createDirWithFiles('benchmark.tmp/dir' + i)
}

childProcess.spawnSync('sync')

console.time('walkSync')
walkSync('benchmark.tmp')
console.timeEnd('walkSync')

console.time('walkSync with **/* glob')
walkSync('benchmark.tmp', ['**/*'])
console.timeEnd('walkSync with **/* glob')

console.time('walkSync with **/*DOESNOTMATCH glob')
walkSync('benchmark.tmp', ['**/*DOESNOTMATCH'])
console.timeEnd('walkSync with **/*DOESNOTMATCH glob')

console.time('walkSync with DOESNOTMATCH*/** glob')
walkSync('benchmark.tmp', ['DOESNOTMATCH*/**'])
console.timeEnd('walkSync with DOESNOTMATCH*/** glob')

rimraf.sync('benchmark.tmp')
