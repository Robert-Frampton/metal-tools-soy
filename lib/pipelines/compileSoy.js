'use strict';

var combiner = require('stream-combiner');
var ignore = require('gulp-ignore');
var soynode = require('gulp-soynode');
var soyparser = require('soyparser');
var through = require('through2');
var wrapper = require('gulp-wrapper');

var parsedSoys = {};
var templateData = {};

module.exports.pipeline = function(options) {
	options = options || {};
	options.corePathFromSoy = options.corePathFromSoy || 'bower:metal/src';
	
	parsedSoys = {};
	templateData = {};

	return combiner(
		extractParams(),
		soynode({
			loadCompiledTemplates: false,
			locales: options.soyLocales,
			messageFilePathFormat: options.soyMessageFilePathFormat,
			shouldDeclareTopLevelNamespaces: false
		}),
		ignore.exclude('*.soy'),
		wrapper({
			header: getHeaderContent(options.corePathFromSoy),
			footer: getFooterContent
		})
	);
};

function addTemplateParam(soyJsPath, templateName, param) {
	templateData[soyJsPath][templateName].params.push(param);
}

function extractParams() {
	return through.obj(function(file, encoding, callback) {
		var soyJsPath = file.relative + '.js';
		var parsed = getParsedSoy(soyJsPath, file.contents);
		var namespace = parsed.namespace;

		templateData[soyJsPath] = {};
		parsed.templates.forEach(function(cmd) {
			if (cmd.deltemplate) {
				return;
			}

			var templateName = namespace + '.' + cmd.name;
			if (cmd.attributes.private === 'true') {
				templateData[soyJsPath][templateName] = {private: true};
				return;
			}

			var skippedUpdates = {};
			var staticSurface = false;
			cmd.docTags.forEach(function(docTag) {
				if (docTag.tag === 'skipUpdates') {
					docTag.description.split(/\s+/).forEach(function(skip) {
						skippedUpdates[skip] = true;
					});
				} else if (docTag.tag === 'static') {
					staticSurface = true;
				}
			});

			templateData[soyJsPath][templateName] = {params: [], static: staticSurface};
			cmd.params.forEach(function(tag) {
				if (!skippedUpdates[tag.name]) {
					addTemplateParam(soyJsPath, templateName, tag.name);
				}
			});
		});

		this.push(file);
		callback();
	});
}

function getFilenameNoLocale(filename) {
	return filename.replace(/_[^.]+\.soy/, '.soy');
}

function getFooterContent(file) {
	var footer = '';
	var pathNoLocale = getFilenameNoLocale(file.relative);
	var fileData = templateData[pathNoLocale];
	for (var templateName in fileData) {
		if (fileData[templateName].params) {
			footer += '\n' + templateName + '.params = ' + JSON.stringify(fileData[templateName].params) + ';';
		}
		if (fileData[templateName].private) {
			footer += '\n' + templateName + '.private = true;';
		}
		if (fileData[templateName].static) {
			footer += '\n' + templateName + '.static = true;';
		}
	}
	var componentName = getParsedSoy(pathNoLocale, file.contents).namespace.substr(10);
	footer += '\n\nclass ' + componentName + ' extends Component {}\n' +
		componentName + '.RENDERER = SoyRenderer;\n' +
		'SoyAop.registerTemplates(\'' + componentName + '\');\n' +
		'export default ' + componentName + ';\n';
	return footer + '/* jshint ignore:end */\n';
}

function getHeaderContent(corePathFromSoy) {
	return function(file) {
		var corePath = corePathFromSoy;
		if (typeof corePath === 'function') {
			corePath = corePathFromSoy(file);
		}
		corePath = corePath.replace(/\\/g, '/');
		return '/* jshint ignore:start */\n' +
			'import Component from \'' + corePath + '/component/Component\';\n' +
			'import SoyAop from \'' + corePath + '/soy/SoyAop\';\n' +
			'import SoyRenderer from \'' + corePath + '/soy/SoyRenderer\';\n' +
			'import SoyTemplates from \'' + corePath + '/soy/SoyTemplates\';\n' +
			'var Templates = SoyTemplates.get();\n';
	};
}

function getParsedSoy(soyJsPath, contents) {
	if (!parsedSoys[soyJsPath]) {
		parsedSoys[soyJsPath] = soyparser(contents);
	}
	return parsedSoys[soyJsPath];
}