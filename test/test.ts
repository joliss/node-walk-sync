'use strict';

import path = require('path');
const tap = require('tap');
const test = tap.test;
import * as walkSync from '../';
import symlink = require('./utils/symlink');
import fs = require('fs');

function captureError(fn: () => any) {
  try {
    fn();
  } catch(e) {
    return e;
  }
}

function safeUnlink(path:string) {
  try {
    fs.unlinkSync(path);
  } catch (e) {
    if (typeof e === 'object' && e !== null && e.code === 'ENOENT') {
      // handle
    } else {
      throw e;
    }
  }
}

tap.Test.prototype.addAssert('matchThrows', 2, function(this: any, fn: () => any, expectedError: Error) {
  var error = captureError(fn);

  this.type(error, Error);
  this.equal(error.name, expectedError.name);
  this.match(error.message, expectedError.message);
});

// git for windows doesn't support symlinks, so let node handle it
symlink('./some-other-dir', 'test/fixtures/symlink1');
symlink('doesnotexist', 'test/fixtures/symlink2', true);
symlink('doesnotexist', 'test/fixtures/symlink2', true);

safeUnlink(__dirname + '/fixtures/bar');
safeUnlink(__dirname + '/fixtures/symlink3');

fs.mkdirSync('./bar');
symlink('./bar/', 'test/fixtures/symlink3', true);
fs.rmdirSync('./bar');
fs.copyFileSync(__dirname + '/fixtures/dir/bar.txt', __dirname + '/fixtures/bar');

safeUnlink(__dirname + '/fixtures/contains-cycle/is-cycle');

fs.symlinkSync(__dirname + '/fixtures/contains-cycle/', __dirname + '/fixtures/contains-cycle/is-cycle');
// this allows us to call walkSync with fixed path separators,
// but CI will use its native format (Windows testing).
// we can't duplicate our tests hardcoding windows paths
// because walkSync checks path.sep, not your supplied path format
//

test('walkSync', function (t: any) {
  var entries = walkSync('test/fixtures');

  t.deepEqual(entries, [
    'contains-cycle/',
    'contains-cycle/.gitkeep',
    'contains-cycle/is-cycle/',
    'dir/',
    'dir/bar.txt',
    'dir/subdir/',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'foo.txt',
    'foo/',
    'foo/a.js',
    'some-other-dir/',
    'some-other-dir/qux.txt',
    'symlink1/',
    'symlink1/qux.txt',
    'symlink2'
  ].filter(Boolean));

  t.deepEqual(entries, entries.slice().sort());

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

function appearsAsDir(entry: walkSync.Entry) {
  return entry.relativePath.charAt(entry.relativePath.length - 1) === '/';
}

test('entries', function (t: any) {
  function expectAllEntries(array: walkSync.Entry[]) {
    t.deepEqual(array.map(function(entry) {
      return {
        basePath: entry.basePath,
        fullPath: entry.fullPath
      };
    }),
      [
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/contains-cycle/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/contains-cycle/.gitkeep'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/contains-cycle/is-cycle/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/dir/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/dir/bar.txt'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/dir/subdir/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/dir/subdir/baz.txt'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/dir/zzz.txt'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/foo.txt'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/foo/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/foo/a.js'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/some-other-dir/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/some-other-dir/qux.txt'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/symlink1/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/symlink1/qux.txt'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/symlink2'
      }
    ]);

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

test('walkSync with matchers', function (t: any) {
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

test('walksync with ignore pattern', function (t: any) {
  t.deepEqual(walkSync('test/fixtures', {
    ignore: ['dir']
  }), [
    'contains-cycle/',
    'contains-cycle/.gitkeep',
    'contains-cycle/is-cycle/',
    'foo.txt',
    'foo/',
    'foo/a.js',
    'some-other-dir/',
    'some-other-dir/qux.txt',
    'symlink1/',
    'symlink1/qux.txt',
    'symlink2'
  ]);

  t.deepEqual(walkSync('test/fixtures', {
    ignore: ['**/subdir']
  }), [
    'contains-cycle/',
    'contains-cycle/.gitkeep',
    'contains-cycle/is-cycle/',
    'dir/',
    'dir/bar.txt',
    'dir/zzz.txt',
    'foo.txt',
    'foo/',
    'foo/a.js',
    'some-other-dir/',
    'some-other-dir/qux.txt',
    'symlink1/',
    'symlink1/qux.txt',
    'symlink2'
  ]);

  t.deepEqual(walkSync('test/fixtures', {
    globs: ['**/*.txt'],
    ignore: ['dir']
  }), [
    'foo.txt',
    'some-other-dir/qux.txt',
    'symlink1/qux.txt'
  ]);

  t.end();
});

test('walksync with includePath option', function (t: any) {
  t.deepEqual(walkSync('test/fixtures/dir/subdir', {
      includeBasePath: true
  }), [
      'test/fixtures/dir/subdir/baz.txt'
  ]);

  t.end();
});
