'use strict';

import * as path from 'path';
import * as walkSync from '../index';
import * as fs from 'fs';
import {Volume, createFsFromVolume} from 'memfs'
import { Minimatch } from 'minimatch';

function symlink(destination: string, filePath: string, shouldBreakLink?: boolean) {
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

function safeUnlink(path:string) {
  try {
    fs.unlinkSync(path);
  } catch (e) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'ENOENT') {
      // handle
    } else {
      throw e;
    }
  }
}

function safeRmdir(path:string) {
  try {
    fs.rmdirSync(path);
  } catch (e) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (((e as { code?: string }).code === 'ENOENT') || ((e as { code?: string }).code === 'ENOTDIR'))
    ) {
      // handle
    } else {
      throw e;
    }
  }
}

symlink('./some-other-dir', 'test/fixtures/symlink1');
symlink('doesnotexist', 'test/fixtures/symlink2', true);

// https://github.com/joliss/node-walk-sync/pull/44
safeRmdir(__dirname + '/fixtures/bar');
safeUnlink(__dirname + '/fixtures/bar');
safeUnlink(__dirname + '/fixtures/symlink3');
// Create a broken link to a directory ...
symlink('bar', __dirname + '/fixtures/symlink3', true);
// ... and copy a file in its place
fs.copyFileSync(__dirname + '/fixtures/dir/bar.txt', __dirname + '/fixtures/bar');

safeUnlink(__dirname + '/fixtures/contains-cycle/is-cycle');

fs.symlinkSync(__dirname + '/fixtures/contains-cycle/', __dirname + '/fixtures/contains-cycle/is-cycle');
// this allows us to call walkSync with fixed path separators,
// but CI will use its native format (Windows testing).
// we can't duplicate our tests hardcoding windows paths
// because walkSync checks path.sep, not your supplied path format
//

test('walkSync', function () {
  const entries = walkSync('test/fixtures');

  expect(entries).toStrictEqual([
    'bar',
    'contains-cycle/',
    'contains-cycle/.gitkeep',
    'contains-cycle/is-cycle/',
    'dir/',
    'dir/.bin/',
    'dir/.bin/dotty.txt',
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
    'symlink2',
    'symlink3'
  ].filter(Boolean));

  expect(entries).toStrictEqual(entries.slice().sort());

  expect(() => walkSync('test/doesnotexist')).toThrow(/ENOENT.* '.*test[\\\/]doesnotexist/);
  expect(() => walkSync('test/fixtures/foo.txt')).toThrow(/ENOTDIR.* '.*test[\\\/]fixtures[\\\/]foo.txt/);
});

function appearsAsDir(entry: walkSync.Entry) {
  return entry.relativePath.charAt(entry.relativePath.length - 1) === '/';
}

test('entries', function () {
  function expectAllEntries(array: walkSync.Entry[]) {
    expect(array.map(function(entry) {
      return {
        basePath: entry.basePath,
        fullPath: entry.fullPath
      };
    })).toStrictEqual(
      [ 
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/bar'
      },
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
        fullPath: 'test/fixtures/dir/.bin/'
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/dir/.bin/dotty.txt'
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
      },
      {
        basePath: 'test/fixtures',
        fullPath: 'test/fixtures/symlink3'
      }
    ]);

    array.forEach(entry => {
      if (entry.relativePath === 'symlink2' || entry.relativePath === 'symlink3') {
        expect(entry.isDirectory()).toBe(false);
      } else {

        if (appearsAsDir(entry)) {
          expect(entry.isDirectory()).toBe(true);
        } else {
          expect(entry.isDirectory()).toBe(false);
        }

        expect(typeof entry.mtime).toBe('number');
        expect(typeof entry.size).toBe('number');
        expect(typeof entry.mode).toBe('number');
      }

      expect(Object.keys(entry).sort()).toStrictEqual(['relativePath', 'basePath', 'size', 'mtime', 'mode'].sort());
    });
  }

  expectAllEntries(walkSync.entries('test/fixtures'));
});

test('walkSync with matchers', function () {
   expect(walkSync('test/fixtures', ['dir/bar.txt'])).toStrictEqual([
     'dir/bar.txt'
   ]);

   expect(walkSync('test/fixtures', { globs: ['dir/bar.txt'] })).toStrictEqual([
     'dir/bar.txt'
   ]);

   expect(walkSync('test/fixtures', ['dir/bar.txt', 'dir/zzz.txt'])).toStrictEqual([
     'dir/bar.txt',
     'dir/zzz.txt'
   ]);

   expect(walkSync('test/fixtures', ['dir/{bar,zzz}.txt'])).toStrictEqual([
     'dir/bar.txt',
     'dir/zzz.txt'
   ]);

   expect(walkSync('test/fixtures', ['dir/**/*', 'some-other-dir/**/*'])).toStrictEqual([
     'dir/bar.txt',
     'dir/subdir/',
     'dir/subdir/baz.txt',
     'dir/zzz.txt',
     'some-other-dir/qux.txt'
   ]);

   expect(walkSync('test/fixtures', {
     globs: ['dir/**/*', 'some-other-dir/**/*'],
     directories: false
   })).toStrictEqual([
     'dir/bar.txt',
     'dir/subdir/baz.txt',
     'dir/zzz.txt',
     'some-other-dir/qux.txt'
   ]);

  expect(walkSync('test/fixtures', ['**/*.txt'])).toStrictEqual([
    'dir/bar.txt',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'foo.txt',
    'some-other-dir/qux.txt',
    'symlink1/qux.txt'
  ]);

  expect(walkSync('test/fixtures', ['{dir,symlink1}/**/*.txt'])).toStrictEqual([
    'dir/bar.txt',
    'dir/subdir/baz.txt',
    'dir/zzz.txt',
    'symlink1/qux.txt'
  ]);
});

