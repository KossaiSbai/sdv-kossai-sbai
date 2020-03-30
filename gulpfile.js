
const gulp = require('gulp');
webserver = require('gulp-webserver');
gutil = require('gulp-util');

gulp.task('webserver', function() {
    gulp.src('.',{allowEmpty : true})
        .pipe(webserver({
            livereload: true,
            port: 3000,
            open: true
        }));
});

gulp.task('default', gulp.series('webserver'));