
const gulp = require('gulp');
webserver = require('gulp-webserver');
gutil = require('gulp-util');

dest = 'builds/d3/';
gulp.task('webserver', function() {
    gulp.src(dest)
        .pipe(webserver({
            livereload: true,
            port: 3000,
            open: true
        }));
});

gulp.task('default', gulp.series('webserver'));