test('walksync with ignore pattern', function () {
  expect(walkSync('test/fixtures', {
    ignore: ['dir']
  })).toStrictEqual([
    'bar',
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
    'symlink2',
    'symlink3'
  ]);

  expect(walkSync('test/fixtures', {
    ignore: ['**/subdir']
  })).toStrictEqual([
    'bar',
    'contains-cycle/',
    'contains-cycle/.gitkeep',
    'contains-cycle/is-cycle/',
    'dir/',
    'dir/.bin/',
    'dir/.bin/dotty.txt',
    'dir/bar.txt',
    'dir/zzz.txt',
    'foo.txt',
    'foo/',
    'foo/a.js',
    'some-other-dir/',
    'some-other-dir/qux.txt',
    'symlink1/',
    'symlink1/qux.txt',
    'symlink2',
    'symlink3'
  ]);

  expect(walkSync('test/fixtures', {
    globs: ['**/*.txt'],
    ignore: ['dir']
  })).toStrictEqual([
    'foo.txt',
    'some-other-dir/qux.txt',
    'symlink1/qux.txt'
  ]);
});

test('walksync with includePath option', function () {
  expect(walkSync('test/fixtures/dir/subdir', {
      includeBasePath: true
  })).toStrictEqual([
      'test/fixtures/dir/subdir/baz.txt'
  ]);
});

describe('walksync applies globOptions', function() {
  it('does not find files under dot directories by default', function () {
    expect(walkSync('test/fixtures', {
        globs: ['dir/**/*']
    })).not.toContain('dir/.bin/dotty.txt');
  });

  it('finds files under dot directories if dot is set', function () {
    expect(walkSync('test/fixtures', {
      globs: ['dir/**/*'],
      globOptions: { dot: true }
    })).toContain('dir/.bin/dotty.txt');
  });

  it('does not ignores files under dot directories by default', function () {
    expect(walkSync('test/fixtures', {
        ignore: ['dir/**/*'],
    })).toContain('dir/.bin/dotty.txt');
  });

  it('ignores files under dot directories if dot is set', function () {
    expect(walkSync('test/fixtures', {
        ignore: ['dir/**/*'],
        globOptions: { dot: true }
    })).not.toContain('dir/.bin/dotty.txt');
  });

  it('doesnt apply globOptions if globs are instances of minimatch', function () {
    expect(walkSync('test/fixtures', {
        globs: [new Minimatch('dir/**/*')],
        globOptions: { dot: true }
    })).not.toContain('dir/.bin/dotty.txt');
  });
});

describe('walksync with alternate fs option (memfs)', function() {
  let volFs: typeof fs
  beforeEach(() => {
    volFs =  createFsFromVolume(Volume.fromJSON(
      JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, './fixture-memfs.json'),
          'utf8'
        )
      ),
      '/'
    )) as unknown as typeof fs
  })

  it('collates relative paths from given dir', () => {
    const entries = walkSync('/', {fs: volFs});
    expect(entries).toContain('a/b/d.txt');
    expect(volFs.readFileSync('/a/b/d.txt', 'utf8')).toEqual('d-text');
  });

  it('collates absolute paths from given dir', () => {
    const entries = walkSync('/', {fs: volFs, includeBasePath: true});
    expect(entries).toContain('/a/b/d.txt');
    expect(volFs.readFileSync('/a/b/d.txt', 'utf8')).toEqual('d-text');
  });

  it('collates paths matching glob', () => {
    const entries = walkSync('/', {fs: volFs, globs: ['**/b/d/*', '**/b/d/']});
    expect(entries).toEqual(['a/b/d/', 'a/b/d/e.txt']);
    expect(volFs.readFileSync('/a/b/d/e.txt', 'utf8')).toEqual('e-text');
  });

  it('collates paths matching glob directories only', () => {
    const entries = walkSync('/', {fs: volFs, directories: false, globs: ['**/b/d/*', '**/b/d/']});
    expect(entries).toEqual(['a/b/d/e.txt']);
    expect(volFs.readFileSync('/a/b/d/e.txt', 'utf8')).toEqual('e-text');
  });
})
