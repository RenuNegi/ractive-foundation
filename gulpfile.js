var gulp = require('gulp'),
	del = require('del'),
	runSequence = require('run-sequence'),
	mergeStream = require('merge-stream'),
	fs = require('fs'),

	plugins = require('gulp-load-plugins')();

	ractiveParse = require('./tasks/ractiveParse'),
	ractiveConcatComponents = require('./tasks/ractiveConcatComponents'),
	generateDocs = require('./tasks/generateDocs'),
	renderDocumentation = require('./tasks/renderDocumentation'),
	concatManifests = require('./tasks/concatManifests'),
	gulpWing = require('./tasks/gulpWing'),
	jshintFailReporter = require('./tasks/jshintFailReporter');

gulp.task('connect', function () {
	plugins.connect.server({
		root: 'public',
		livereload: true,
		port: 9080
	});
});

gulp.task('html', function () {
	return gulp.src('./public/*.html')
		.pipe(plugins.connect.reload());
});

gulp.task('copy-vendors', function () {

	return mergeStream(

		gulp.src([
			'./node_modules/ractive/ractive.js',
			'./node_modules/ractive/ractive.min.js',
			'./node_modules/ractive/ractive.min.js.map',
			'./node_modules/jquery/dist/jquery.min.js',
			'./node_modules/jquery/dist/jquery.min.map',
			'./node_modules/lodash/lodash.min.js'
		])
		.pipe(gulp.dest('./public/js')),

		gulp.src([
			'node_modules/zurb-foundation-5/doc/assets/img/images/**/*'
		])
		.pipe(gulp.dest('public/images/'))

	);

});

gulp.task('clean', function (callback) {
	del([
		'public/**/*'
	], callback);
});

gulp.task('build-sass', function () {

	return mergeStream(

		gulp.src('./src/**/*.scss')
			.pipe(plugins.sass())
			.pipe(plugins.concat('components.css'))
			.pipe(gulp.dest('./public/css')),

		gulp.src('./node_modules/zurb-foundation-5/scss/*.scss')
			.pipe(plugins.sass())
			.pipe(gulp.dest('./public/css/foundation')),

		gulp.src([
				'./src/index.html',
				'./src/data.html',
			])
			.pipe(plugins.header(fs.readFileSync('./src/header.html')))
			.pipe(plugins.footer(fs.readFileSync('./src/footer.html')))
			.pipe(gulp.dest('./public/'))

	);

});

gulp.task('ractive-build-templates', function () {
	return gulp.src('./src/components/**/*.hbs')
		.pipe(ractiveParse({
			'prefix': 'RactiveF'
		}))
		.pipe(plugins.concat('templates.js'))
		.pipe(gulp.dest('./public/js/'));
});

gulp.task('ractive-build-components', function () {
	return gulp.src('./src/components/**/*.js')
		.pipe(ractiveConcatComponents({
			'prefix': 'RactiveF'
		}))
		.pipe(plugins.concat('components.js'))
		.pipe(gulp.dest('./public/js/'));
});

gulp.task('build-documentation', function () {
	return gulp.src('./src/components/**/manifest.json')
		.pipe(concatManifests('manifest-all.js'))
		.pipe(gulp.dest('./public/'))
		.pipe(renderDocumentation())
		.pipe(plugins.concat('docs.html'))
		.pipe(plugins.header(fs.readFileSync('./src/header.html')))
		.pipe(plugins.footer(fs.readFileSync('./src/footer.html')))
		.pipe(gulp.dest('./public/'));
});

gulp.task('concat-app', function () {
	return gulp.src([
			'./src/app.js',
			'./public/js/templates.js',
			'./public/js/components.js'
		])
		.pipe(plugins.concat('ractivef.js'))
		.pipe(gulp.dest('./public/js/'))
		.pipe(plugins.wrap({ src: './src/ractivef-cjs.js'}))
		.pipe(plugins.concat('ractivef-cjs.js'))
		.pipe(gulp.dest('./public/js/'));
});

gulp.task('wing', function (callback) {
	gulpWing();
	callback();
});

gulp.task('build', ['clean', 'jshint'], function (callback) {
	runSequence([
		'build-sass',
		'ractive-build-templates',
		'ractive-build-components',
		'build-documentation'
	], [
		'copy-vendors',
		'concat-app'
	], callback);
});

gulp.task('watch', function () {
	var self = this;
	plugins.watch([
		'src/*.html',
		'src/**.*.json',
		'src/**/*.hbs',
		'src/**/*.md',
		'src/**/*.js',
		'src/**/*.scss'
	], function () {
		runSequence('build', 'html', function (err) {
			self.emit('end');
		});
	});

});

gulp.task('docs', function () {
	return gulp.src('./src/docs.html')
		.pipe(generateDocs())
		.pipe(gulp.dest('./public/'));;
});

gulp.task('jshint', function (callback) {
	return gulp.src('./src/**/*.js')
		.pipe(plugins.jshint('./.jshintrc'))
		.pipe(plugins.jshint.reporter('jshint-stylish'))
		.pipe(jshintFailReporter());
});

gulp.task('default', function () {
	var self = this;
	runSequence('jshint', 'build',  'connect', 'watch', function (err) {
		self.emit('end');
	});
});
