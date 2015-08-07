var fs = require('fs')
var tap = require('tap')
var test = tap.test
var walkSync = require('../')

function captureError(fn) {
  try {
    fn();
  } catch(e) {
    return e;
  }
}

tap.Test.prototype.addAssert('matchThrows', 2, function(fn, expectedError) {
  var error = captureError(fn)

  this.type(error, Error);
  this.equal(error.name, expectedError.name)
  this.match(error.message, expectedError.message)
})

test('walkSync', function (t) {
  t.deepEqual(walkSync('test/fixtures'), [
    'dir/',
    'dir/bar.txt',
    'dir/subdir/',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'foo.txt',
    'some-other-dir/',
    'some-other-dir/qux.txt',
    'symlink1/',
    'symlink1/qux.txt',
    'symlink2',
  ])

  t.matchThrows(function() {
    walkSync('test/doesnotexist')
  }, {
    name: 'Error',
    message: /ENOENT.* 'test\/doesnotexist/
  })

  t.matchThrows(function() {
    walkSync('test/fixtures/foo.txt')
  }, {
    name: 'Error',
    message: /ENOTDIR.* 'test\/fixtures\/foo.txt/
  })

  t.end()
})
