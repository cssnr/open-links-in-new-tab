const gulp = require('gulp')

gulp.task('bootstrap', () => {
    return gulp
        .src([
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ])
        .pipe(gulp.dest('src/dist/bootstrap'))
})

// gulp.task('bootstrap-icons', () => {
//     gulp.src(['node_modules/bootstrap-icons/font/fonts/**']).pipe(
//         gulp.dest('src/dist/bootstrap/fonts')
//     )
//     return gulp
//         .src(['node_modules/bootstrap-icons/font/bootstrap-icons.min.css'])
//         .pipe(gulp.dest('src/dist/bootstrap'))
// })

gulp.task('jquery', () => {
    return gulp
        .src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('src/dist/jquery'))
})

gulp.task('default', gulp.parallel('bootstrap', 'jquery'))
