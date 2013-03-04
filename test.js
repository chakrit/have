
// test.js - Test suites for have.js
(function() {

  require('mocha-subject').infect()

  var assert = require('chai').assert;

  var FILE = process.env.COVER ? './have-cov.js' : './have.js';

  describe('HAVE module', function() {
    subject('have', function() { return require(FILE); });

    it('should exports a function', function() {
      assert.typeOf(this.have, 'function');
    });
  });

})();

