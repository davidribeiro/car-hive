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

//Time Functions
//

function setTimeMarker () {
	var marker_date = new Date(); 
	var UTC_Date_Marker =Date.UTC(	marker_date.getFullYear(),
									marker_date.getMonth(),
									marker_date.getDay(),
									marker_date.getHours(),
									marker_date.getMinutes()); //Return the number of milliseconds between a specified date and midnight January 1 1970
	return UTC_Date_Marker;
}

function checkTimeStamp(oldTime){
	var Old_TimeStamp =  oldTime;
	var new_TimeStamp = setTimeMarker();
	var flag;
	if ((new_TimeStamp-Old_TimeStamp)>600000){ // 600 000 = 10min
		flag=1;
	}
	else{
		flag=0;
	}
	return flag;
}

//
//////



countStreetMarkers = function(street, db){
	findStreet(street, db, function(streetArray){
		var cursor = db.collection('hiveMarkers');
		var countSpots = 0;

		if(streetArray.length > 0){
			cursor.count({IDmarker:streetArray[0].IDmarker}, function(err, count){
			cursor.find({IDmarker:streetArray[0].IDmarker}).toArray(function(err, res){
				for(var c = 0; c < count; c++){
					var checkTime = checkTimeStamp(res[c].date);

					if(checkTime == 0){
						countSpots += res[c].nSpots;
					}
				}
				return countSpots;
			});
			});
		}else
		{
			console.log('Erro ao procurar por street');
		}
	});
}

//[WAI]
var createNewUser = function(user, coords, db){
	var cursor = db.collection('hiveUsers');

	cursor.insert({name:user,carcoord:coords}, function(err, res){
		if(err){
			console.log('Erro ao criar novo utilizador');
		}
		else{
			console.log('Criado novo utilizador' + user);
		}
	});
}

//[WAI]
var updateUser = function(user, coords, db){
	var cursor = db.collection('hiveUsers');

	cursor.update({name:user},{name:user,carcoord:coords}, function(err, res){
		if(err){
			console.log('Erro ao actualizar utilizador');
		}
		else{
			console.log('Actualizado utilizador' + user);
		}
	});
}

//[WAI]
var findUser = function(user, db, resp){
	var respArray = [];
	var cursor = db.collection('hiveUsers');

	cursor.count({name:user}, function(err, count){
		cursor.find({name:user}).toArray(function(err, res){
			for(var c = 0; c < count; c++){
				respArray.push(res[c]);
			}

			resp(respArray);
		});
	});

}

//[WAI]
var findLastMarker = function(db, resp){
	var restArray= [];
	var cursor = db.collection('hiveMarkers');

	var options = {
		"sort": [['IDmarker','desc']]
	}

	cursor.findOne({}, options, function(err, res){
		if(err){
			console.log('Erro '+ err);
		}else{
			resp(Number(res.IDmarker + 1), db);
		}
	});
}

//[WAI]
var insertStreetMarkers = function(ID, flag, user, db){
	var cursor = db.collection('hiveMarkers');

    var dateMarker = setTimeMarker();

	cursor.insert({IDmarker:Number(ID),nSpots:Number(flag),IDuser:user,date:dateMarker}, function(err, res){
		if(err){
			console.log('Erro ao actualizar markers');
		}
		else{
			console.log('Marker adicionado com id ' + ID);
		}
	});
}

//[WAI]
var insertNewStreet = function(street, IDmarker ,db){
	var cursor = db.collection('hiveStreets');

	cursor.insert({name:street,IDmarker:IDmarker}, function(err, res){
		if(err){
			console.log('Erro ao adicionar rua');
		}
		else{
			console.log('Nova rua adicionada' + res);
		}
	});

}

//[WAI]
var findStreet = function(street, db, resp){
	var respArray = [];
	var cursor = db.collection('hiveStreets');

	cursor.count({name:street}, function(err, count){
		cursor.find({name:street}).toArray(function(err, res){
			for(var c = 0; c < count; c++){
				respArray.push(res[c]);
			}

			resp(respArray);
		}); 
	});
}

function findStreetByIDMarker(marker, db){
	var cursor = db.collection('hiveStreets');

	cursor.find({IDmarker:marker}).toArray(function(err, res){
		return res;
	}); 
}

getMarkersWithID = function(db, id, callback){
	var cursor = db.collection('hiveMarkers');

	cursor.count({IDuser:id}, function(err, count){
		if(count == 0)
			return [];

		cursor.find({IDuser:id}).toArray(function(err, res){
			var Arr = [];

			for(var c = 0; c < count; c++){
				Arr.push(res[c].IDmarker);
			}

			callback(Arr);
		}); 
	});
}


