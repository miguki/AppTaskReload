const gulp = require('gulp');
const zip = require('gulp-zip');
 
gulp.task('default', () =>
    gulp.src('src/*')
        .pipe(gulp.dest('../../../Qlik/Sense/Extensions/AppTaskReload'))
        .pipe(zip('AppTaskReload.zip'))
        .pipe(gulp.dest('dist'))
);