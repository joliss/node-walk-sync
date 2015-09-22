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
});

function byFile(obj) {
  return obj.file;
}

function byStat(obj) {
  return obj.stat;
}

function appearsAsDir(entry) {
  return entry.relativePath.charAt(entry.relativePath.length - 1) === '/';
}

test('entries', function (t) {
  function expectAllEntries(array) {
    array.forEach(function(entry) {
      if (entry.relativePath === 'symlink2') {
        t.assert(!entry.isDirectory());
      } else {

        if (appearsAsDir(entry)) {
          t.assert(entry.isDirectory());
        } else {
          t.assert(!entry.isDirectory());
        }

        t.assert(entry.mtime);
        t.assert(entry.mode);
        t.assert(entry.size > -1);
      }

      t.deepEqual(Object.keys(entry).sort(), ['relativePath', 'basePath', 'size', 'mtime', 'mode'].sort());
    });
  }

  expectAllEntries(walkSync.entries('test/fixtures'));

  t.end();
});

test('walkSync \w matchers', function (t) {
   t.deepEqual(walkSync('test/fixtures', ['dir/bar.txt']), [
     'dir/bar.txt'
   ])

   t.deepEqual(walkSync('test/fixtures', { globs: ['dir/bar.txt'] }), [
     'dir/bar.txt'
   ]);

   t.deepEqual(walkSync('test/fixtures', ['dir/bar.txt', 'dir/zzz.txt']), [
     'dir/bar.txt',
     'dir/zzz.txt'
   ])

   t.deepEqual(walkSync('test/fixtures', ['dir/{bar,zzz}.txt']), [
     'dir/bar.txt',
     'dir/zzz.txt'
   ])

   t.deepEqual(walkSync('test/fixtures', ['dir/**/*', 'some-other-dir/**/*']), [
     'dir/bar.txt',
     'dir/subdir/',
     'dir/subdir/baz.txt',
     'dir/zzz.txt',
     'some-other-dir/qux.txt'
   ])

   t.deepEqual(walkSync('test/fixtures', {
     globs: ['dir/**/*', 'some-other-dir/**/*'],
     directories: false
   }), [
     'dir/bar.txt',
     'dir/subdir/baz.txt',
     'dir/zzz.txt',
     'some-other-dir/qux.txt'
   ])

  t.deepEqual(walkSync('test/fixtures', ['**/*.txt']), [
    'dir/bar.txt',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'foo.txt',
    'some-other-dir/qux.txt',
    'symlink1/qux.txt',
  ])

  t.deepEqual(walkSync('test/fixtures', ['{dir,symlink1}/**/*.txt']), [
    'dir/bar.txt',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'symlink1/qux.txt',
  ])

  t.end()
})
