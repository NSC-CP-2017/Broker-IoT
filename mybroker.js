var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Devices = require('./models/Devices');
var mosca = require('mosca');

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

// var updateDeviceData = function(deviceID,value,lat,lon){
//     Devices.findOne({deviceID:deviceID}).exec(function(err,device){
//         var date = new Date();
//         device['internalData'].push({'value': value,'date': date});
//         device['position'].push({'date': date,'lat': lat,'lon': lon});
//         device.save((err)=>{console.log(err);});
//     });
// };
// var setDeviceOnline = function(deviceID,isOnline){
//     Devices.findOne({deviceID:deviceID}).exec(function(err,device){
//         device['online'] = isOnline;
//         device['lastOnline'] = new Date();
//         device.save((err)=>{console.log(err);});
//     });
// }

//Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
    console.log('authentication...');
    var authorized = false;
    //console.log("deviceID:",username.toString().trim(),"  deviceKey:",password.toString().trim());
    Devices.findOne({deviceKey:username.toString(),deviceSecret:password.toString()},function(err,device){
        if (device !== null){
            authorized = true;
            client.deviceID = device.deviceID;
        }
        if (authorized) console.log(client.id,'is authorized');
        else console.log(client.id,'is not authorized');
        callback(null, authorized);
    });
};
// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
    var topic = topic.split('/');
    console.log('authorize published : ',payload.toString(),client.deviceID,topic[1] == client.deviceID);
    callback(null, topic[1] == client.deviceID);
};

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
    var topic = topic.split('/');
    console.log('authorize subscribed :',client.deviceID,topic[1] == client.deviceID);
    callback(null, topic[1] == client.deviceID);
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
server.on('published', function(packet, client) {
    var topic = packet.topic.split('/');
    try{
        var packet = JSON.parse(packet.payload.toString());
        console.log(packet);
        if (null == packet.value) throw new Error("Invalid value");
        else if (null == packet.timeStamp) throw new Error("Invalid timeStamp");
        else if (null == packet.pos) throw new Error("Invalid pos");
        else {
            console.log("add data : ",client.deviceID);
            Devices.findOne({deviceID : client.deviceID},function(err,device){
                if (device){
                    device.data.push(packet);
                    device.save(function(err){
                        if (err) throw new Error("Save section error");
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

