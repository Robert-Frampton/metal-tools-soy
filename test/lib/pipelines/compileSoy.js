'use strict';

var assert = require('assert');
var compileSoy = require('../../../lib/pipelines/compileSoy');
var vfs = require('vinyl-fs');

describe('Compile Soy Pipeline', function() {
	it('should compile soy files to js', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      assert.strictEqual('simple.soy.js', file.relative);
  		done();
    });
	});

	it('should set the "params" variable for each template, with a list of its param names', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
      assert.notStrictEqual(-1, contents.indexOf('Templates.Simple.content.params = [];'));
      assert.notStrictEqual(-1, contents.indexOf('Templates.Simple.hello.params = ["firstName","lastName"];'));
  		done();
    });
	});

	it('should set the "private" variable to true for private templates', function(done) {
    var stream = vfs.src('test/fixtures/soy/private.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
      assert.strictEqual(-1, contents.indexOf('Templates.Private.content.private = true;'));
      assert.notStrictEqual(-1, contents.indexOf('Templates.Private.hello.private = true;'));
			done();
		});
	});

	it('should set the "static" variable to true for templates with the @static doc tag', function(done) {
    var stream = vfs.src('test/fixtures/soy/static.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
      assert.strictEqual(-1, contents.indexOf('Templates.Static.content.static = true;'));
      assert.notStrictEqual(-1, contents.indexOf('Templates.Static.hello.static = true;'));
			done();
		});
	});

	it('should not add params listed in "skipUpdates" to the "params" variable', function(done) {
    var stream = vfs.src('test/fixtures/soy/skipUpdates.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
      assert.notStrictEqual(-1, contents.indexOf('Templates.SkipUpdates.hello.params = ["foobar"];'));
			done();
		});
	});

	it('should add lines to generated soy js file that import some metal ES6 modules', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('import Component from \'bower:metal/src/component/Component\';'));
			assert.notStrictEqual(-1, contents.indexOf('import SoyAop from \'bower:metal/src/soy/SoyAop\';'));
			assert.notStrictEqual(-1, contents.indexOf('import SoyRenderer from \'bower:metal/src/soy/SoyRenderer\';'));
			assert.notStrictEqual(-1, contents.indexOf('import SoyTemplates from \'bower:metal/src/soy/SoyTemplates\';'));
			done();
		});
	});

	it('should import ES6 modules according to core path indicated by the corePathFromSoy option', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline({corePathFromSoy: 'some/path'}));
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.strictEqual(-1, contents.indexOf('import Component from \'bower:metal/src/component/Component\';'));
			assert.notStrictEqual(-1, contents.indexOf('import Component from \'some/path/component/Component\';'));
			done();
		});
	});

	it('should normalize import paths', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline({corePathFromSoy: 'some\\path'}));
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.strictEqual(-1, contents.indexOf('import Component from \'some\\path/component/Component\';'));
			assert.notStrictEqual(-1, contents.indexOf('import Component from \'some/path/component/Component\';'));
			done();
		});
	});

	it('should import ES6 modules according to core path indicated by the result of the corePathFromSoy option fn', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline({
        corePathFromSoy: function() {
          return 'fn/path';
        }
      }));
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.strictEqual(-1, contents.indexOf('import Component from \'bower:metal/src/component/Component\';'));
			assert.notStrictEqual(-1, contents.indexOf('import Component from \'fn/path/component/Component\';'));
			done();
		});
	});

	it('should automatically generate and export component class using SoyRenderer', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('class Simple extends Component'));
			assert.notStrictEqual(-1, contents.indexOf('Simple.RENDERER = SoyRenderer;'));
      assert.notStrictEqual(-1, contents.indexOf('export default Simple;'));
			done();
		});
	});

	it('should call SoyAop.registerTemplates', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy.pipeline());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('SoyAop.registerTemplates(\'Simple\');'));
			done();
		});
	});
});