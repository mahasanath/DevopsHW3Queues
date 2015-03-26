var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	console.log(req.method, req.url);
	
	client.lpush("history",req.url); //push URLs to history
	client.ltrim("history",0,4);	//use ltrim to shorten history
	

	next(); // Passing the request to the next handler in the stack.
});

app.get('/', function(req, res) {
	client.lpush("history",req.url);
	res.send('Server now in port 3001')
})

app.get('/get',function(req,res){
	client.lpush("history",req.url);
	client.get("key",function(err,value){
		res.send(value)
	})

})

app.get('/set',function(req,res){
	client.lpush("history",req.url);
	client.set("key", "this message will destruct in 10 sec");
	client.expire("key",10);
	res.send('Success!! - Value added for the key in redis on port 3001');
});


app.get('/recent',function(req,res){
	client.lrange("history",0,-1,function(err,value){
	console.log("Recently Visited sites :");
	value.forEach(function(value){
		console.log(value)
	})
	res.send(value);
	
	})
});


app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files
   console.log(req.files.image.path)
   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		//console.log(img);
			client.lpush('images',img);
				
		}); 
	}

    res.status(204).end()
 }]);

app.get('/meow', function(req, res) {

		client.lpop('images',function(err,imagedata){

			if (err) res.send('')
			res.writeHead(200, {'content-type':'text/html'});
			res.write("<h1>\n<img src='data:hairypotter.jpg;base64,"+imagedata+"'/>");
			res.end();

		})
})

// HTTP SERVER
var server = app.listen(3001, function () {

	  var host = server.address().address
	  var port = server.address().port
	  client.lpush("vistedSites",3001)
   	console.log('Example app listening at http://%s:%s', host, port)
})


/*var server = app.listen(3002, function () {

	  var host = server.address().address
	  var port = server.address().port
	  client.lpush("vistedSites",3002)
   	  console.log('Example app listening at http://%s:%s', host, port)
})*/