var conn = require('./db').conn;

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
			return callback(err);
		}

		if(m){
			console.log('added');
			callback(null, m);
		}
	});
};

OfflineMsg.delete = function (id, callback){

	conn.collection('offlineMsgs').remove({_id: id}, {safe:true}, function(err, count){

		if(err){
			return callback(err);
		}
		else{
			console.log("deleted: " + count);
			callback(null, count);
		}
	});

};

OfflineMsg.get = function(phoneNum, callback){

	conn.collection('offlineMsgs').find({phoneNum : phoneNum}, {sort: {timestamp : -1}}).toArray(function(err, results){
		if(err){
			return callback(err);
		}
		callback(null, results);
	});

};