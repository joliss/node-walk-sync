'use strict';

import fsNode = require('fs');
import * as MatcherCollection from 'matcher-collection';
import { Minimatch, type MinimatchOptions } from 'minimatch';
import ensurePosix = require('ensure-posix-path');
import path = require('path');

function walkSync(baseDir: string, inputOptions?: walkSync.Options | (string|Minimatch)[]) {
  const options = handleOptions(inputOptions);

  let mapFunct: (arg: walkSync.Entry) => string;
  if (options.includeBasePath) {
    mapFunct = function (entry: walkSync.Entry) {
      return entry.basePath.split(path.sep).join('/').replace(/\/+$/, '') + '/' + entry.relativePath;
    };
  } else {
    mapFunct = function (entry: walkSync.Entry) {
      return entry.relativePath;
    };
  }

  return _walkSync(baseDir, options, null, []).map(mapFunct);
}
export = walkSync;

function getStat(path: string, fs: walkSync.Options['fs'] = fsNode) {
  try {
    return fs.statSync(path);
  } catch(error) {
    if (error !== null && typeof error === 'object' && ['ENOENT', 'ENOTDIR', 'EPERM'].includes((error as any).code)) {
      return;
    }
    throw error;
  }
}

namespace walkSync {
  export function entries(baseDir: string, inputOptions?: Options | (string|Minimatch)[]) {
    const options = handleOptions(inputOptions);

    return _walkSync(ensurePosix(baseDir), options, null, []);
  };

  export interface Options {
    includeBasePath?: boolean,
    globs?: (string|Minimatch)[],
    ignore?: (string|Minimatch)[],
    directories?: boolean,
    fs?: typeof fsNode,
    globOptions?: MinimatchOptions,
  }

  export class Entry {
    relativePath: string;
    basePath: string;
    mode: number;
    size: number;
    mtime: number;

    constructor(relativePath: string, basePath: string, mode: number, size: number, mtime: number) {
      this.relativePath = relativePath;
      this.basePath = basePath;
      this.mode = mode;
      this.size = size;
      this.mtime = mtime;
    }

    get fullPath() {
      return `${this.basePath}/${this.relativePath}`;
    }

    isDirectory() {
      return (this.mode & 61440) === 16384;
    }
  }
}

function isDefined<T>(val: T | undefined) : val is T {
  return typeof val !== 'undefined';
}

function handleOptions(_options?: walkSync.Options | (string|Minimatch)[]) : walkSync.Options {
  let options: walkSync.Options = {};

  if (Array.isArray(_options)) {
    options.globs = _options;
  } else if (_options) {
    options = _options;
  }

  return options;
}

function applyGlobOptions(globs: (string|Minimatch)[] | undefined, options: MinimatchOptions) {
  return globs?.map(glob => { 
    if (typeof glob === 'string') { 
      return new Minimatch(glob, options);
    }

    return glob;
  })
}

function handleRelativePath(_relativePath: string | null) {
  if (_relativePath == null) {
    return '';
  } else if (_relativePath.slice(-1) !== '/') {
    return _relativePath + '/';
  } else {
    return _relativePath;
  }
}

function lexicographically(a: walkSync.Entry, b: walkSync.Entry) {
  const aPath = a.relativePath;
  const bPath = b.relativePath;

  if (aPath === bPath) {
    return 0;
  } else if (aPath < bPath) {
    return -1;
  } else {
    return 1;
  }
}

function _walkSync(baseDir: string, options: walkSync.Options, _relativePath: string | null, visited: string[]) : walkSync.Entry[] {
  const fs = options.fs ?? fsNode;
  // Inside this function, prefer string concatenation to the slower path.join
  // https://github.com/joyent/node/pull/6929
  const relativePath = handleRelativePath(_relativePath);
  const realPath = fs.realpathSync(baseDir + '/' + relativePath);
  if (visited.indexOf(realPath) >= 0) {
    return [];
  } else {
    visited.push(realPath);
  }

  try {
    const globOptions = options.globOptions;
    const ignorePatterns = (isDefined(globOptions)) ? applyGlobOptions(options.ignore, globOptions) : options.ignore;
    const globs = (isDefined(globOptions)) ? applyGlobOptions(options.globs, globOptions) : options.globs;
    let globMatcher;
    let ignoreMatcher: undefined | InstanceType<typeof MatcherCollection>;
    let results: walkSync.Entry[] = [];

    if (ignorePatterns) {
      // matcher-collection's published types expect the legacy IMinimatch from older minimatch
      // versions. Cast to any to bridge the mismatch with minimatch@10's types.
      ignoreMatcher = new MatcherCollection(ignorePatterns as any[]);
    }

    if (globs) {
      globMatcher = new MatcherCollection(globs as any[]);
    }

    if (globMatcher && !globMatcher.mayContain(relativePath)) {
      return results;
    }

    const names = fs.readdirSync(baseDir + '/' + relativePath);

    const entries = names.map(name => {
      let entryRelativePath = relativePath + name;

      if (ignoreMatcher && ignoreMatcher.match(entryRelativePath)) {
        return;
      }

      let fullPath = baseDir + '/' + entryRelativePath;
      let stats = getStat(fullPath, fs);

      if (stats && stats.isDirectory()) {
        return new walkSync.Entry(entryRelativePath + '/', baseDir, stats.mode, stats.size, stats.mtime.getTime());
      } else {
        return new walkSync.Entry(entryRelativePath, baseDir, stats && stats.mode || 0, stats && stats.size || 0, stats && stats.mtime.getTime() || 0);
      }
    }).filter(isDefined);

    const sortedEntries = entries.sort(lexicographically);

    for (let i = 0; i<sortedEntries.length; ++i) {
      let entry = sortedEntries[i];

      if (entry.isDirectory()) {
        if (options.directories !== false && (!globMatcher || globMatcher.match(entry.relativePath))) {
          results.push(entry);
        }

        results = results.concat(_walkSync(baseDir, options, entry.relativePath, visited));
      } else {
        if (!globMatcher || globMatcher.match(entry.relativePath)) {
          results.push(entry);
        }
      }
    }

    return results;
  } finally {
    visited.pop();
  }
}
