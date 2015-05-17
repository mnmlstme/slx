var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var debug = require('gulp-debug');

gulp.task('specs', function () {
    return gulp.src('spec/test-index.js')
        .pipe(jasmine({
            includeStackTrace: true
        }));
});

gulp.task('test-bundle', function () {
    return browserify('./spec/test-index.js').bundle()
        .pipe(source('test-bundle.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('default', ['specs']);
