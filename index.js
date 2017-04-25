var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var _ = require("lodash");
var megaliquify = require('./megaliquify');

// consts
const PLUGIN_NAME = 'gulp-megaliquify';

// plugin level function (dealing with files)
function gulpLiquify(locals, options) {

	var settings = _.defaults(options || {}, {
		"base": false,
		"prefix": false,
		"filters": {},
		"layout": false
	});

	// creating a stream through which each file will pass
	var stream = through.obj(function (file, enc, cb) {

		if (file.isNull()) {
			return cb(null, file);
		}
		if (file.isStream()) {
			return this.emit('error', new PluginError('gulp-megaliquify', 'Streaming not supported'));
		}

		// Clone a fresh copy, so as not to affect others
		var tempLocals = locals ? _.clone(locals) : {};

		// Apply file specific locals
		if (file.locals) {
			tempLocals = _.defaults(file.locals, tempLocals);
		}

		var contents	= file.contents.toString("utf-8");

		if (settings.layout) {
			if (contents.indexOf('{% layout') == -1 || contents.indexOf('{%- layout') == -1) {
				contents	= '{% layout \'theme\' %}\n' + contents;
			}
		}

		megaliquify(contents, tempLocals, settings.base || file.base, settings.prefix, settings.filters)
			.then(function (result) {
				file.contents = new Buffer(result, "utf-8");
				this.push(file);
				return cb();
			}.bind(this))
			.catch(function (err) {
				this.emit('error', err);
				return cb();
			}.bind(this));

	});

	// returning the file stream
	return stream;
}

gulpLiquify.megaliquify = megaliquify;

// exporting the plugin main function
module.exports = gulpLiquify;
