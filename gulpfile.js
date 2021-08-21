const { src, dest, series, watch } = require('gulp');
const concat = require('gulp-concat'); // объединение css файлов в один
const htmlmin = require('gulp-htmlmin'); // минифицирует html
const autoprefixes = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css'); // минифицирует css
const sass = require('gulp-sass')(require('sass'));
const svgSprite = require('gulp-svg-sprite') // создает sprite из svg
const image = require('gulp-image'); // сжимает картинки
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default; // переименовывает все перменные
const notify  = require('gulp-notify');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del')
const browserSync = require('browser-sync').create(); 

const clean = () => {
  return del(['dist'])
};

const resources = () => {
  return src('src/resources/**')
  .pipe(dest('dist'))
};

const styles = () => {
  return src('src/scss/**/*.scss') // берет на всех уровнях файлы с расширением .scss
    // .pipe(concat('main.css')) // объединяет все файлы в один main.css
    .pipe(sass().on("error", notify.onError()))
    .pipe(autoprefixes({
      cascade: false
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(dest('dist/styles')) // папка где убдет конечный файл main.css
    .pipe(browserSync.stream()) // следит за фалами данного таска
};

const stylesDev = () => {
	return src('src/scss/**/*.scss')
  // .pipe(concat('main.css')) // объединяет все файлы в один main.css
    .pipe(sass().on("error", notify.onError()))
    .pipe(autoprefixes({
      cascade: false,
		}))
		.pipe(dest('dist/styles'))
};

const htmlMiniFy = () => {
  return src('src/**/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
    }))
    .pipe(dest('dist'))
    .pipe(browserSync.stream()) // следит за фалами данного таска
};

const htmlMiniFyDev = () => {
  return src('src/**/*.html')
    .pipe(dest('dist'))
    .pipe(browserSync.stream()) // следит за фалами данного таска
};

const svgSprites = () => {
  return src('src/img/svg/**/*.svg')
  .pipe(svgSprite({
    mode: {
      stack: {
        sprite: '../sprite.svg'
      }
    }
  }))
  .pipe(dest('dist/images'))
};

const scripts = () => {
	src('src/js/vendor/**.js')
    .pipe(concat('vendor.js'))
    .pipe(dest('dist/js'))
  return src('src/js/main.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(concat('main.js'))
    .pipe(uglify({
      toplevel:  true
    }).on('error', notify.onError()))
    .pipe(sourcemaps.write())
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream())
};

const scriptsDev = () => {
	src('src/js/vendor/**.js')
    .pipe(concat('vendor.js'))
    .pipe(dest('dist/js'))
  return src('src/js/main.js')
    // .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(concat('main.js'))
    // .pipe(sourcemaps.write())
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream())
};

const images = () => {
  return src([
    'src/img/**/*.jpg',
    'src/img/**/*.png',
    'src/img/*.svg',
    'src/img/**/*.jpeg',
  ])
  .pipe(image())
  .pipe(dest('dist/images'))
};

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: 'dist' // папка за изменениями которого сделит browserSync
    }
  })
};

watch('src/**/*.html', htmlMiniFy);
watch('src/scss/**/*.scss', styles);
watch('src/img/svg/**/*.svg', svgSprites);
watch('src/js/**/*.js', scripts);
watch('src/resources/**', resources)

exports.dev = series(clean, resources, htmlMiniFyDev, scriptsDev, stylesDev, images, svgSprites, watchFiles);

exports.build = series(clean, resources, htmlMiniFy, scripts, styles, images, svgSprites, watchFiles);

exports.resources = resources