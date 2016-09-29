'use strict';

var assert = require('assert');
var del = require('del');
var fs = require('fs');
var metalToolsSoy = require('../index');
var sinon = require('sinon');

describe('Metal Tools - Soy', function() {
  beforeEach(function(done) {
    deleteCompiledSoyFiles(done);
  });

	after(function(done) {
    deleteCompiledSoyFiles(done);
	});

	it('should compile specified soy files to js', function(done) {
    var stream = metalToolsSoy({
      src: 'test/fixtures/soy/simple.soy',
      dest: 'test/fixtures/soy'
    });
    stream.on('end', function() {
      assert.ok(fs.existsSync('test/fixtures/soy/simple.soy.js'));
  		done();
    });
	});

  it('should emit error and end stream when the soy jar compiler throws an error', function(done) {
    var stream = metalToolsSoy({
      src: 'test/fixtures/soy/compileError.soy',
      dest: 'test/fixtures/soy'
    });
    sinon.stub(console, 'error');
    stream.on('end', function() {
      assert.strictEqual(1, console.error.callCount);
      done();
    });
  });
});

function deleteCompiledSoyFiles(done) {
  del('test/fixtures/**/*.soy.js').then(function() {
    done();
  });
}
