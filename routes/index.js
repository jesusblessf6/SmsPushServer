
/*
 * GET home page.
 */

module.exports = function(app){

	app.get('/', function(req, res){
		res.render('index', { title: 'Express' });
	});

	app.get('/sendMsg', function(req, res){
		res.render('sendMsg', {title: '发送消息'});
	});

	app.get('/startScan', function(req, res){
		res.render('startScan', {title: "扫描发送消息"});
	});
};