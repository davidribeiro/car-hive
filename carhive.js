/*//Lets require/import the HTTP module
var http = require('http');

//Lets define a port we want to listen to
const PORT=8080; 

//We need a function which handles requests and send response
function handleRequest(request, response){
	//Enviar json por ficheiro. (testar com stream?)
	var jsonFile = '{'
       +'"name" : "ponto",'
       +'"points"  : -111,-222,'
       +'"parkingspots" : 15/16'
       +'}';
	response.setHeader('Content-Type', 'application/json');
    response.send(jsonFile);
}



//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});*/

var express = require('express');
var app = express();
var http = require('http');

app.get('/', function (request, response) {
	console.log('New request from ' + request.ip);
	var jsonFile = '{'
       +'"name" : "ponto",'
       +'"points"  : "-111,-222",'
       +'"nspots" : "16",'
       +'"nvehicles"  : "15"'
       +'}';
	response.setHeader('Content-Type', 'application/json');
    response.send(jsonFile);
});

app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*/, function (request, response){
	console.log('New service request from ' + request.ip);
	
	/*
		var reqGeo = http.get(geonamesAPI, function(resp){
		var APIresp;

		resp.on('data', function(chunk){
			console.log('data received');
			APIresp += chunk;
		});

		resp.on('end', function(){
			console.log('js received');
			jsonFile = APIresp;
			reqGeo.end();
		});

		}).on("error", function(e){
			console.log("Got error: " + e.message);
		});
	*/

	requestGeoNames(request.originalUrl, function(json){
		console.log('json received');
		response.setHeader('Content-Type', 'application/json');
	    response.send(JSON.parse(json));
	});
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Car Hive Server://%s:%s', host, port);
});



function requestGeoNames(coords, endreq){
	var geonamesAPI = {
		host: 'api.geonames.org',
		path: '/findNearbyStreetsOSMJSON?'+coords.toString().substring(1)+'&username=demo',
	};

	var req = http.request(geonamesAPI, function(res){
		res.setEncoding('utf-8');
		console.log(geonamesAPI.host + geonamesAPI.path);
		var response = '';
		
		res.on('data', function(data){
			response += data;
		});

		res.on('end', function(){
			console.log(response);
			endreq(response);
		});
	});
	req.end();
}