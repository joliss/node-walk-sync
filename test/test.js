var test = require('tap').test
var walkSync = require('../')

test('walkSync', function (t) {
  t.deepEqual(walkSync('fixtures'), [
    'dir1/',
    'dir1/bar.txt',
    'dir1/subdir/',
    'dir1/subdir/baz.txt',
    'dir1/zzz.txt',
    'dir2/',
    'foo.txt',
    'symlink1',
    'symlink2'
  ])
  t.end()
})
