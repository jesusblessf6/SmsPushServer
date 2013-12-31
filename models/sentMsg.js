var conn = require('./db').conn;

function SentMsg(sentMsg){
	this.phoneNum = sentMsg.phoneNum;
	this.content = sentMsg.content;
	this.addDate = sentMsg.addDate;
	this.timestamp = sentMsg.timestamp;
	this.realMobile = sentMsg.realMobile;
};

module.exports = SentMsg;

SentMsg.prototype.save = function(callback){

	var sentMsg = {
		phoneNum : this.phoneNum,
		content : this.content,
		addDate : this.addDate,
		timestamp : this.timestamp,
		realMobile : this.realMobile
	};

	conn.collection('sentMsgs').insert(sentMsg, function(err, m){

		if(err){
			return callback(err);
		}

		if(m){
			console.log('added sent msg to mongo');
			callback(null, m);
		}
	});
};