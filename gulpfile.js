const gulp = require('gulp');
const zip = require('gulp-zip');
 
gulp.task('default', () =>
    gulp.src('src/*')
        .pipe(zip('AppTaskReload.zip'))
        .pipe(gulp.dest('dist'))
);