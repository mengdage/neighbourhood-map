// include plugins
var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    browserSync = require('browser-sync').create();

// Paths to various files
var paths = {
  scripts: ['js/**/*.js', 'gulpfile.js'],
  styles: ['css/*.css'],
  content: ['index.html']
};

// lint js files
gulp.task('lint:js', function(){
  return gulp.src(paths.scripts)
              .pipe(jshint())
              .pipe(jshint.reporter());
});

// watches to files and execute required scripts and reload browserSync
gulp.task('scripts-watch', ['lint:js'], function(done){
    browserSync.reload();
    done();
});
gulp.task('styles-watch', browserSync.reload);
gulp.task('content-watch', browserSync.reload);


gulp.task('browse', function() {
  browserSync.init({
    server: {
      baseDir: './'
    }
  });

  // wathc files and execute certain scripts
  gulp.watch(paths.scripts, ['scripts-watch']);
  gulp.watch(paths.styles, browserSync.reload);
  gulp.watch(paths.content, browserSync.reload);
});

// Default task
gulp.task('default', ['lint:js', 'browse']);
