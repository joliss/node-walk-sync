'use strict';

var tap = require('tap');
var test = tap.test;
var walkSync = require('../');
var symlink = require('./utils/symlink');

function captureError(fn) {
  try {
    fn();
  } catch(e) {
    return e;
  }
}

tap.Test.prototype.addAssert('matchThrows', 2, function(fn, expectedError) {
  var error = captureError(fn);

  this.type(error, Error);
  this.equal(error.name, expectedError.name);
  this.match(error.message, expectedError.message);
});

// git for windows doesn't support symlinks, so let node handle it
symlink('./some-other-dir', 'test/fixtures/symlink1');
symlink('doesnotexist', 'test/fixtures/symlink2', true);

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
    'symlink2'
  ]);

  t.matchThrows(function() {
    walkSync('test/doesnotexist');
  }, {
    name: 'Error',
    message: /ENOENT.* '.*test[\\\/]doesnotexist/
  });

  t.matchThrows(function() {
    walkSync('test/fixtures/foo.txt');
  }, {
    name: 'Error',
    message: /ENOTDIR.* '.*test[\\\/]fixtures[\\\/]foo.txt/
  });

  t.end();
});

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

        t.equal(typeof entry.mtime, 'number');
        t.equal(typeof entry.size, 'number');
        t.equal(typeof entry.mode, 'number');
      }

      t.deepEqual(Object.keys(entry).sort(), ['relativePath', 'basePath', 'size', 'mtime', 'mode'].sort());
    });
  }

  expectAllEntries(walkSync.entries('test/fixtures'));

  t.end();
});

test('walkSync with matchers', function (t) {
   t.deepEqual(walkSync('test/fixtures', ['dir/bar.txt']), [
     'dir/bar.txt'
   ]);

   t.deepEqual(walkSync('test/fixtures', { globs: ['dir/bar.txt'] }), [
     'dir/bar.txt'
   ]);

   t.deepEqual(walkSync('test/fixtures', ['dir/bar.txt', 'dir/zzz.txt']), [
     'dir/bar.txt',
     'dir/zzz.txt'
   ]);

   t.deepEqual(walkSync('test/fixtures', ['dir/{bar,zzz}.txt']), [
     'dir/bar.txt',
     'dir/zzz.txt'
   ]);

   t.deepEqual(walkSync('test/fixtures', ['dir/**/*', 'some-other-dir/**/*']), [
     'dir/bar.txt',
     'dir/subdir/',
     'dir/subdir/baz.txt',
     'dir/zzz.txt',
     'some-other-dir/qux.txt'
   ]);

   t.deepEqual(walkSync('test/fixtures', {
     globs: ['dir/**/*', 'some-other-dir/**/*'],
     directories: false
   }), [
     'dir/bar.txt',
     'dir/subdir/baz.txt',
     'dir/zzz.txt',
     'some-other-dir/qux.txt'
   ]);

  t.deepEqual(walkSync('test/fixtures', ['**/*.txt']), [
    'dir/bar.txt',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'foo.txt',
    'some-other-dir/qux.txt',
    'symlink1/qux.txt'
  ]);

  t.deepEqual(walkSync('test/fixtures', ['{dir,symlink1}/**/*.txt']), [
    'dir/bar.txt',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'symlink1/qux.txt'
  ]);

  t.end();
});
