
// test.js - Test suites for have.js
(function() {

  var assert = require('chai').assert
    , filename = process.env.COVER ? './have-cov.js' : './have.js'
    , have = require(filename);

  var NON_ARRS = [null, undefined, 'str', 123, { }]
    , NON_OBJS = [null, undefined, 'str', 123];

  var COMMON_TYPES = ['string', 'number', 'object', 'function']
    , FUNC = function() { };


  describe('HAVE module', function() {
    it('should exports a function', function() { assert.typeOf(have, 'function'); });

    it('should throws if `args` argument does not looks like an array', function() {
      NON_ARRS.forEach(function(thing) {
        assert.throws(function() { have(thing); }, /arguments/i);
      });
    });
    // TODO: Check arguments object
    //
    it('should *not* throws if `args` is function `arguments`', function() {
      assert.doesNotThrow(function() {
        var func = function() { have(arguments, { }); };
        func.call(this);
      });
    });

    it('should throws if `schema` argument does not looks like an options hash', function() {
      NON_OBJS.forEach(function(thing) {
        console.log(require('util').inspect(thing));
        assert.throws(function() { have([], thing); }, /schema/i);
      });
    });

    describe('with empty schema', function() {
      it('should *not* throws', function() {
        assert.doesNotThrow(function() { have([], { }); });
      });
    }); // empty schema

    // templated tests
    function checkThrows(cases) {
      for (var description in cases) (function(description, args) {
        it('should throws if ' + description, function() {
          assert.throws(function() {
            have.call(this, args[0], args[1]);
          }, args[2]);
        });
      })(description, cases[description]);
    }

    function checkNotThrows(cases) {
      for (var description in cases) (function(description, args) {
        it('should *not* throws if ' + description, function() {
          assert.doesNotThrow(function() {
            have.call(this, args[0], args[1]);
          }, args[2]);
        });
      })(description, cases[description]);
    }

    // schema tests
    describe('with basic schema', function() {
      var SCHEMA =
        { one: 'string'
        , two: 'number'
        , three: 'function'
        , four: 'object' };

      checkThrows(
        { 'first argument is missing'          : [[], SCHEMA, /one/i]
        , 'second argument is missing'         : [['str'], SCHEMA, /two/i]
        , 'third argument is missing'          : [['str', 123], SCHEMA, /three/i]
        , 'fourth argument is missing'         : [['str', 123, FUNC], SCHEMA, /four/i]
        , 'first argument is of invalid type'  : [[123], SCHEMA, /one/i]
        , 'second argument is of invalid type' : [['str', 'str'], SCHEMA, /two/i]
        , 'third argument is of invalid type'  : [['str', 123, 'str'], SCHEMA, /three/i]
        , 'fourth argument is of invalid type' : [['str', 123, FUNC, 123], SCHEMA, /four/i]
        });

      checkNotThrows({ 'all arguments given correctly': [['str', 123, FUNC, { }], SCHEMA] });

    }); // basic schema

    describe('with array schema', function() {
      var SCHEMA = { arr: 'array' };

      checkThrows(
        { 'array argument is missing'        : [[], SCHEMA, /arr/i]
        , 'array argument is *not* an array' : [['str'], SCHEMA, /arr/i]
        });

      checkNotThrows({ 'array argument given correctly': [[[123, 456]], SCHEMA] });

      describe('with member type specified', function() {
        var SCHEMA = { nums: 'number array' };

        checkThrows(
          { 'array member is falsy'           : [[[null]], SCHEMA, /member/i]
          , 'array member is of invalid type' : [[['str']], SCHEMA, /nums/i]
          });

        checkNotThrows(
          { 'array argument with members given correctly': [[[123, 456]], SCHEMA]
          });

      });
    }); // array schema

    describe('with OR argument schema', function() {
      var SCHEMA = { str: 'string or number' };

      checkThrows(
        { 'argument is missing or falsy'              : [[null], SCHEMA, /str/i]
        , 'argument is of neither the specified type' : [[FUNC], SCHEMA, /str/i]
        });

      checkNotThrows(
        { 'argument is of the first type': [['str'], SCHEMA]
        , 'argument is of the second type': [[123], SCHEMA]
        });
    }); // OR schema

    describe.skip('with optional argument schema', function() {
      var SCHEMA =
        { str: 'string'
        , num: 'optional number'
        , cb: 'function' };

      checkThrows(
        { 'arguments before the optional arg is missing'         : [[], SCHEMA, /str/i]
        , 'arguments after the optional arg is missing'          : [['str', 123], SCHEMA, /cb/i]
        , 'arguments before the optional arg is of invalid type' : [[123], SCHEMA, /str/i]
        , 'arguments after the optional arg is of invalid type'  : [['str', 123, 'str'], SCHEMA, /cb/i]
        });

      checkNotThrows(
        { 'optional argument omitted but other arguments are given correctly'        : [['str', FUNC], SCHEMA]
        , 'optional arguments specified and all other arguments are given correctly' : [['str', 123, FUNC], SCHEMA]
        });

    }); // optional arg schema
  });

})();

