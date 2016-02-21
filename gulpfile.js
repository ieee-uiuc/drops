// Include gulp and plugins
var gulp = require('gulp');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');
var config = require('./config.js');

// Put in YouTube API key into search.js and minify it js
gulp.task('search.js', function() {
    return gulp.src(['public/search.js'])
        .pipe(replace('YT_KEY', config.youtube_key))
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min";
        }))
        .pipe(gulp.dest(config.static_root));
});


// Minify drops.js
gulp.task('drops.js', ['replace'], function() {
    return gulp.src('public/drops.js')
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min";
        }))
        .pipe(gulp.dest(config.static_root));
});

// Minify CSS
gulp.task('css', function() {
    return gulp.src('./public/*.css')
        .pipe(cssnano())
        .pipe(gulp.dest(config.static_root));
});

// Minify HTML
gulp.task('html', function() {
    return gulp.src(['./public/*.html', './public/slides/*.html'], {base: './public/'});
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(config.static_root))
});

// Default Task
gulp.task('default', ['search.js', 'drops.js', 'css', 'html']);
