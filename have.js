
// have.js - Main have.js exports
module.exports = (function(undefined) {

  var assert = require('assert')
    , log    = function() { } // require('util').log; // disabled
    ;

  var ARR_RX = /^(.+) a(rr(ay)?)?$/i
    , OR_RX  = /^(.+) or (.+)$/i
    , OPT_RX = /^opt(ional)? (.+)$/i;

  // tools functions

  function assign () {
    var args = Array.prototype.slice.call(arguments, 0)
      , target = args[0]
      , source = args.slice(1);

    for (var i = 0, len = source.length; i < len; i++) {
      for (var p in source[i]) {
        if (source[i].hasOwnProperty(p)) {
          target[p] = source[i][p];
        }
      }
    }

    return target;
  }

  // { 's|str': val1 } -> { 's': val1, 'str': val1 }
  function unfoldTypes (types) {
    var unfolded = {};
    for (var p in types) {
      if (types.hasOwnProperty(p)) {
        var variants = p.split(/\|/);
        for (var i = 0, len = variants.length; i < len; i++) {
          unfolded[variants[i]] = types[p]
        }
      }
    }
    return unfolded;
  }

  // core recursive check
  function ensure(types, argName, argType, value, check) {
    var memberType = null
      , valid      = true
      , reason     = null
      , match      = null
      , i          = 0;

    function softAssert(cond, reason_) {
      if (!(valid = cond)) reason = reason_;
    }

    function logMatch() { log(match[0]); }

    if (match = argType.match(OPT_RX)) {
      logMatch();
      memberType = match[2];

      ensure(types, argName, memberType, value, softAssert);

      // optional is consumed if it match or a null/undefined is given.
      return valid ||
        value === null ||
        value === undefined;
    }

    if (match = argType.match(OR_RX)) {
      logMatch();
      memberType = match[1];
      ensure(types, argName, memberType, value, softAssert);

      if (valid) return true;
      valid = true; // reset previous softAssert

      memberType = match[2];
      ensure(types, argName, memberType, value, softAssert);

      check(valid, argName + " argument is neither a " + match[1] +
        " nor " + match[2]);
      return true;
    }

    if (match = argType.match(ARR_RX)) {
      logMatch();
      ensure(types, argName, 'array', value, softAssert);

      if (!valid) {
        check(false, reason);
        return false;
      }

      memberType = match[1];
      for (i = 0; i < value.length; i++) {
        ensure(types, argName, memberType, value[i], softAssert);

        if (!valid) {
          check(false, argName + " element is falsy or not a " + memberType);
          return false;
        }
      }

      return true;
    }

    // atom types
    log(argType);
    valid = types.hasOwnProperty(argType)
      ? types[argType](value)
      : types.default(value);

    check(valid, argName + " argument is not " + argType);
    return true;
  }

  function ensureArgs(args, schema, types, strict) {
    if (!(args && typeof args === 'object' && 'length' in args))
      throw new Error('have() called with invalid arguments list');
    if (!(schema && typeof schema === 'object'))
      throw new Error('have() called with invalid schema object');

    var ensureResults = []
      , parsedArgs = {}
      , argIndex = 0
      , fail = null
      , i;

    if (schema instanceof Array) {
      if (!schema.length)
        throw new Error('have() called with empty schema list');

      for (i = 0, len = schema.length; i < len; i++) {
        ensureResults[i] = ensureArgs(args, schema[i], types, strict);
      }

      ensureResults.sort(function (a, b) {
        if (a.argIndex > b.argIndex) return -1;
        if (a.argIndex < b.argIndex) return 1;
        return 0
      });

      for (i = 0; i < ensureResults.length; i++) {
        if (!ensureResults[i].fail) return ensureResults[i];
      }

      return ensureResults[0];
    } else {
      for (var argName in schema) {
        if (schema.hasOwnProperty(argName)) {
          var ensured = ensure(types, argName, schema[argName], args[argIndex],
            function (cond, fail_) { if (!cond) fail = fail_; });
          if (fail) break;
          if (ensured) {
            parsedArgs[argName] = args[argIndex];
            argIndex++;
          }
        }
      }

      if (strict && !fail && argIndex < args.length) {
        var argStr = args[argIndex].toString();
        fail = 'Wrong argument "' + (argStr.length > 15
            ? argStr.substring(0, 15) + '..'
            : argStr) + '"';
      }

      return {
        fail: fail,
        parsedArgs: parsedArgs,
        argIndex: argIndex
      }
    }
  }

  // exports
  function have(args, schema, strict) {
    var res = ensureArgs(args, schema, this.types, strict);
    assert(!res.fail, res.fail);
    return res.parsedArgs;
  }

  // configuration
  have.assert = function(assert_) {
    return (assert_ === undefined) ? assert : (assert = assert_);
  };

  have.strict = function(args, schema) {
    return this(args, schema, true);
  };

  have.types = {};

  have.with = function (types) {
    if (!(types && typeof types === 'object')) {
      throw new Error('types argument must be an object')
    }
    var _have = function () { return have.apply(_have, arguments) };
    _have.assert = have.assert;
    _have.strict = have.strict.bind(_have);
    _have.with = have.with;
    _have.types = assign({}, unfoldTypes(this.types), unfoldTypes(types));

    return _have;
  };

  return have.with(
    // basic types
    { 's|str|string': function (value) { return typeof value === 'string'; }
    , 'n|num|number': function (value) { return typeof value === 'number'; }
    , 'b|bool|boolean': function (value) { return typeof value === 'boolean'; }
    , 'f|fun|func|function': function (value) {
      return typeof value === 'function'; }
    , 'a|arr|array': function (value) { return value instanceof Array }
    , 'o|obj|object': function (value) {
      return value && typeof value === 'object'; }

    // built-in types
    , 'r|rx|regex|regexp': function (value) {
      return value && value instanceof RegExp }
    , 'd|date': function (value) { return value && value instanceof Date }
    , 'default': function () { return false; } }
  );

})();

