var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mosca = require('mosca');

var Devices = require('./models/Devices');
var Weathers = require('./models/Weathers');
var Datas = require('./models/Datas');

mongoose.connect('mongodb://localhost/IntelligentThings');

var pubsub = {
    type: 'mongo',
    url: 'mongodb://localhost:27017/mqtt',
    pubsubCollection: 'pubsub',
    mongo: {}
};

var moscaSettings = {
    interfaces:[
        { type: "mqtt", port: 1883 },
        { type: "http", port: 8081, bundle: true }
    ],
    backend: pubsub,
};

var server = new mosca.Server(moscaSettings);

server.on('ready', setup);

//Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
    console.log('authentication...');
    var authorized = false;
    //console.log("deviceID:",username.toString().trim(),"  deviceKey:",password.toString().trim());
    Devices.findOne({deviceKey:username.toString(),deviceSecret:password.toString()},function(err,device){
        if (device){
            authorized = true;
            client.deviceID = device.deviceID;
            console.log("device: ",client.id,' is authorized');
        }
        callback(null, authorized);
    });
};
// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
    var topic = topic.split('/');
    console.log('authorize published : ',client.deviceID,topic[1] == client.deviceID);
    callback(null, ""+topic[1] == ""+client.deviceID);
};

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
    console.log('subscribe authentication...');
    var topic = topic.split('/');
    console.log('authorize subscribe : ',client.deviceID,topic[1] == client.deviceID);
    callback(null, ""+topic[1] == ""+client.deviceID);
};

server.on('clientConnected', function(client) {
    console.log('client connected :',client.id);
    //setDeviceOnline(client.deviceID,true);
});

server.on('clientDisconnected', function(client) {
    console.log('clientDisconnected : ', client.id);
    //setDeviceOnline(client.deviceID,false);
});

// fired when the mqtt server is ready
function setup() {
    server.authenticate = authenticate;
    server.authorizePublish = authorizePublish;
    server.authorizeSubscribe = authorizeSubscribe;
    console.log('Server is up and running on Port:1883');
};

// fired when a message is received
server.on('published', function(packet) {
    var topic = packet.topic.split('/');
    try{
        var packet = JSON.parse(packet.payload.toString());
        var data = new Datas();
        data.deviceID = topic[1];
        if (packet.value) data.value = packet.value;
        if (packet.timeStamp) data.timeStamp = packet.timeStamp;
        else data.timeStamp = Date.now().toString()
        if (packet.pos){
            Weathers.find({},function(err,weathers){
                if (weathers){
                    var currentPos = packet.pos;
                    var storeWeather;
                    var closestPos = 999999999;
                    weathers.forEach(function(weather){
                        var path = (Math.abs(weather.lat-currentPos[0])+Math.abs(weather.lon-currentPos[1]));
                        if (closestPos > path){
                            storeWeather = weather;
                            closestPos = path
                        }
                    });
                    data.weather = {"main":storeWeather.weather[0].main,"desc":storeWeather.weather[0].description};
                    data.rain = storeWeather.rain;
                    data.temp = storeWeather.temp;
                    data.wind = storeWeather.wind;
                    data.humidity = storeWeather.humidity;
                    data.city = storeWeather.city;
                    data.pos = packet.pos;
                    data.save();
                    Devices.findOne({deviceID : topic[1]},function(err,device){
                        if (device){
                            device.data = data;
                            device.save();
                        }
                    });
                }
            });
        }

    }
    catch(err){
    }
});

server.on('subscribed', function(topic, client) {
    console.log('subscribed : ', topic);
});

server.on('unsubscribed', function(topic, client) {
    console.log('unsubscribed : ', topic);
});
