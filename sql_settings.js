/*
server connection info
*/

var driver = 'SQL Server Native Client 11.0';
var server = ".";
var user = 'sa';
var pwd = '1234';
var database = 'Test';
var useTrustedConnection = true;
var conn_str = "Driver={" + driver + "};Server={" + server + "};" + (useTrustedConnection == true 
	? "Trusted_Connection={Yes};" : "UID=" + user + ";PWD=" + pwd + ";") + "Database={" + database + "};";

// The following need to be exported for building connection strings within a test...
exports.server = server;
exports.user = user;
exports.pwd = pwd;
// Driver name needs to be exported for building expected error messages...
exports.driver = driver;
// Here's a complete connection string which can be shared by multiple tests...
exports.conn_str = conn_str;