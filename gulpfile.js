var browserSync  = require('browser-sync');
var watchify     = require('watchify');
var browserify   = require('browserify');
var debowerify   = require('debowerify');
var source       = require('vinyl-source-stream');
var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpSequence = require('gulp-sequence');
var processhtml  = require('gulp-minify-html');
var sass         = require('gulp-sass');
var watch        = require('gulp-watch');
var minifycss    = require('gulp-minify-css');
var uglify       = require('gulp-uglify');
var streamify    = require('gulp-streamify');
var prod         = gutil.env.prod;

var onError = function(err) {
  console.log(err.message);
  this.emit('end');
};

// bundling js with browserify and watchify
var b = watchify(browserify('./src/js/main', {
  cache: {},
  packageCache: {},
  fullPaths: true,
  transform: [debowerify]
}));

gulp.task('js', bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle() {
  return b.bundle()
    .on('error', onError)
    .pipe(source('bundle.js'))
    .pipe(prod ? streamify(uglify()) : gutil.noop())
    .pipe(gulp.dest('./build/js'))
    .pipe(browserSync.stream());
}

// html
gulp.task('html', function() {
  return gulp.src('./src/templates/**/*')
    .pipe(processhtml())
    .pipe(gulp.dest('build'))
    .pipe(browserSync.stream());
});

// sass
gulp.task('sass', function() {
  return gulp.src('./src/scss/**/*.scss')
    .pipe(sass({
      includePaths: [
        'bower_components/bourbon/app/assets/stylesheets',
        'bower_components/foundation/scss']
    }))
    .on('error', onError)
    .pipe(prod ? minifycss() : gutil.noop())
    .pipe(gulp.dest('./build/stylesheets'))
    .pipe(browserSync.stream());
});

// images
gulp.task('images', function () {
  return gulp.src('./src/images/*.{png,gif,jpg,jpeg,svg}')
    .pipe(gulp.dest('./build/images'))
    .pipe(browserSync.stream());
});

// browser sync server for live reload
gulp.task('serve', function() {
  browserSync.init({
    browser: "Google Chrome Canary",
    server: {
      baseDir: './build'
    }
  });

  gulp.watch('./src/templates/**/*', ['html']);
  gulp.watch('./src/scss/**/*.scss', ['sass']);
});

// use gulp-sequence to finish building html, sass and js before first page load
gulp.task('default', gulpSequence(['html', 'sass', 'js', 'images'], 'serve'));