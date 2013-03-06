
// have.js - Main have.js exports
module.exports = (function(undefined) {

  var ARR_RX = /^(.+) array$/i
    , OR_RX  = /^(.+) or (.+)$/i
    , OPT_RX = /^opt(ional)? (.+)$/i;

  function ensure(argName, argType, value, message, assert) {
    var assert = assert || require('assert')
      , memberType = null
      , result = true
      , match = null, i = 0;

    /*
    match = argType.match(OPT_RX);
    if (match) {
      memberType = match[2]
      ensure(argName, memberType, value);
      return;
    }
    */

    match = argType.match(OR_RX);
    if (match) {
      memberType = match[1];
      ensure(argName, memberType, value, '', function (condition, message) {
        result = condition;
      });

      if (result) return;

      memberType = match[2];
      ensure(argName, memberType, value, '', function (condition, message) {
        result = condition;
      });

      assert(result, message ||
        (argName + " argument is neither a " + match[1] + " nor " + match[2]));
    }

    match = argType.match(ARR_RX);
    if (match) { // array
      ensure(argName, 'array', value, message);

      memberType = match[1];
      for (i = 0; i < value.length; i++)
        ensure(argName, memberType, value[i], message ||
          (argName + " argument has falsy or non-" + memberType + " member."));
      return;
    }

    switch (argType) {
      case 'string':
      case 'number':
      case 'function':
        assert(typeof value === argType, message ||
          (argName + " argument missing or not " + argType));
        break;

      case 'array':
        assert(value instanceof Array, message ||
          (argName + " argument missing or not " + argType));
        break;

      case 'object':
        assert(value && typeof value === 'object', message ||
            (argName + " argument missing or not object"));
    }
  }

  return function have(args, schema) {
    if (!(args && typeof args === 'object' && 'length' in args))
      throw new Error('have() called with invalid arguments list');
    if (!(schema && typeof schema === 'object'))
      throw new Error('have() called with invalid schema object');

    var idx = 0
      , argName = null
      , validations

    for (argName in schema) {
      ensure(argName, schema[argName], args[idx++]);
    }
  };

})();

