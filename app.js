
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var sys_setting = require('./system_settings');

var app = express();

// all environments
app.set('port', sys_setting.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//route the pages
var index = require('./routes/index');
index(app);

//init the web socket
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
  	console.log('Express server listening on port ' + app.get('port'));
});

//handle the socket event
var listener = require('./routes/socketListener');
listener(io);

var apnHandler = require('./apn/apnHandler');
apnHandler.init(app);