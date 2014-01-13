
var join = require('path').join;
var apnagent  = require('apnagent');
var agent = new apnagent.Agent();

exports.init = function(app){
	

	agent 
    	.set('cert file', join(__dirname, '_cert/cert.pem'))
    	.set('key file', join(__dirname, '_cert/key.pem'));
    	//.enable('sandbox');

    agent
    	.set('expires', '1d')
    	.set('reconnect delay', '1s')
    	.set('cache ttl', '30m');

    agent.connect(function(err){
    	// gracefully handle auth problems
	  	if (err && err.name === 'GatewayAuthorizationError') {
	    	console.log('Authentication Error: %s', err.message);
	    	process.exit(1);
	  	} 

	  	// handle any other err (not likely)
	  	else if (err) {
	    	throw err;
	  	} 

	  	// it worked!
	  	var env = agent.enabled('sandbox')
	    	? 'sandbox'
	    	: 'production';

	  	console.log('apnagent [%s] gateway connected', env);
    });
};

exports.sendMessage = function(msg, token, badgeNum, callback){
	console.log("sending message: " + msg + " to token: " + token);
	agent.createMessage()
  		.device(token)
  		.alert(msg)
      .badge(badgeNum)
      .sound('sound.caf')
  		.send(function (err) {
      		// handle apnagent custom errors
      		if (err && err.toJSON) {
        		callback(err);
      		} 

      		// handle anything else (not likely)
      		else if (err) {
        		callback(err);
      		}

      		// it was a success
      		else {
            console.log("send message succeed");
        		callback(null);
      		}
    	});
};