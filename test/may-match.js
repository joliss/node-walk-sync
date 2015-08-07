var fs = require('fs')
var tap = require('tap')
var test = tap.test
var mayMatch = require('../may-match')

tap.Test.prototype.addAssert('mayMatch', 2, function(path, matcher) {
  this.assert(mayMatch(path, matcher), 'expected: `' + path + '` to match: `' + matcher + '`')
})

tap.Test.prototype.addAssert('mayNotMatch', 2, function(path, matcher) {
  this.assert(!mayMatch(path, matcher), 'expected to NOT: `' + path + '` to match: `' + matcher + '`')
})

test('should traverse', function(t) {
  t.mayMatch('dir/bar.txt', 'dir/bar.txt')
  t.mayNotMatch('dir/bar.foo', 'dir/bar.txt')
  t.mayMatch('dir/bar.foo', 'dir/bar.{txt,foo}')
  t.mayMatch('dir/bar.txt', 'dir/bar.{txt,foo}')
  t.mayMatch('dir/', 'dir/bar.txt')
  t.mayMatch('dir/', 'dir/bar.{txt,foo}')
  t.mayMatch('dir/', 'dir/bar.{foo,txt}')
  t.mayMatch('dir/', '{dir,bar}')
  t.mayMatch('dir/', '{bar,dir}/foo')
  t.mayNotMatch('dir/', '{bar}')
  t.mayNotMatch('bar', 'baz')
  t.mayNotMatch('dir/subdir', 'dir/bar.txt')
  t.mayNotMatch('dir/zzz.txt', 'dir/bar.txt')
  t.mayNotMatch('foo.txt', 'dir/bar.txt')
  t.mayNotMatch('some-other-dir', 'dir/bar.txt')
  t.mayNotMatch('symlink1', 'dir/bar.txt')
  t.mayNotMatch('symlink2', 'dir/bar.txt')
  t.mayNotMatch('foo.txt', 'dir/bar.txt')
  t.mayMatch('foo/baz', 'foo/baz/bar/{buz,quz}')
  t.mayMatch('foo/baz', 'foo/{bar,baz}/bar/{buz,quz}')
  t.mayNotMatch('foo/baz/quz', 'foo/{bar,baz}/bar/{buz,quz}')
});
