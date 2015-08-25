var Minimatch = require('minimatch').Minimatch;

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
  return new MatcherCollection(value);
}

function makeArray(x) {
  return Array.isArray(x) ? x : [ x ];
}
module.exports = function mayContain(value, matcher) {
  return getMatcher(makeArray(matcher)).mayContain(value);
}

module.exports.buildMatcher = function buildMatcher(matcher) {
  return getMatcher(makeArray(matcher));
}
