# node-walk-sync [![CI](https://github.com/joliss/node-walk-sync/workflows/CI/badge.svg)](https://github.com/joliss/node-walk-sync/actions/workflows/ci.yml)

Return an array containing all recursive files and directories under a given
directory, similar to Unix `find`. Follows symlinks. Bare-bones, but
very fast.

Similar to [`wrench.readdirSyncRecursive`](https://github.com/ryanmcgrath/wrench-js#synchronous-operations),
but adds trailing slashes to directories.

Not to be confused with [node-walk](https://github.com/coolaj86/node-walk),
which has both an asynchronous and a synchronous API.

## Installation

```bash
yarn add walk-sync
```

## Usage

```js
const walkSync = require('walk-sync');
const paths = walkSync('project')
```

Given `project/one.txt` and `project/subdir/two.txt`, `paths` will be the following
array:

```js
['one.txt', 'subdir/', 'subdir/two.txt']
```

Directories come before their contents, and have a trailing forward-slash (on
all platforms).

Symlinks are followed.

### Entries

Sometimes, it is important to get additional information from a walk of a
directory; for instance if the downstream consumer needs to stat the files we
can leverage the stats from the walk.

To accommodate, `walkSync.entries(path [, options])` is also provided, instead
of returning a list of files and/or directories it returns an array of objects
which correspond to a given file or directory, except with more data.

```
entry.relativePath
entry.mode  // => fs.statSync(fullPath).mode
entry.size  // => fs.statSync(fullPath).size
entry.mtime // => fs.statSync(fullPath).mtime.getTime()

entry.isDirectory() // => true if directory
```

### Options

* `globs`: An array of globs. Only files and directories that match at least
  one of the provided globs will be returned.

    ```js
    const paths = walkSync('project', { globs: ['subdir/**/*.txt'] });
    // => ['subdir/two.txt']
    ```

    As an alternative to string globs, you can pass an array of precompiled
    [`minimatch.Minimatch`](https://github.com/isaacs/minimatch#minimatch-class)
    instances. This is faster and allows to specify your own globbing options.

* `directories` (default: true): Pass `false` to only return files, not
  directories:

    ```js
    const paths = walkSync('project', { directories: false })
    // => ['one.txt', 'subdir/two.txt']
    ```

* `ignore`: An array of globs. Files and directories that match at least one
  of the provided globs will be pruned while searching.

    ```js
    const paths = walkSync('project', { ignore: ['subdir'] })
    // => ['one.txt']
    ```

    As an alternative to string globs, you can pass an array of precompiled
    [`minimatch.Minimatch`](https://github.com/isaacs/minimatch#minimatch-class)
    instances. This is faster and allows to specify your own globbing options.

* `includeBasePath` (default: false): Pass `true` to include the basePath in the output.
   *note: this flag is only for `walkSync(..)` not `walkSync.entries(..)`*

   ```js
    const paths = walkSync('project', { includeBasePath: true });
    // => ['project/one.txt', 'project/subdir/two.txt']
   ```

* `fs`: Allows an alternative implementation of [fs](https://nodejs.org/api/fs.html) to be supplied.
   *examples of alternative file systems include [memfs](https://github.com/streamich/memfs) or [graceful-fs](https://github.com/isaacs/node-graceful-fs#readme)*

   ```js
    import {Volume, createFsFromVolume} from 'memfs'
    const fs = createFsFromVolume(Volume.fromJSON({'aDir/aFile': 'some-contents'}))
    const paths = walkSync('project', { fs });
    // => ['aDir/', 'aDir/aFile']
   ```

* `globOptions`: Pass any options for [Minimatch](https://www.npmjs.com/package/minimatch) that will be applied to all items in `globs` and `ignore` that are strings.

  If items in `globs` or `ignore` are instances of `minimatch.Minimatch`, the `globOptions` will not be applied.

## Background

`walkSync(baseDir)` is a faster substitute for

```js
glob.sync('**', {
  cwd: baseDir,
  dot: true,
  mark: true,
  strict: true
})
