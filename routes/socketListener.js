
module.exports = function(io){

	var peers = new Array();
	var mom = require('moment-timezone');
	var sentMsgs = new Array();
	var noneSentMsgs = new Array();
	var isScanning = false;
	var async = require('async');
	var sysSettings = require('../system_settings');
	var sql = require('../node_modules/msnodesql');
	var sql_settings = require('../sql_settings_mock');
	var Client = require('../models/client');
	var OfflineMsg = require('../models/OfflineMsg');
	var SentMsg = require('../models/sentMsg');

	io.sockets.on('connection', function (socket) {

		/*
			connection process
		*/
		// when the client connect, send a confirmation to the client
		console.log("connected");
	  	socket.emit('connected', { hello: 'connected' });

	  	// store the client info data = {phoneNum : ...}
	  	socket.on('username', function(data){

	  		var existed = false;
	  		var monitorClient = getMonitorClient(peers, io.sockets.sockets);

	  		async.series([

	  			function(callback){

			  		var client = new Client({
			  			phoneNum : data.phoneNum, 
			  			platform : data.platform,
			  			status : 1,
			  			iosToken: data.iosToken,
			  			connectTime : mom().zone(0).format('X')
			  		});
			  		
			  		client.save(function(err, data){
			  			if(err){
			  				console.log(err);
			  				//throw err;
			  			}
			  			else{
			  				console.log("add a new client: ");
			  				console.log(data);
			  			}
			  		});	  		

			  		callback();
	  			},

	  			//add to peers; if existed, then replace it with new socket id
	  			function(callback){
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
			  		callback();
	  			},

	  			function(callback){
	  				//new client/phoneNum, add new socket
			  		if(!existed){
			  			peers.push({'phoneNum': data.phoneNum, 'socketId':socket.id, 'platform': data.platform, 'iosToken': data.iosToken});
			  			if(monitorClient){
			  				monitorClient.emit("update clients", {action: 'new', phoneNum: data.phoneNum, socketId: socket.id});
			  			}
			  		}

			  		callback();
	  			},

	  			function(callback){
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

		  			callback();
	  			}

	  		], function(err){
	  			console.log(err);
	  		});
	  		
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

	  		// if(isScanning){
	  		// 	socket.emit("scanEnd", {result : "notok"});
	  		// 	return;
	  		// }
	  		
	  		// isScanning = true;
	  		var monitorClient = getMonitorClient(peers, io.sockets.sockets);
	  		
	  		async.series([

  				function(callback){

  					sql.open(sql_settings.conn_str_from, function(err, conn){
			
						if (err) {
							console.log(err);
						}

						//execute the operations in series on the MetalSmsSend
						async.series([
							
							//get all the app msg
							function(callback){

								conn.queryRaw("SELECT * FROM [MetalSmsSend].[dbo].[app_sms]", function (err, results){

									if(err){
										console.log(err);
									}

									//console.log(results.rows.length);
									console.log("step1");

									// handle the app msg one by one
									async.eachSeries(results.rows, function(row, callback){

										console.log("here");
										var mobile = row[1];
										var tmpa = mobile.split("-");
										var realMobile = tmpa[0];
										console.log(mobile);
										var msg = row[2];
										var msg_id = row[0];
										var timestamp = mom().zone(0).format("YYYY-MM-DD HH:mm:ss");
										console.log(timestamp);
										var mid = row[4];
										console.log(row[3]);
										console.log(mom(row[3]).zone());
										var sms_date = mom(row[3]).zone(0).format("YYYY-MM-DD HH:mm:ss");
										var connectedMobiles;
										console.log("app_msm init");

										async.series([

											function(callback){
												//find the socket by the mobile
												connectedMobiles = peers.filter(function(peer){
													return peer.phoneNum == realMobile;
												});
												console.log("filter mobile");
												callback();
											},

											function(callback){
												// if find connected mobile, send it and put its id into "sentMsgIds";
												// if not, put its id into "noneSentMsgIds"
												console.log("start sending message++++++++++++");
												if(connectedMobiles.length > 0){
													async.eachSeries(connectedMobiles, function(mo, callback){
														if(io.sockets.sockets[mo.socketId]){
															io.sockets.sockets[mo.socketId].emit("msg_in", 
																{'title' : "上海同鑫：",'content' : msg, 'timestamp' : sms_date});

															if(mo.platform == "iOS" && mo.iosToken){
																console.log("it's a ios device: " + msg);
																console.log(mo.iosToken);
																var sender = require('../apn/apnHandler');
																sender.sendMessage(msg, mo.iosToken, function(err){
																	if(err){
																		console.log(err);
																	}
																});
															}

															if(monitorClient){
																monitorClient.emit("msg sent", {content: msg, timestamp: sms_date, phoneNum: mo.phoneNum, status: "已发送"});
															}
														}
														
														callback();
													}, function(err){
														if(err){
															console.log(err);
															return;
														}
														sentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date, 'realMobile' : realMobile});
														console.log(sentMsgs);
														callback();
													});
												}
												else{
													console.log("start sending offlinenenene message++++++++++++");
													async.series([

														function(callback){
															Client.get(realMobile, function(err, result){

																console.log('offline ios device');
																if(err){
																	console.log(err);
																}

																if(result && result.platform == "iOS" && result.iosToken){
																	
																	async.series([

																		function(callback){
																			var sender = require('../apn/apnHandler');
																			var badgeNum = 1;
																			console.log('badgeNum:' + badgeNum);
																			if(result.nonSentNum){
																				badgeNum = badgeNum + result.nonSentNum;
																			}
																			console.log('badgeNum:' + badgeNum);
																			sender.sendMessage(msg, result.iosToken, badgeNum, function(err){
																				if(err){
																					console.log(err);
																				}
																				Client.updateBadgeNumber(result._id, badgeNum, function(err, result){
																					if(err){
																						console.log(err);
																					}
																				})
																				callback();
																			});

																		},

																		function(callback){
																			console.log("push to sent msg");
																			sentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date, 'realMobile' : realMobile});
																			callback();
																		},

																		function(callback){
																			//it's a offline message, so put it into the mongo offline msgs
																			var offline = new OfflineMsg({
																				phoneNum : realMobile,
																				content : msg,
																				addDate : sms_date,
																				timestamp : mom().zone(0).format('X')
																			});

																			console.log("create offline msg: ");
																			console.log(offline);

																			offline.save(function(err, msgObj){
																				
																				if(err){
																					console.log(err);
																				}

																				callback();
																			});
																		},

																		function(callback){
																			//noneSentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
																			if(monitorClient){
																				monitorClient.emit("msg sent", {content: msg, timestamp: sms_date, phoneNum: mobile, status: "APNS推送"});
																			}
																			callback();
																		}
																	], function(err){
																		if(err){
																			console.log(err);
																		}
																		callback();
																	});
																}
																else{
																	noneSentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date, 'realMobile' : realMobile});
																	if(monitorClient){
																		monitorClient.emit("msg sent", {content: msg, timestamp: sms_date, phoneNum: mobile, status: "短信发送"});
																	}
																	callback();
																}

															});
														},

														function(callback){
															//noneSentMsgs.push({'mobile': mobile, 'msg': msg, 'id': msg_id, 'mid': mid, 'sms_date': sms_date});
															// if(monitorClient){
															// 	monitorClient.emit("msg sent", {content: msg, timestamp: sms_date, phoneNum: mobile, status: "短信发送"});
															// }
															callback();
														}

													], function(err){
														if(err){
															console.log(err);
														}
														callback();
													});
												}
											}

										], function(err){
											if(err){
												console.log(err);
											}
											callback();
										});

									}, function(err){
										if(err){
											console.log(err);
										}
										callback();
									});
									
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
						  								console.log(err);
						  							}
						  							callback();
												}
											);
			  								
			  							},

			  							//delete none-sent message from app_sms
			  							function(callback){
			  								queryStr = "delete from [MetalSmsSend].[dbo].[app_sms] where id = " + nsm.id;
											console.log(queryStr);
											conn.queryRaw(queryStr, 
												function(error, results){
													if(error){
				  										console.log(err);
				  									}
				  									callback();
				  								}
				  							);
			  							}

			  						], function(err){
			  							if(err){
			  								console.log(err);
			  							}
			  							callback();
			  						});

		  						}, function(err){
		  							if(err){
		  								console.log(err);
		  							}
		  							callback();
		  						});
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
						  					}
						  					callback();
						  				}
						  			);

									
								}, function(err){
									if(err){
										console.log(err);
									}
									callback();
								});
								
							}

						], function(err){
							if(err){
								console.log(err);
							}
							callback();
						});

					});

  				},

  				function(callback){

  					sql.open(sql_settings.conn_str_to, function (err, conn2) {
						console.log("step4");
						if (err) {
							console.log("Error opening the connection!" + err);
							//throw err;
						}
						console.log("here");
						console.log(sentMsgs);

						async.eachSeries(sentMsgs, function(sm, callback){
							console.log("here");

							var sentMsg = new SentMsg({
			  					phoneNum : sm.mobile,
			  					content : sm.msg,
			  					addDate : sm.sms_date,
			  					timestamp : mom().zone(0).format('X')
			  				});

			  				sentMsg.save(function(err, result){
			  					if(err){
			  						console.log(err);
			  					}
			  				});

							var queryStr = "insert into [SmsHistory].[dbo].[" + sql_settings.getHistoryDBNameWithDate(sm.sms_date) + "](Tel, Message, SendInterFace, Mid, AddDate, Flag, SendDate) values('"+sm.mobile+"', '"+sm.msg+"', 102, '"+sm.mid+"', '"+sm.sms_date+"', 'True', '"+sm.sms_date+"')";
							console.log(queryStr);
							conn2.queryRaw(queryStr, 
								function(error, results){
									if(error){
			  							console.log(error);
			  						}
			  						callback();
			  					}
			  				);

						}, function(err){
							if(err) {
								console.log(err);
								//throw err;
							}

							callback();
						});
						
					});

  				},


  				function(callback){
					console.log("step5");
					//isScanning = false;
					noneSentMsgs.length = 0;
					sentMsgs.length = 0;
					socket.emit("scanEnd", {result : "ok"});
					callback();
				}

  			], function(err){
  				if(err){console.log(err);}
  			});

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

	  	socket.on('manually disconnect', function(data){
	  		io.sockets.sockets[data.socketId].disconnect();
	  	});

	  	socket.on('disconnect me', function(data){
	  		socket.disconnect();
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