function findFriends(user, db, resp){
	var respArray = [];
	var cursor = db.collection('hiveUsers');

	cursor.findOne({name:user}, function(err, friendID){

		var cursor = db.collection('hiveFriends');

		cursor.count({user:friendID.name}, function(err, count){
			cursor.find({user:friendID.name}).toArray(function(err, res){
				for(var c = 0; c < count; c++){
					respArray.push(res[c]);
				}

				resp(respArray);
			});
		});
	});
}

//Friends
app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*&user=[A-Za-z0-9]*&friends/, function(request, response){
	console.log('New friends request ' + request.ip);

	var user = request.originalUrl.toString().match(/&user=[A-Za-z0-9]*/).toString().substring(6);
	var jsonData = [];

	connectDB(function(db){
		findFriends(user, db, function(friends){
			var jsonData = [];
			
			for(var c = 0; c < friends.length; c++){
				var cursor = db.collection('hiveUsers');

				cursor.find({name:friends[c].friend}).toArray(function(err, res){
					response.setHeader('Content-Type', 'application/json');
					response.send(JSON.stringify({"markers": {coords:res[0].carcoord,nSpots:1}}));
				});
			}
		});
	});

});

//Get markers
app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*&markers/, function (request, response){
	console.log('New get markers request from ' + request.ip);

	var coordStreet = request.originalUrl.toString().match(/lat=-?\d*.\d*/).toString().substring(4)+","+request.originalUrl.toString().match(/lng=-?\d*.\d*/).toString().substring(4);

	requestGeoNames(request.originalUrl ,function(json){

		var streets = JSON.parse(json).streetSegment;
		
			connectDB(function(db){	
				var jsonData = [];

				var streetArray = [];

				for(var s = 0; s < streets.length; s++){

					var spotsCount = Number(countStreetMarkers(streets[s].name, db));

					console.log('street ' + s + " - "+ streets[s].name + " nspots = " + spotsCount);

					jsonData.push({coords:streets[s].line.toString().split(',')[0],nSpots:spotsCount});
				}

				//Harcoded coords carro
				var cursor = db.collection('hiveUsers');
				

				console.log(jsonData);
				response.setHeader('Content-Type', 'application/json');
				response.send(JSON.stringify({"markers": jsonData}));

			});

	});
});

//Linhas
//[WAI]
app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*&maxRows=\d*/, function (request, response){
	console.log('New map request from ' + request.ip);

	requestGeoNames(request.originalUrl, function(json){
		console.log('json received');
		response.setHeader('Content-Type', 'application/json');
	    response.send(JSON.parse(json));
	});
});

//Dados marker carro
app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*&user=[A-Za-z0-9]*/, function(request, response){

	var user = request.originalUrl.toString().match(/&user=[A-Za-z0-9]*/).toString().substring(6);

	connectDB(function(db){
		findUser(user, db, function(userArray){
			var jsonData = [];

			jsonData.push({carcoords:userArray[0].carcoord});
			
			response.setHeader('Content-Type', 'application/json');
			response.send(JSON.stringify({"car":jsonData}));
		});
	});
});

//Post marker
app.get(/lat=-?\d*.\d*&lng=-?\d*.\d*&flag=\d*&user=[A-Za-z0-9]*/, function (request, response){
	console.log('New post markers from ' + request.ip);
	var user = request.originalUrl.toString().match(/&user=[A-Za-z0-9]*/).toString().substring(6);
	var flag = request.originalUrl.toString().match(/&flag=\d*/).toString().substring(6);
	var coords = request.originalUrl.toString().match(/lat=-?\d*.\d*/).toString().substring(4)+","+request.originalUrl.toString().match(/lng=-?\d*.\d*/).toString().substring(4);

	console.log('Coordenadas ' + coords);

	if(flag == 0){
		//Localização carro estacionado
		//
		connectDB(function(db){
			console.log('Novo acesso a base de dados de ' + user);

			findUser(user, db, function(userArray){
				if(userArray.length < 1 ){
					//Inserir novo utilizador se não existir
					//
					createNewUser(user, coords, db);
					//
					//////
				}else{
					console.log('UserArray ' + userArray[0].name);
					//Actualizar info se existir
					//
					updateUser(userArray[0].name, coords, db);
					//
					//////
				}
			});
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

				findStreet(street, db, function(streetArray){
					if(streetArray.length < 1){
						console.log("Nova rua " + street );
						//Encontrar ID do ultimo marcador e adicionar nova rua
						//
						findLastMarker(db, function(IDmarker, db){
							insertNewStreet(street, IDmarker ,db);
							insertStreetMarkers(IDmarker, flag, user, db);
						});
						//
						//////
					}else{
						console.log("Novos markers na rua " + streetArray[0].name + " IDmarkers = " + Number(streetArray[0].IDmarker));
						//Update rua existente
						//
						insertStreetMarkers(streetArray[0].IDmarker, flag, user, db);
						//
						//////
					}
				});
				
			});
		});
		//
		////
	}else{
		response.send('get não reconhecido');
	}

	response.send('Done');
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