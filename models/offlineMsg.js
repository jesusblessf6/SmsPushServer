var conn = require('./db').conn;
var ObjectID = require('mongodb').ObjectID;

function OfflineMsg(offlineMsg){
	this.phoneNum = offlineMsg.phoneNum;
	this.content = offlineMsg.content;
	this.addDate = offlineMsg.addDate;
	this.timestamp = offlineMsg.timestamp;
}

module.exports = OfflineMsg;

OfflineMsg.prototype.save = function(callback){

	var offlineMsg = {
		phoneNum : this.phoneNum,
		content : this.content,
		addDate : this.addDate,
		timestamp : this.timestamp
	};

	conn.collection('offlineMsgs').insert(offlineMsg, function(err, m){
		if(err){
			//console.log(err);
			return callback(err);
		}

		if(m){
			console.log('added');
			callback(null, m);
		}
	});

	// mongodb.open(function(err, db){

	// 	if(err){
	// 		return callback(err);
	// 	}

	// 	db.collection('offlineMsgs', function(err, coll){
			
	// 		if(err){
	// 			mongodb.close();
	// 			return callback(err);
	// 		}

	// 		coll.insert(offlineMsg, {safe : true}, function(err, offlineMsg){
	// 			mongodb.close();
	// 			if(err){
	// 				return callback(err);
	// 			}

	// 			callback(null, offlineMsg[0]);
	// 		});
	// 	});

	// });
};

OfflineMsg.delete = function (id, callback){

	conn.collection('offlineMsgs').remove({_id: new ObjectId(id)}, {safe:true}, function(err, count){
		if(err){
			//console.log(err);
			return callback(err);
		}
		else{
			console.log("deleted: " + count);
			callback(null, count);
		}
	});
	// mongodb.open(function(err, db){

	// 	if(err){
	// 		return callback(err);
	// 	}

	// 	db.colloection('offlineMsgs', function(err, coll){

	// 		if(err){
	// 			mongodb.close();
	// 			return callback(err);
	// 		}

	// 		coll.remove({_id: new ObjectId(id)}, {w : 1}, function(err){

	// 			mongodb.close();
	// 			if(err){
	// 				return callback(err);
	// 			}

	// 			callback(null);
	// 		});

	// 	});

	// });

};

OfflineMsg.get = function(phoneNum, callback){

	conn.collection('offlineMsgs').find({phoneNum : phoneNum}, {sort: {timestamp : -1}}).toArray(function(err, results){
		if(err){
			return callback(err);
		}
		callback(null, results);
	});
	// mongodb.open(function(err, db){	

	// 	if(err){
	// 		return callback(err);
	// 	}

	// 	db.collection('offlineMsgs', function(err, coll){

	// 		if(err){
	// 			mongodb.close();
	// 			return callback(err);
	// 		}

	// 		coll.find({phoneNum : phoneNum}, {sort : {timestamp : -1}}).toArray(function(err, results){
				
	// 			mongodb.close();
	// 			if(err){
	// 				return callback(err);
	// 			}

	// 			callback(null, results);
	// 		});
	// 	});
	// });

};