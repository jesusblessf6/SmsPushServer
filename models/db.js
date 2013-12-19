// var settings = require('../mongo_settings'),
//     Db = require('mongodb').Db,
//     Connection = require('mongodb').Connection,
//     Server = require('mongodb').Server;
// module.exports = new Db(settings.db, new Server(settings.host, Connection.DEFAULT_PORT), {safe: true});

var db_path = "localhost:27017/tongxin_app";
exports.db_path = db_path;

var db = require('mongoskin').db(db_path); 
exports.conn = db;