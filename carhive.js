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
var mongodb = require('mongodb');

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

//Adicionar maxrows
app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*&maxRows=\d*/, function (request, response){
	console.log('New map request from ' + request.ip);

	requestGeoNames(request.originalUrl, function(json){
		console.log('json received');
		response.setHeader('Content-Type', 'application/json');
	    response.send(JSON.parse(json));
	});
});

//Get markers
app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*/, function (request, response){
	console.log('New get markers request from ' + request.ip);

	requestGeoNames(request.originalUrl ,function(json){
		console.log('json received');
		response.setHeader('Content-Type', 'application/json');
	    response.send(JSON.parse(json));
	});
});

//Post marker
app.post(/lat=-?\d*.\d*&lng=-?\d*.\d*&flag=\d*/, function (request, response){
	console.log('New post markers from ' + request.ip);

	var flag = request.originalUrl.toString().match('&flag=\d*').substring(6);

	if(flag == 0){
		//Localização carro estacionado
		requestGeoNames(request.originalUrl ,function(json){

			connectDB(user, function(db){
				console.log('Novo acesso a base de dados de ' + user);

				var collection = db.collection('carHiveUsers');
				var cursor = collection.find({"user":""+user+""});

				if(cursor.count() < 1){
					//Inserir novo utilizador
					collection.insert({"name":""+user+"","carcoord":""+request.originalUrl.toString().match('lat=-?\d*.\d*').substring(4)+","request.originalUrl.toString().match('lng=-?\d*.\d*').substring(4)+""}, function(err, record){
						if(err){
							console.log("Erro ao introduzir novo utilizador");
						}else{
							console.log("Novo utilizador "+record[0].name);
						}
					}););
				}
				else{
					//Update utilizador existente
					collection.update({"name":""+user+""}, {"carcoord":""+request.originalUrl.toString().match('lat=-?\d*.\d*').substring(4)+","request.originalUrl.toString().match('lng=-?\d*.\d*').substring(4)+""});
				}
			});
			//
		});
	}
	else if(flag > 0){
		//Localização estacionamento
		requestGeoNames(request.originalUrl, function(json){
			var street = json.streetSegment[1].name;

			connectDB(user, function(db){
				console.log('Novo acesso a base de dados de ' + user);

				var collection = db.collection('carHiveStreets');
				var subcollection = db.collection('carHiveMarkers');
				var cursor = collection.find({"name":""+street+""});

				var currentDate = new Date(year, month, day, hours, minutes, seconds, milliseconds);
				var UTCdate = Date.UTC(currentDate.year, currentDate.month, currentDate.day, currentDate.hours, currentDate.minutes);

				if(cursor.count() < 1){
					//Inserir nova rua
					var options = { "sort": {IDmarker:-1} };

					var max = subcollection.findOne({}, options) +1;					

					collection.insert({"name":""+street+"","IDmarker":""+max+""}, function(err, record){
						if(err){
							console.log("Erro ao introduzir nova rua");
						}else{
							console.log("Nova rua "+record[0].name);
						}
					});

					subcollection.insert({"IDmarker":""+max+"","nSpots":""+flag+"","IDuser":""+user+"","date":""+UTCdate+""});

				}
				else{
					//Update marcadores rua
					subcollection.insert({"IDmarker":""+collection.find({"name":""+street+""}).IDmarker+"","nSpots":""+flag+"","IDuser":""+user+"","date":""+UTCdate+""},{});
				}
			});
		});
	}else{
		response.send('get não reconhecido');
	}
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Car Hive Server://%s:%s', host, port);
});


function connectdb(DBaction){
	var DBurl = 'mongodb://localhost:27017/carHive';
	MongoClient.connect(DBurl, function(err, db){
		if(err){
			console.log('Erro ao ligar a base de dados');
		}
		else{
			DBaction(db);
			db.close();
		}
	});
}

//Adicionar maxrows
function requestGeoNames(coords, endreq){
	var geonamesAPI = {
		host: 'api.geonames.org',
		path: '/findNearbyStreetsOSMJSON?'+coords.toString().substring(1)'&username=carHive',
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