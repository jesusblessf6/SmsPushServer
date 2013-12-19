/*
server connection info
*/

var driver = 'SQL Server Native Client 11.0';
var server = "172.20.67.213";

var user = "shoucao";
var pwd = "shoucao";
var databaseFrom = "MetalSmsSend";
var databaseTo = "ShtxSmsHistory";
var useTrustedConnection = false;
var conn_str_from = "Driver={" + driver + "};Server={" + server + "};" + (useTrustedConnection == true 
	? "Trusted_Connection={Yes};" : "UID=" + user + ";PWD=" + pwd + ";") + "Database={" + databaseFrom + "};";
var conn_str_to = "Driver={" + driver + "};Server={" + server + "};" + (useTrustedConnection == true 
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