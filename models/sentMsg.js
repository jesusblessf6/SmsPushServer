var conn = require('./db').conn;

function SentMsg(sentMsg){
	this.phoneNum = sentMsg.phoneNum;
	this.content = sentMsg.content;
	this.addDate = sentMsg.addDate;
	this.timestamp = sentMsg.timestamp;
};

module.exports = SentMsg;

SentMsg.prototype.save = function(callback){

	var sentMsg = {
		phoneNum : this.phoneNum,
		content : this.content,
		addDate : this.addDate,
		timestamp : this.timestamp
	};

	conn.collection('sendMsgs').insert(offlineMsg, function(err, m){

		if(err){
			return callback(err);
		}

		if(m){
			console.log('added sent msg to mongo');
			callback(null, m);
		}
	});
};