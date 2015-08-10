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

MatcherCollection.prototype.mayContain = function(value) {
  var parts = value.split('/').filter(Boolean);

  for (var i = 0; i < this.matchers.length; i++) {
    var matcher = this.matchers[i];
    for (var j = 0; j < matcher.set.length; j++) {
      if (matcher.matchOne(parts, matcher.set[j], true)) {
        return true;
      }
    }
  }

  return false;
};

function getMatcher(value) {
  var key = value.map(function(entry) {
    if (entry.globSet) {
      return entry.globSet.join('\x00');
    } else {
      return entry;
    }
  }).join('\x00');

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
