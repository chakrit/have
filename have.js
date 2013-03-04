
// have.js - Main have.js exports
module.exports = (function(undefined) {

  var assert = require('assert');

  var ARR_RX = /^(.+) array$/i;

  function ensure(argName, argType, value, message) {
    var memberType = null, match = null, i = 0;

    match = argType.match(ARR_RX);
    if (match) { // array
      ensure(argName, 'array', value, message);

      memberType = match[1]
      for (i = 0; i < value.length; i++)
        ensure(argName, memberType, value[i], message ||
          (argName + " argument has falsy or non-" + memberType + " member."));
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
    }
  }

  return function have(args, schema) {
    if (!(args && typeof args === 'object' && 'length' in args))
      throw new Error('have() called with invalid arguments list');
    if (!(schema && typeof schema === 'object'))
      throw new Error('have() called with invalid schema object');

    var idx = 0, argName = null, arg = null;
    for (argName in schema)
      ensure(argName, schema[argName], args[idx++]);
  };

})();

