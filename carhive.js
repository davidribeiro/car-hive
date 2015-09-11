var express = require('express');
var app = express();
var http = require('http');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

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

var findUser = function(db, resp){
	var cursor = db.collection('hiveUsers').find();

	resp(cursor, db.collection('hiveUsers'));
}

var findStreet = function(db, resp){
	var cursor = db.collection('hiveStreets').find();

	resp(cursor, db.collection('hiveStreets'));
}

//Adicionar maxrows [TESTE: Working]
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
	var user = "testadmin";
	var flag = request.originalUrl.toString().match(/&flag=\d*/).toString().substring(6);

	if(flag == 0){
		//Localização carro estacionado
		//
		requestGeoNames(request.originalUrl ,function(json){

			connectDB(function(db){
				console.log('Novo acesso a base de dados de ' + user);

				findUser(db, function(cursor, collection){
					cursor.count(function(err, count){
						if(count < 1){
							//Inserir novo user [Test:TODO]
							//
							collection.insert({"name":""+user+"","carcoord":""+request.originalUrl.toString().match('lat=-?\d*.\d*').substring(4)+","+request.originalUrl.toString().match('lng=-?\d*.\d*').substring(4)+""}, function(err, record){
							if(err){
								console.log("Erro ao introduzir novo utilizador");
							}else{
								console.log("Novo utilizador "+record[0].name);
							}
							});
							//
							////
						}else{
							//Update utilizador existente [Test:TODO]
							//
							console.log("Update utilizador");
							collection.update({"name":""+user+""}, {"carcoord":""+request.originalUrl.toString().match('lat=-?\d*.\d*').substring(4)+","+request.originalUrl.toString().match('lng=-?\d*.\d*').substring(4)+""});
							//
							/////
						}
					});
				});

				
			});
			//
		});
		//
		////
	}
	else if(flag > 0){
		//Localização estacionamento [Test:TODO]
		//
		requestGeoNames(request.originalUrl, function(json){
			var street = JSON.parse(json).streetSegment[1].name;

			connectDB(function(db){
				console.log('Novo acesso a base de dados de ' + user);

				findStreet(db, function(cursor, collection){
					var max = JSON.parse(collection.find().sort({"IDmarker": -1}).limit(1)).IDmarker;
					console.log('Numero de ruas' + max);
					//TODO
					if(cursor.count() < 1){
						//Inserir nova rua
						var options = { "sort": {IDmarker:-1} };
						var max = subcollection.findOne({}, options) +1;					
						console.log(subcollection.findOne({}, options));

						var currentDate = new Date();
						var UTCdate = Date.UTC(currentDate.year, currentDate.month, currentDate.day, currentDate.hours, currentDate.minutes);

						collection.insert({"name":""+street+"","IDmarker":""+max+""}, function(err, record){
							if(err){
								console.log("Erro ao introduzir nova rua");
							}else{
								console.log("Nova rua "+record[0].name);
							}
						});

						console.log("nova rua, novo marcador");
						subcollection.insert({"IDmarker":""+max+"","nSpots":""+flag+"","IDuser":""+user+"","date":""+currentDate.toJSON()+""});

					}
					else{
						//Update marcadores rua
						console.log("update marcador");
						subcollection.insert({"IDmarker":""+collection.find({"name":""+street+""}).IDmarker+"","nSpots":""+flag+"","IDuser":""+user+"","date":""+UTCdate.toJSON()+""});
					}
				});
			});
		});
		//
		////
	}else{
		response.send('get não reconhecido');
	}
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Car Hive Server://%s:%s', host, port);
});


function connectDB(DBaction){
	var DBurl = 'mongodb://localhost:27017/carHive';
	MongoClient.connect(DBurl, function(err, db){
		if(err){
			console.log('Erro ao ligar a base de dados');
		}
		else{
			DBaction(db);
		}
	});
}

//Adicionar maxrows
function requestGeoNames(coords, endreq){
	var geonamesAPI = {
		host: 'api.geonames.org',
		path: '/findNearbyStreetsOSMJSON?'+coords.toString().substring(1)+'&username=carHive',
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