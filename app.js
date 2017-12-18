//import modules
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');//Handle single body using req.body
//const busboyBodyParser = require('busboy-body-parser');//Handle multiple files using req.files
var hbs = require('express-handlebars');
var expressValidator = require('express-validator');//validate the input dom
var expressSession = require('express-session');
//setup a path
var index = require('./routes/index');
var app = express();
var $ = require('jquery');
var d3 = require('d3');

//Setup express
//1- view engine setup
app.engine('hbs', hbs({extname:'hbs', defaultLayout:'layout', layoutsDir:__dirname + '/views/layouts/', helpers: require('./public/js/helpers.js')}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// 2- Add middleware
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(busboyBodyParser({ limit: '5mb' }));
app.use(expressValidator());//validator function has to be after bodyparser function
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(expressSession({secret: 'max', saveUninitalized: false, resave: false}));
//3- use the setup path
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});











module.exports = app;
