
module.exports = function(io){

	var peers = new Array();
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
	  		if(data.phoneNum == "###########"){
	  			var tt = peers.filter(function(e){
	  				return e.phoneNum == "###########";
	  			});
	  			if(tt.length == 0){
	  				peers.push({'phoneNum': data.phoneNum, 'socketId':socket.id});
	  				socket.emit("scanReg", {result : "ok"});
	  			}
	  			else{
	  				socket.emit("scanReg", {result: "existed"});
	  			}
	  		}
	  		else{
	  			peers.push({'phoneNum': data.phoneNum, 'socketId':socket.id});
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
	  		var sql = require('../node_modules/msnodesql');
	  		var sql_settings = require('../sql_settings');

	  		sql.open(sql_settings.conn_str_from, function (err, conn) {
	  			console.log(sql_settings.conn_str_from + ":" + socket.id);
	  			console.log(peers);
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
	  			});
	  		});

	  		//end
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