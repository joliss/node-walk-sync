# node-walk-sync

[![Build Status](https://travis-ci.org/joliss/node-walk-sync.png?branch=master)](https://travis-ci.org/joliss/node-walk-sync)

Return an array containing all recursive files and directories under a given
directory, similar to Unix `find`. Follows symlinks. Bare-bones, but
very fast.

Similar to [`wrench.readdirSyncRecursive`](https://github.com/ryanmcgrath/wrench-js#synchronous-operations),
but adds trailing slashes to directories.

Not to be confused with [node-walk](https://github.com/coolaj86/node-walk),
which has both an asynchronous and a synchronous API.

## Installation

```bash
npm install --save walk-sync
```

## Usage

```js
var walkSync = require('walk-sync');
var paths = walkSync('foo')
```

Given `foo/one.txt` and `foo/subdir/two.txt`, `paths` will be the following
array:

```js
['one.txt', 'subdir/', 'subdir/two.txt']
```

Note that directories come before their contents, and have a trailing slash.

Symlinks are followed.

### Globs

You can pass an array of globs as a second parameter to `walkSync` to restrict
the set of files returned:

```js
var walkSync = require('walk-sync');

// all files and directories contained within
var paths = walkSync('project');

// only files and directories matching the provided globs
var paths = walkSync('project', ['lib/**/*.js', '*.md']);

// only files matching the provided globs
var paths = walkSync('project', {
  glob: ['lib/**/*.js', '*.md'],
  directories: false // default true
});
```

Given files `project/lib/main.js`, `project/README.md`, and
`project/scripts/install.sh`, this will return `['lib/main.js', 'README.md']`.
Additionally, `walkSync` will be smart enough not to descend into
`project/scripts`, improving performance.

As an alternative to string globs, you can pass an array of precompiled
[`minimatch.Minimatch`](https://github.com/isaacs/minimatch#minimatch-class)
instances. This is faster and allows to specify your own globbing options.

## Background

`walkSync(baseDir)` is a faster substitute for

```js
glob.sync('**', {
  cwd: baseDir,
  dot: true,
  mark: true,
  strict: true
})
```
