/*
server connection info
*/

var driver = 'SQL Server Native Client 11.0';
var server1 = "172.20.67.232";
var server2 = "172.20.67.233";

var user1 = "sa";
var pwd1 = "shtx@123";
var user2 = "sa";
var pwd2 = "sql@shtx";

var databaseFrom = "MetalSmsSend";
var databaseTo = "SmsHistory";
var useTrustedConnection = false;

var conn_str_from = "Driver={" + driver + "};Server={" + server1 + "};" + (useTrustedConnection == true 
	? "Trusted_Connection={Yes};" : "UID=" + user1 + ";PWD=" + pwd1 + ";") + "Database={" + databaseFrom + "};";
var conn_str_to = "Driver={" + driver + "};Server={" + server2 + "};" + (useTrustedConnection == true 
	? "Trusted_Connection={Yes};" : "UID=" + user2 + ";PWD=" + pwd2 + ";") + "Database={" + databaseTo+ "};";

// The following need to be exported for building connection strings within a test...
//exports.server1 = server1;
//exports.server2 = server2;
//exports.user = user;
//exports.pwd = pwd;
// Driver name needs to be exported for building expected error messages...
//exports.driver = driver;
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