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

function getCurrentTime(){
	var currentTime = new Date();
	var UTC_current_time = Date.UTC(currentTime.getFullYear(),
									currentTime.getMonth(),
									currentTime.getDay(),
									currentTime.getHours(),
									currentTime.getMinutes()); 
	return UTC_current_time;
}

function checkTimeStamp(){
	var Old_TimeStamp =  setTimeMarker();
	var new_TimeStamp = getCurrentTime();
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

			if(respArray.length > 0)
				console.log("Rua = " + res[0].name);

			resp(respArray);
		}); 
	});
}

//Adicionar maxrows 
//[WAI]
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