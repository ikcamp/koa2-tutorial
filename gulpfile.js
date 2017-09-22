let gulp = require('gulp');
let browserSync = require('browser-sync').create();
const config = require('./config')
const isProd = process.env.NODE_ENV === 'production'
const port = isProd?config.prod.port:config.dev.port

gulp.task('default',function(){
    browserSync.init({
        proxy: `http://localhost:${port}`,
        port: port
    });
    gulp.watch("public/**/*.css").on('change',function(e){
      return gulp.src("public/**/*.css")
                 .pipe(gulp.dest("public"))
                 .pipe(browserSync.stream())
      
    })
    gulp.watch("public/**/*.js").on('change', browserSync.reload)
});