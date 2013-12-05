
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
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

//test sql server connection
// var sql = require('./node_modules/msnodesql');
// var sql_settings = require('./sql_settings');
// console.log(sql_settings.conn_str);

// sql.open(sql_settings.conn_str, function (err, conn) {
//     if (err) {
//         console.log("Error opening the connection!" + err);
//         return;
//     }
//     conn.queryRaw("SELECT * FROM [Test].[dbo].[User]", function (err, results) {
//         if (err) {
//             console.log("Error running query!" + err + ";" + conn);
//             return;
//         }
//         for (var i = 0; i < results.rows.length; i++) {
//             console.log("0:" + results.rows[i][0] +":" + results.rows[i][1]);
//         }
//     });
// });