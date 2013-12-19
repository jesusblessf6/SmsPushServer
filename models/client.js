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

	// mongodb.open(function(err, db1){

	// 	if(err){
	// 		return callback(err);
	// 	}

	// 	db1.collection('clients', function(err, coll){
			
	// 		if(err){
	// 			mongodb.close();
	// 			return callback(err);
	// 		}

	// 		coll.insert(client, {safe : true}, function(err, client){
	// 			mongodb.close();
	// 			if(err){
	// 				return callback(err);
	// 			}

	// 			callback(null, client[0]);
	// 		});
	// 	});

	// });

	conn.collection('clients').insert(client, function(err, result){
		if(err){
			//console.log(err);
			return callback(err);
		}
		else if(result){
			//console.log("added");
			callback(null, result);
		}
	})
};

Client.get = function(phoneNum, callback){

	// mongodb.open(function(err, db2){

	// 	if(err){
	// 		return callback(err);
	// 	}

	// 	db2.collection('client', function(err, coll){

	// 		if(err){
	// 			mongodb.close();
	// 			return callback(err);
	// 		}

	// 		coll.find({phoneNum : phoneNum}, {sort : {connectTime : -1}, limit: 1} ,function(err, results){

	// 			mongodb.close();

	// 			if(err){
	// 				mongodb.close();
	// 				return callback(err);
	// 			}

	// 			//results.toArray(callback(null, data));
	// 			callback(null, results[0]);

	// 		});
	// 	});

	// });
	conn.collection('clients').find({phoneNum: phoneNum}, {sort: {'connectTime': -1}, limit : 1}).toArray(function(err, results){
		if(err){
			return callback(err);
		}
		callback(null, results);
	});
};