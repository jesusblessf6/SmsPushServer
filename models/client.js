var conn = require('./db').conn;

function Client(client) {
  this.phoneNum = client.phoneNum;
  this.platform = client.platform;
  this.status = client.status;
  this.iosToken = client.iosToken;
  this.connectTime = client.connectTime;
};

module.exports = Client;

Client.prototype.save = function(callback){

	var client = {
		phoneNum : this.phoneNum,
		platform : this.platform,
		status : this.status,
		iosToken : this.iosToken,
		connectTime : this.connectTime
	};

	conn.collection('clients').insert(client, function(err, result){

		if(err){
			return callback(err);
		}
		else if(result){
			callback(null, result);
		}
	})
};

Client.get = function(phoneNum, callback){

	conn.collection('clients').find({phoneNum: phoneNum}, {sort: {'connectTime': -1}, limit : 1}).toArray(function(err, results){
		if(err){
			return callback(err);
		}
		callback(null, results[0]);
	});
};