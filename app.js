var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var settings = require("./settings");
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var multer = require('multer');
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags:'a'});
var errorLog = fs.createWriteStream('error.log',{flags:'a'});

var app = express();



// view engine setup
app.set('port',process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev')); //  Express 自带的logger 中间件实现了终端日志的输出
app.use(logger({stream:accessLog})); // 把日志保存为日志文件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use(cookieParser());
app.use(session({
    secret:settings.cookieSecret,
    resave:false,   // 必填项
    saveUninitialized:true, // 必填项
    key:settings.db, // cookie name
    cookie:{maxAge:1000*60*60*24*30}, // 30 days
    store: new MongoStore({
        db: settings.db,
        host:settings.host,
        port:settings.port
    })
}));

app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
//  将错误信息保存到了根目录下的 error.log 文件夹
app.use(function (err,req,res,next) {
    var meta = '[' +new Date() +']' + req.url + '\n';
    errorLog.write(meta+err.stack + '\n');
    next();
});

// 使用express的第三方中间件 multer 实现文件上传功能。   代码必须放在routes(app);之前！！！才能被执行！
app.use(multer({
    dest: './public/images/',    // 上传的文件所在的目录
    rename: function (fieldname,filename) {
        // return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();    
        return filename;        // 保持原来的文件名
    }
}));

routes(app);



app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});




module.exports = app;
