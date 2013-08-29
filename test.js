
// test.js - Test suites for have.js
(function() {

  var assert = require('chai').assert
    , filename = process.env.COVER ? './have-cov.js' : './have.js'
    , have = require(filename);

  var NON_ARRS = [null, undefined, 'str', 123, { }, function() { }]
    , NON_OBJS = [null, undefined, 'str', 123];

  var COMMON_TYPES = ['string', 'number', 'object', 'function']
    , FUNC = function() { };


  describe('HAVE module', function() {
    it('should exports a function', function() { assert.isFunction(have); });

    describe('configuration', function() {
      describe('assert() function', function() {
        it('should be exported', function() {
          assert.isFunction(have.assert);
        });

        it('should returns the native assert() function when called normally', function() {
          assert.equal(have.assert(), require('assert'));
        });

        it('should use given function as assert() replacement', function() {
          var called = false
            , spy = function() { called = true; };

          have.assert(spy);
          have([123], { one: 'string' });

          assert.isTrue(called);
          have.assert(require('assert'));
        });
      });
    });

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
        { one   : 'string'
        , two   : 'number'
        , three : 'function'
        , four  : 'object' };

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

    describe('with built-in types schema', function() {
      describe('RegExp type', function() {
        var SCHEMA = { one: 'regex' };

        checkThrows(
          { 'regex argument is missing'        : [[], SCHEMA, /one/i]
          , 'regex argument is *not* a RegExp' : [['123'], SCHEMA, /one/i]
          });

        checkNotThrows(
          { 'RegExp instance given as argument'            : [[new RegExp()], SCHEMA]
          , 'regular expression literal given as argument' : [[/test/i], SCHEMA]
          });
      });

      describe('Date type', function() {
        var SCHEMA = { one: 'date' };

        checkThrows(
          { 'date argument is missing'               : [[], SCHEMA, /one/i]
          , 'date argument is *not* a Date instance' : [[{ }], SCHEMA, /one/i]
          , 'date argument is a string'              : [['' + new Date()], SCHEMA, /one/i]
          });

        checkNotThrows(
          { 'date argument is given correctly' : [[new Date()], SCHEMA]
          });

      });
    });

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
          { 'array member is falsy'           : [[[null]], SCHEMA, /element/i]
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

    describe('with optional argument schema', function() {
      var SCHEMA =
        { str : 'string'
        , num : 'optional number'
        , cb  : 'function' };

      checkThrows(
        { 'arguments before the optional arg is missing'         : [[], SCHEMA, /str/i]
        , 'arguments after the optional arg is missing'          : [['str', 123], SCHEMA, /cb/i]
        , 'arguments before the optional arg is of invalid type' : [[123], SCHEMA, /str/i]
        , 'arguments after the optional arg is of invalid type'  : [['str', 123, 'str'], SCHEMA, /cb/i]
        });

      checkNotThrows(
        { 'optional argument omitted but other arguments are given correctly'        : [['str', FUNC], SCHEMA]
        , 'optional arguments specified and all other arguments are given correctly' : [['str', 123, FUNC], SCHEMA]
        , 'optional argument is specified as `null`'                                 : [['str', null, FUNC], SCHEMA]
        , 'optioanl argument is specified as `undefined`'                            : [['str', undefined, FUNC], SCHEMA]
        });

    }); // optional arg schema

    describe('with complex schema', function() {
      describe('`string array or number array` type', function() {
        var SCHEMA = { arg: 'string array or number array' };

        it('should throws if non-array is given', function() {
          NON_ARRS.forEach(function(thing) {
            assert.throws(function() { have([thing], SCHEMA); }, /array/i);
          });
        });

        it('should throws if array given but element is of neither type', function() {
          assert.throws(function() { have([{ }], SCHEMA); }, /neither/i);
        });

        it('should *not* throws if element is of string type', function() {
          assert.doesNotThrow(function() { have([['string']], SCHEMA); });
        });

        it('should *not* throws if element is of number type', function() {
          assert.doesNotThrow(function() { have([[123]], SCHEMA); });
        });

      });

      describe('`opt num, str, opt str, str, opt num` type (ambiguous optionals)', function() {
        var SCHEMA =
          { one   : 'opt num'
          , two   : 'str'
          , three : 'opt str'
          , four  : 'str'
          , five  : 'opt num'
          };

        checkThrows(
          { 'nothing is given'            : [[], SCHEMA, /two/i]
          , 'a single argument is given'  : [['two'], SCHEMA, /four/i]
          , 'two numbers are given'       : [[123, 456], SCHEMA, /two/i]
          , 'two strings are given'       : [['str', 'abc'], SCHEMA, /four/i]
          , 'only the 3rd arg is omitted' : [[123, 'str', 'abc', 456], SCHEMA, /four/i]
          });

        checkNotThrows(
          { 'three strings are given'              : [['str', 'abc', 'def'], SCHEMA]
          , 'a number and three strings are given' : [[123, 'a', 'b', 'c'], SCHEMA]
          , 'everything is given'                  : [[123, 'a', 'b', 'c', 456], SCHEMA]
          });
      });

      // actually an invalid type but we're testing it to make sure nonetheless
      describe('`str or opt num` type (nested optional)', function() {
        var SCHEMA = { one: 'str or opt num' };

        checkNotThrows(
          { 'argument is given but of neither type' : [[{ }], SCHEMA]
          , 'string argument is given'              : [['str'], SCHEMA]
          , 'number argument is given'              : [[123], SCHEMA]
          });
      });

      describe('`str or num or arr or func` type (nested ORs)', function() {
        var SCHEMA = { one: 'str or num or arr or func' };

        checkNotThrows(
          { 'string is given'   : [['str'], SCHEMA]
          , 'number is given'   : [[123], SCHEMA]
          , 'array is given'    : [[[]], SCHEMA]
          , 'function is given' : [[FUNC], SCHEMA]
          });

        checkThrows({ 'object is given': [[{ }], SCHEMA] });
      });

      describe('`num arr arr arr` type (nested arrays)', function() {
        var SCHEMA = { one: 'num arr arr arr' };

        checkThrows(
          { 'non-array is given at first nesting level'  : [[[123]], SCHEMA, /one/i]
          , 'non-array is given at second nesting level' : [[[[123]]], SCHEMA, /one/i]
          });

        checkNotThrows(
          { 'an empty array is given'                : [[[]], SCHEMA]
          , 'a nested empty array is given'          : [[[[]]], SCHEMA]
          , 'deeply nested empty array is given'     : [[ [[[]]] ], SCHEMA]
          , 'multiple nested empty arrays are given' : [[ [], [[]], [[[]]], [[[[]]]] ], SCHEMA]
          , 'number array is given at correct depth' : [[ [[[123]]] ], SCHEMA]
          , 'multiple nested number arrays are given' : [[ [[[123], [456]], [[789]]] ], SCHEMA]
          })
      });
    })

  });

})();

