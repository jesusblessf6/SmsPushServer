
module.exports = function(io){

	var peers = new Array();
	var mom = require('moment');
	var sentMsgs = new Array();
	var noneSentMsgs = new Array();
	var isScanning = false;
	var async = require('async');

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
	  			socket.emit("scanEnd", {result : "notok"});
	  		}
	  		
	  		isScanning = true;

	  		var sql = require('../node_modules/msnodesql');
	  		var sql_settings = require('../sql_settings');

	  		
	  		async.series(
	  			[
	  				function(callback){
	  					sql.open(sql_settings.conn_str_from, function(err, conn){
				
						if (err) {
							console.log("Error opening the connection!" + err);
							return;
						}

						//execute the operations in series on the MetalSmsSend
						async.series([
							
							//get all the app msg
							function(callback){
								conn.queryRaw("SELECT * FROM [MetalSmsSend].[dbo].[app_sms]", function (err, results){

									if(err){
										console.log(err);
										return;
									}
									console.log(results.rows.length);
									console.log("step1");
									// handle the app msg one by one
									async.eachSeries(results.rows, function(row, callback){
										console.log("here");
										var mobile = row[1];
										console.log(mobile);
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
											async.eachSeries(connectedMobiles, function(mo, callback){
												io.sockets.sockets[mo.socketId].emit("msg_in", 
													{'title' : "上海同鑫：",'content' : msg, 'timestamp' : timestamp});
												callback();
											}, function(err){
												if(err){
													console.log(err);
													return;
												}
												sentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
												console.log(sentMsgs);
											});
										}
										else{
											noneSentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
										}

										callback();
									}, function(err){
										if(err){console.log(err);}
									});
									
									callback();
								});
							},

							//handle the none-sent message
							function(callback){
								console.log("step2");
								async.eachSeries(noneSentMsgs, function(nsm, callback){
						
			  						async.series([
			  							function(callback){
			  								console.log(nsm);
					  						var queryStr = "insert into [MetalSmsSend].[dbo].[ProvideSms](Tel, Message, SendInt, Mid, AddDate) values('"+nsm.mobile+"', '"+nsm.msg+"', 0, '"+nsm.mid+"', '"+nsm.sms_date+"')";
					  						console.log(queryStr);
					  						conn.queryRaw(queryStr, 
												function(error, results){
													if(error){
						  							console.log(error);
						  							return;
						  						}
											});
			  								callback();
			  							},

			  							//delete none-sent message from app_sms
			  							function(callback){
			  								queryStr = "delete from [MetalSmsSend].[dbo].[app_sms] where id = " + nsm.id;
											console.log(queryStr);
											conn.queryRaw(queryStr, 
												function(error, results){
													if(error){
				  									console.log(error);
				  									return;
				  								}
				  							});

			  								callback();
			  							}
			  						], function(err){
			  							if(err){
			  								console.log(err);
			  							}
			  						});

		  							callback();

		  						}, callback);

								callback();
							},

							//handle the sent message
							function(callback){
								console.log("step3");
								async.eachSeries(sentMsgs, function(sm, callback){
									var queryStr = "delete from [MetalSmsSend].[dbo].[app_sms] where id = " + sm.id;
									console.log(queryStr);
									
									conn.queryRaw(queryStr, 
										function(error, results){
											if(error){
						  					console.log(error);
						  					return;
						  				}
						  			});

									callback();
								}, callback);
								callback();
							}
							], function(err){});

							callback();
						});

	  				},

	  				function(callback){
	  					sql.open(sql_settings.conn_str_to, function (err, conn2) {
							console.log("step4");
							if (err) {
								console.log("Error opening the connection!" + err);
								return;
							}
							console.log("here");
							console.log(sentMsgs);

							async.eachSeries(sentMsgs, function(sm, callback){
								console.log("here");
								var queryStr = "insert into [ShtxSmsHistory].[dbo].[h2012101](Tel, Message, SendInterFace, Mid, AddDate) values('"+sm.mobile+"', '"+sm.msg+"', 0, '"+sm.mid+"', '"+sm.sms_date+"')";
								console.log(queryStr);
								conn2.queryRaw(queryStr, 
									function(error, results){
										if(error){
				  							console.log(error);
				  							return;
				  						}
				  				});
								callback();
							}, function(err){
								if(err) console.log(err);
								callback();
							});
							
						});

	  				},


	  				function(callback){
						console.log("step5");
						isScanning = false;
						noneSentMsgs.length = 0;
						sentMsgs.length = 0;
						socket.emit("scanEnd", {result : "ok"});
						callback();
					}
	  			], function(err){
	  				if(err){console.log(err);}
	  			}
	  		);
	  	});

	  	/*
			on disconnected
	  	*/
	  	socket.on('disconnect', function(data){
	  		console.log("disconnect: " + data);
	  	});
	});			
};