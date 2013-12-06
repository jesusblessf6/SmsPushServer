
module.exports = function(io){

	var peers = new Array();
	var mom = require('moment');
	var sentMsgs = new Array();
	var noneSentMsgs = new Array();
	var isScanning = false;

	io.sockets.on('connection', function (socket) {

		/*
			connection process
		*/
		// when the client connect, send a confirmation to the client
		console.log("connected");
	  	socket.emit('connected', { hello: 'connected' });

	  	// store the client info data = {phoneNum : ...}
	  	socket.on('username', function(data){
	  		console.log("on username:" + data.phoneNum +":" +socket.id);

	  		//add to peers; if existed, then replace it with new socket id
	  		var tt = peers.filter(function(e){
  				return e.phoneNum == data.phoneNum;
  			});

  			if(tt.length > 0){
  				peers.map(function(single){
  					if(single.phoneNum == data.phoneNum){
  						if(io.sockets.sockets[single.socketId])
  						{
  							io.sockets.sockets[single.socketId].disconnect();
  						}
  						single.socketId = socket.id;
  					}
  				});
  			}else{
  				peers.push({'phoneNum': data.phoneNum, 'socketId':socket.id});
  			}

  			if(data.phoneNum == "###########"){
  				socket.emit("scanReg", {result: "ok"});
  			}
	  	});




	  	/*
			send / broadcast message manually;
	  	*/
		//when there is simple message come in
	  	socket.on('message', function(data){
	  		console.log("on message:" + data);
	  	});

	  	
	  	//broadcast a message to all client
	  	socket.on('broadcast a message', function(data){
	  		console.log("broadcast message: " + data);
			io.sockets.emit('msg_in', data);
	  	});



	  	/*
			Scan process
	  	*/
	  	//start scan
	  	socket.on('start scan', function(data){

	  		if(isScanning){
	  			return;
	  		}
	  		
	  		isScanning = true;

	  		var sql = require('../node_modules/msnodesql');
	  		var sql_settings = require('../sql_settings');

	  		sql.open(sql_settings.conn_str_from, function (err, conn) {
	  			//console.log(sql_settings.conn_str_from + ":" + socket.id);
	  			//console.log(peers);
	  			if (err) {
	  				console.log("Error opening the connection!" + err);
	  				return;
	  			}

	  			conn.queryRaw("SELECT * FROM [MetalSmsSend].[dbo].[app_sms]", function (err, results) {
	  				if(err){
	  					console.log(err);
	  					return;
	  				}
	  				console.log(results.rows.length);
	  				for(var i = 0; i < results.rows.length; i ++){
	  					var row = results.rows[i];
	  					var mobile = row[1];
	  					var msg = row[2];
	  					var msg_id = row[0];
	  					var timestamp = mom().format("YYYY-MM-DD HH:mm:ss");
	  					console.log(timestamp);
	  					var mid = row[4];
	  					var sms_date = mom(row[3]).format("YYYY-MM-DD HH:mm:ss");

	  					//find the socket by the mobile
	  					var connectedMobiles = peers.filter(function(peer){
	  						return peer.phoneNum == mobile;
	  					});

	  					// if find connected mobile, send it and put its id into "sentMsgIds";
	  					// if not, put its id into "noneSentMsgIds"
	  					if(connectedMobiles.length > 0){
	  						//send message
	  						for(var i = 0; i < connectedMobiles.length; i ++){
	  							var m = connectedMobiles[i];
	  							io.sockets.sockets[m.socketId].emit("msg_in", 
	  								{'title' : "上海同鑫：",'content' : msg, 'timestamp' : timestamp});
	  						}

	  						sentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
	  						//sentMsgs.push(row);
	  					}else{
	  						noneSentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
	  					}

	  				}
	  			});

				//console.log("send end, the sent msgs: " + sentMsgs[0]);
				//console.log("non-send message: " +noneSentMsgs[0] );

				//move non-send message to provide msg table
				//noneSentMsgs.forEach(function(element, index, array){
				for(var i = 0; i < noneSentMsgs.length; i ++){
					var element = noneSentMsgs[i];
					console.log(element);
					var queryStr = "insert into [MetalSmsSend].[dbo].[ProvideSms](Tel, Message, SendInt, Mid, AddDate) values('"+element.mobile+"', '"+element.msg+"', 0, '"+element.mid+"', '"+element.sms_date+"')";
					console.log(queryStr);
					conn.queryRaw(queryStr, 
						function(error, results){
							if(error){
		  					console.log(error);
		  					return;
		  				}
					});

					queryStr = "delete from [MetalSmsSend].[dbo].[app_sms] where id = " + element.id;
					console.log(queryStr);
					conn.queryRaw(queryStr, 
						function(error, results){
							if(error){
		  					console.log(error);
		  					return;
		  				}
		  			});
				}

				//clear
				noneSentMsgs = [];

				//delete sent msg from app_sms
				for(var i = 0; i < SentMsgs.length; i ++){
					var ee = SentMsgs[i];
					var queryStr = "delete from [MetalSmsSend].[dbo].[app_sms] where id = " + ee.id;
					console.log(queryStr);
					conn.queryRaw(queryStr, 
						function(error, results){
							if(error){
		  					console.log(error);
		  					return;
		  				}
		  			});
				}
	  		});

			//put the sent msg into the history table
			sql.open(sql_settings.conn_str_to, function (err, conn) {

				if (err) {
	  				console.log("Error opening the connection!" + err);
	  				return;
	  			}

	  			//add sent msg to history
	  			for(var i = 0; i < SentMsgs.length; i ++){
	  				var element = SentMsgs[i];
	  				var queryStr = "insert into [ShtxSmsHistory].[dbo].[h2012101](Tel, Message, SendInterFace, Mid, AddDate) values('"+element.mobile+"', '"+element.msg+"', 0, '"+element.mid+"', '"+element.sms_date+"')";
	  				console.log(queryStr);
					conn.queryRaw(queryStr, 
						function(error, results){
							if(error){
		  					console.log(error);
		  					return;
		  				}
		  			});
	  			}
			});

	  		//end
	  		isScanning = false;
	  		socket.emit("scanEnd", {result : "ok"});
	  	});



	  	/*
			on disconnected
	  	*/
	  	socket.on('disconnect', function(data){
	  		console.log("disconnect: " + data);
	  	});
	});			
};