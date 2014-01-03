/*
server connection info
*/

var driver = 'SQL Server Native Client 11.0';
var server = "localhost";

var user = "sa";
var pwd = "1234";
var databaseFrom = "MetalSmsSend";
var databaseTo = "ShtxSmsHistory";
var useTrustedConnection = false;
var conn_str_from = "Driver={" + driver + "};Server={" + server + "};" + (useTrustedConnection == useTrustedConnection 
	? "Trusted_Connection={Yes};" : "UID=" + user + ";PWD=" + pwd + ";") + "Database={" + databaseFrom + "};";
var conn_str_to = "Driver={" + driver + "};Server={" + server + "};" + (useTrustedConnection == useTrustedConnection 
	? "Trusted_Connection={Yes};" : "UID=" + user + ";PWD=" + pwd + ";") + "Database={" + databaseTo+ "};";

// The following need to be exported for building connection strings within a test...
exports.server = server;
exports.user = user;
exports.pwd = pwd;
// Driver name needs to be exported for building expected error messages...
exports.driver = driver;
// Here's a complete connection string which can be shared by multiple tests...
exports.conn_str_from = conn_str_from;
exports.conn_str_to = conn_str_to;

exports.getHistoryDBName = function(){
	var mom = require('moment');
	var dateStr = mom().format('YYYYM');
	return "h" + dateStr + "1";
};

exports.getHistoryDBNameWithDate = function(d){
	var mom = require('moment');
	var dateStr = mom(d).format('YYYYM');
	return "h" + dateStr + "1";
};