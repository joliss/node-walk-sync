var fs = require('fs')
var test = require('tap').test
var walkSync = require('../')

test('walkSync', function (t) {
  t.deepEqual(walkSync('fixtures'), [
    'dir/',
    'dir/bar.txt',
    'dir/subdir/',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'foo.txt',
    'symlink1',
    'symlink2'
  ])
  t.end()
})
