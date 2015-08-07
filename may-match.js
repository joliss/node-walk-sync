var Minimatch = require('minimatch').Minimatch;

var MATCHER_CACHE = Object.create(null);

function MatcherCollection(matchers) {
  this.matchers = matchers.map(function(matcher) {
    return typeof matcher === 'string' ? new Minimatch(matcher) : matcher;
  });
}

MatcherCollection.prototype.match = function(value) {
  for (var i = 0; i < this.matchers.length; i++) {
    if (this.matchers[i].match(value)) {
      return true;
    }
  }

  return false;
};

MatcherCollection.prototype.matchesPart = function(part, index) {
  for (var i = 0; i < this.matchers.length; i++) {
    var matcher = this.matchers[i];

    // for some expansions, we could reduce many duplicate comparisons here
    for (var j = 0; j < matcher.set.length; j++) {
      var entry = matcher.set[j][index];
      if (entry === part) { return true; }
      else if (entry instanceof RegExp && entry.test(part)) { return true; }
      else if (typeof entry === 'object')                   { return true; }
    }
  }

  return false;
};

MatcherCollection.prototype.mayContain = function(value) {
  if (this.match(value)) { return true; }

  var parts = value.split('/').filter(Boolean); // trailing '' when value ends with '/'

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    var found = this.matchesPart(part, i);
    if (found === false) {
      return false;
    }
  }

  return true;
};

function getMatcher(value) {
  var key = value.join('\x00');

  if (MATCHER_CACHE[key]) { return MATCHER_CACHE[key]; }
  var m = new MatcherCollection(value);

  MATCHER_CACHE[key] = m;

  return m;
}

function makeArray(x) {
  return Array.isArray(x) ? x : [x];
}

module.exports = function mayContain(value, matcher) {
  return getMatcher(makeArray(matcher)).mayContain(value);
}

module.exports.buildMatcher = function buildMatcher(matcher) {
  return getMatcher(makeArray(matcher));
}
