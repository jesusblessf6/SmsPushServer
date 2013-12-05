
module.exports = function(io){

	io.sockets.on('connection', function (socket) {

		// when the client connect, send a confirmation to the client
		console.log("connected");
	  	socket.emit('connected', { hello: 'connected' });

	  	// socket.on('my other event', function (data) {
	   	//  	console.log(data);
	  	// });

		//when there is simple message come in
	  	socket.on('message', function(data){
	  		console.log("on message:" + data);
	  	});

	  	socket.on('username', function(data){
	  		console.log("on username:" + data);
	  		
	  	});

	  	socket.on('broadcast a message', function(data){
	  		console.log("broadcast message: " + data);
			io.sockets.emit('msg_in', data);
	  	});

	  	socket.on('disconnect', function(data){
	  		console.log("disconnect: " + data);
	  	});
	});			
};