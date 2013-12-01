
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.sendMsg = function(req, res){
	res.render('sendMsg', {title: '发送消息'});
};