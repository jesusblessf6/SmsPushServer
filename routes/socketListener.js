
module.exports = function(io){

	var peers = new Array();
	var mom = require('moment');
	var sentMsgs = new Array();
	var noneSentMsgs = new Array();
	var isScanning = false;
	var async = require('async');
	var sysSettings = require('../system_settings');
	var sql = require('../node_modules/msnodesql');
	var sql_settings = require('../sql_settings_mock');
	var Client = require('../models/client');
	var OfflineMsg = require('../models/OfflineMsg');

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
	  		if(data.token){
	  			console.log(data.token);
	  		}

	  		var client = new Client({
	  			phoneNum : data.phoneNum, 
	  			platform : data.platform,
	  			status : 1,
	  			iosToken: data.iosToken,
	  			connectTime : mom().format('X')
	  		});
	  		
	  		client.save(function(err, data){
	  			if(err){
	  				console.log(err);
	  				throw err;
	  			}
	  			else{
	  				console.log("add a new client: ");
	  				console.log(data);
	  			}
	  		});

	  		// Client.get(data.phoneNum, function(err, c){
	  		// 	if(err){console.log(err);}

	  		// 	else{console.log(c);}
	  		// });

	  		//add to peers; if existed, then replace it with new socket id
	  		var existed = false;
	  		var monitorClient = getMonitorClient(peers, io.sockets.sockets);

	  		for(var i = peers.length -1; i >= 0; i --){
	  			if(peers[i].phoneNum == data.phoneNum){
	  				existed = true; // existed phoneNum, only update the socket
	  				var sid = peers[i].socketId;
	  				if(io.sockets.sockets[sid]){
	  					io.sockets.sockets[sid].disconnect();
	  				}

	  				if(peers[i]){
	  					peers[i].socketId = socket.id;
	  					if(data.platform) peers[i].platform = data.platform;
	  					if(data.iosToken) peers[i].iosToken = data.iosToken;
	  				}

	  				if(monitorClient){
	  					monitorClient.emit("update clients", {action: 'modify', phoneNum: data.phoneNum, socketId: socket.id});
	  				}
	  			}
	  		}

	  		//new client/phoneNum, add new socket
	  		if(!existed){
	  			peers.push({'phoneNum': data.phoneNum, 'socketId':socket.id});
	  			if(monitorClient){
	  				monitorClient.emit("update clients", {action: 'new', phoneNum: data.phoneNum, socketId: socket.id});
	  			}
	  		}

	  		if(data.phoneNum == sysSettings.monitorToken ){
	  			//init the client list
	  			socket.emit("init clients", peers);

  				socket.emit("scanReg", {result: "ok"});
  			}
  			else{
  				console.log("hello herer");
  				OfflineMsg.get(data.phoneNum, function(err, results){
  					async.eachSeries(results, function(om, callback){

  						socket.emit("msg_in",  {'title' : "上海同鑫：", 'content' : om.content, 'timestamp' : om.addDate});
  						OfflineMsg.delete(om._id, function(err){console.log(err);});
  						callback();

  					});
  				});
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

	  		
	  		var monitorClient = getMonitorClient(peers, io.sockets.sockets);

	  		
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
												if(io.sockets.sockets[mo.socketId]){
													io.sockets.sockets[mo.socketId].emit("msg_in", 
														{'title' : "上海同鑫：",'content' : msg, 'timestamp' : timestamp});

													if(mo.platform == "iOS" && mo.iosToken){
														var sender = require('../apn/apnHandler');
														sender.sendMessage(msg, mo.iosToken);
													}

													if(monitorClient){
														monitorClient.emit("msg sent", {content: msg, timestamp: timestamp, phoneNum: mo.phoneNum, status: "已发送"});
													}
												}
												
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
											Client.get(mobile, function(err, result){

												if(err){
													console.log(err);
												}

												if(result && result.platform == "iOS" && result.iosToken){
													var sender = require('../apn/apnHandler');
													sender.sendMessage(msg, mo.iosToken);
													sentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});

													//it's a offline message, so put it into the mongo offline msgs
													var offline = new OfflineMsg({
														phoneNum : mobile,
														content : msg,
														addDate : sms_date,
														timestamp : mom().format('X')
													});

													
													offline.save(function(err, msgObj){
														
														if(err){
															console.log(err);
															
														}
													});

												}
												else{
													noneSentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
												}
											});
											//noneSentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
											if(monitorClient){
												monitorClient.emit("msg sent", {content: msg, timestamp: timestamp, phoneNum: mobile, status: "短信发送"});
											}
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
	  		var monitorClient = getMonitorClient(peers, io.sockets.sockets);

	  		//disconnect, remove the client
	  		for(var i = peers.length-1; i >= 0; i --){
	  			if(peers[i].socketId == socket.id){
	  				var pn = peers[i].phoneNum;
	  				peers.splice(i, 1);
	  				if(monitorClient){
	  					monitorClient.emit("update clients", {action: "disconnect", phoneNum: pn, socketId: socket.id });
	  				}
	  			}
	  		}
	  	});
	});			
};

function getMonitorClient(peers, sockets){
	var sysSettings = require('../system_settings');
	var filterdPeers = peers.filter(function(single, index, array){
		return single.phoneNum == sysSettings.monitorToken;
	});

	for(var i = 0; i < filterdPeers.length; i ++){
		if(sockets[filterdPeers[i].socketId]){
			return sockets[filterdPeers[i].socketId];
		}
	}

	return null;
}