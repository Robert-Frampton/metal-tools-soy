'use strict';

var compileSoy = require('./lib/pipelines/compileSoy');
var consume = require('stream-consume');
var defaultOptions = require('./lib/options');
var gutil = require('gulp-util');
var merge = require('merge');
var gulp = require('gulp');

function buildSoy(options) {
	options = merge({}, defaultOptions, options);
	return gulp.src(options.soySrc || options.src)
		.pipe(compileSoy(options).on('error', handleError))
		.pipe(gulp.dest(options.soyDest || options.dest));
}

function handleError(error) {
	var source = error.plugin || 'metal-tools-soy';
	console.error(new gutil.PluginError(source, error.message).toString());
	this.emit('end'); // jshint ignore:line
}

module.exports = function(options) {
	var stream = buildSoy(options);
	consume(stream);
	return stream;
};

module.exports.TASKS = [
	{name: 'soy', handler: buildSoy}
];
