/*
config of mongo db
*/

var db_path = "localhost:27017/tongxin_app";
exports.db_path = db_path;

var db = require('mongoskin').db(db_path, {w : 0}); 
exports.conn = db;