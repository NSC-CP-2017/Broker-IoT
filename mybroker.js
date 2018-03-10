var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mosca = require('mosca');
var waterfall = require('async-waterfall');
var nodemailer = require('nodemailer');

var Devices = require('./models/Devices');
var Projects = require('./models/Projects')
var Weathers = require('./models/Weathers');
var Datas = require('./models/Datas');
var Waters = require('./models/Waters');
var Roads = require('./models/Roads');
var Risks = require('./models/Risks');

mongoose.connect('mongodb://localhost/IntelligentThings');

var pubsub = {
    type: 'mongo',
    url: 'mongodb://localhost:27017/IntelligentThings',
    pubsubCollection: 'pubsub',
    mongo: {}
};

var smtpConfig = {
    "service": "gmail", // X-Chnage
    //"secure": true,   // X-Chnage
    auth: {
      user: 'moi.chula.platform@gmail.com', // X-Chnage
      pass: 'qwerty555' // X-Chnage
    }
};
var transporter = nodemailer.createTransport(smtpConfig);

// var SECURE_KEY =   "./tls-key.pem";
// var SECURE_CERT =  "./tls-cert.pem";

var moscaSettings = {
    interfaces: [
        { type: "mqtt", port: 1883 },
        // { type: "mqtts", port: 8082, credentials: {keyPath: '', certPath: ''} }
        { type: "http", port: 8081, bundle: true },
        // { type: "https", port: 8083, bundle: true, credentials: {keyPath: '', certPath: ''} }
    ],
    // secure: {
    //   certPath: //
    //   keyPath: //
    // },
    backend: pubsub,
};

var server = new mosca.Server(moscaSettings);

server.on('ready', setup);

//Accepts the connection if the username and password are valid
var authenticate = function (client, username, password, callback) {
    //console.log('authentication...');
    var parseID = (client.id.substring(0, 3) == 'mes') ? client.id.substring(3) : client.id;
    //console.log(parseID);
    Devices.findOne({ deviceID: parseID }, function (err, device) {
        //console.log(device);
        if (device) {
            if (device.deviceKey == username && device.deviceSecret == password) {
                client.deviceID = device.deviceID;
                client.settings = device.settings;
                //console.log("device: ", client.id, ' is authorized');
                client.type = 'device';
                device.online = true;
                device.save();
                if (client.id.substring(0, 3) !== 'mes') {
                    var message = {
                        topic: "/" + client.deviceID + "/log",
                        payload: "connected pass...                                                                                                                                                                                                                                                                                                                             ", // or a Buffer
                        qos: 0, // 0, 1, or 2
                        retain: false // or true
                    };
                    server.publish(message);
                }
                res = {};
                res.deviceOnline = true;
                var message = {
                    topic: "/" + client.deviceID + "/proj",
                    payload: JSON.stringify(res), // or a Buffer
                    qos: 0, // 0, 1, or 2
                    retain: false // or true
                };
                server.publish(message);
                device.save();
                callback(null, true);
            }
            else {
                if (client.id.substring(0, 3) !== 'mes') {
                    var message = {
                        topic: "/" + client.deviceID + "/log",
                        payload: "connected fail...", // or a Buffer
                        qos: 0, // 0, 1, or 2
                        retain: false // or true
                    };
                    server.publish(message);
                }
                callback(null, false);
            }
        }
        else {
            Projects.findOne({ projectKey: username.toString(), projectSecret: password.toString() }, function (err, project) {
                if (project) {
                    client.type = 'project';
                    //console.log("project: ", client.id, ' is authorized');
                    callback(null, true);
                }
                else {
                    //console.log("client: ", client.id, ' is not authorized');
                    callback(null, false);
                }
            });
        }
    });
};
// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function (client, topic, payload, callback) {
    var topic = topic.split('/');
    var authorized = ("" + topic[1] == "" + client.deviceID);
    //console.log('authorize published : ', authorized);
    callback(null, authorized);
};

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function (client, topic, callback) {
    //console.log('subscribe authentication...');
    var topic = topic.split('/');
    //console.log('authorize subscribe : ', client.id, topic[1] == client.deviceID || client.type == 'project');
    callback(null, "" + topic[1] == "" + client.deviceID || client.type == 'project');
};

server.on('clientConnected', function (client) {
    console.log('client connected :', client.id);
});

server.on('clientDisconnected', function (client) {
    if (client.type == 'device') {
        Devices.findOne({ deviceID: client.deviceID }, function (err, device) {
            if (device) {
                device.online = false;
                device.lastOnline = Date.now().toString();
                var message = {
                    topic: "/" + client.deviceID + "/log",
                    payload: 'Disconnected', // or a Buffer
                    qos: 0, // 0, 1, or 2
                    retain: false // or true
                };
                server.publish(message);
                res = {};
                res.deviceOnline = false;

                var message = {
                    topic: "/" + client.deviceID + "/proj",
                    payload: JSON.stringify(res), // or a Buffer
                    qos: 0, // 0, 1, or 2
                    retain: false // or true
                };
                server.publish(message)
                device.save();
            }
        });
    }
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
server.on('published', function (packet,client) {
    var topic = packet.topic.split('/');
    if (topic[2] == 'message') {
        try {
            var packet = JSON.parse(packet.payload.toString());
            //console.log(packet)
            var data = new Datas();
            data.deviceID = topic[1];
            data.features = [];
            var risks = client.risks;
            if (packet.value) data.value = packet.value;
            if (packet.pos) data.pos = packet.pos;
            data.timeStamp = (packet.timeStamp) ? packet.timeStamp : Date.now().toString();
            //console.log(data);
            Devices.findOne({ deviceID: data.deviceID }, function (err, device) {
                if (device) {
                    var settings = device.settings;
                    waterfall([function (callback) {
                        callback(null, data, settings);
                    }, function (data, settings, callback) {
                        //console.log("phase1")
                        if (settings.geoW.require == true) {
                            Waters.findOne({
                                pos: {
                                    $near: {
                                        $geometry: { type: "Point", coordinates: [packet.pos[0], packet.pos[1]] },
                                        $maxDistance: settings.geoW.rad,
                                        $minDistance: 0
                                    }
                                }
                            }, function (err, water) {
                                if (water) {
                                    data.features.push('water');
                                }
                                callback(null, data, settings)
                            });
                        }
                        else callback(null, data, settings);
                    }, function (data, settings, callback) {
                        if (settings.geoR.require == true) {
                            //console.log("phase2")
                            Roads.findOne({
                                pos: {
                                    $near: {
                                        $geometry: { type: "Point", coordinates: [packet.pos[0], packet.pos[1]] },
                                        $maxDistance: settings.geoW.rad,
                                        $minDistance: 5
                                    }
                                }
                            }, function (err, road) {
                                if (road) {
                                    data.features.push('road');
                                }
                                callback(null, data, settings);
                            });
                        }
                        else callback(null, data, settings);
                    }, function (data, settings, callback) {
                        console.log("phase3")
                        if (settings.wea.require == true) {
                            if ((typeof device.lastUpdateWeather == 'undefined') || (device.lastUpdateWeather + 300000 <= Date.now())) {
                                Weathers.find({
                                    pos: {
                                        $near: {
                                            $geometry: { type: "Point", coordinates: [packet.pos[0], packet.pos[1]] },
                                        }
                                    }
                                }).exec(function (err, weathers) {
                                    if (weathers) {
                                        if (weathers[0].dt < weathers[1].dt) {
                                            data.weather = weathers[0];
                                            data.forecastWeather = weathers[1];
                                            device.weather = weathers[0];
                                            device.forecastWeather = weathers[1];
                                            device.lastUpdateWeather = Date.now();
                                            device.save();
                                        }
                                        else {
                                            data.weather = weathers[1];
                                            data.forecastWeather = weathers[0];
                                            device.weather = weathers[1];
                                            device.forecastWeather = weathers[0];
                                            device.lastUpdateWeather = Date.now();
                                            device.save();
                                        }
                                        callback(null, data, settings);
                                    }
                                    else callback(null, data, settings);
                                });
                            }
                            else {
                                data.weather = device.weather;
                                data.forecastWeather = device.forecastWeather;
                                callback(null, data, settings);
                            }
                        }else{
                            callback(null, data, settings);
                        }
                    },function(data,settings,callback){
                        if (device.riskRule){
                            console.log("compute risk")
                            var score = calculateRisk(device.riskRule,data,settings);
                            data.risks = {};
                            data.risks['score'] = score;
                            data.risks['threshold'] = device.riskRule.threshold;
                        }
                        callback(null, data);
                    }], function (err, data) {
                        if (err) console.log("join data error");
                        else {
                            //console.log('pass');
                            data.save();
                            device.data = data;
                            if (device.lastData.length <= 1000){
                                device.lastData.push(data);
                            }
                            else{
                                device.lastData.shift();
                                device.lastData.push(data);
                            }
                            device.save();
                            var res = {};
                            res['data'] = data;
                            var message = {
                                topic: "/" + device.deviceID + "/proj",
                                payload: JSON.stringify(res), // or a Buffer
                                qos: 0, // 0, 1, or 2
                                retain: false // or true
                            };
                            server.publish(message);
                        };
                    });
                }
            });
        }
        catch (err) {
            console.log('err');
        }
    }
});

server.on('subscribed', function (topic, client) {
    console.log('subscribed : ', topic);
});

server.on('unsubscribed', function (topic, client) {
    console.log('unsubscribed : ', topic);
});

var calculateRisk = function(risk,data,settings){
    var score = 0;
    console.log('strart cal')
    if (settings.wea.require == true){
        score += risk.tempSet.coef*data.weather.temp;
        score += risk.humidSet.coef*data.weather.humidity;
        score += risk.windSet.coef*data.weather.wind;
        score += risk.rainSet.coef*data.weather.rain;
        console.log('strart cal1',score)
    }
    if (settings.geoW.require == true){
        data.features.forEach(function(feature){
            if (feature == 'water'){
                score += risk.waterSet.coef*(1)
            }
            console.log('strart cal2',score)
        });
    }
    if (settings.geoR.require == true){
        data.features.forEach(function(feature){
            if (feature == 'road'){
                score += risk.roadSet.coef*(1)
            }
            console.log('strart cal3',score)
        });
    }
    risk.valueSet.forEach(function(set){
        if (data.value[set.key]){
            score += set.coef*data.value[set.key];
            console.log('strart cal4',score)
        }
    });
    if (score > risk.threshold){
        console.log('test');
        var mailOptions = {
            to: risk.email,
            from: 'moi.chula.platform@demo.com',
            subject: risk.subject,
            text: risk.content
        };
        transporter.sendMail(mailOptions, function(err) {
            if (err) {
              console.log(err);
              console.log("email has not been send");
            } else {
              console.log("email has been send");
            }
        });
    }
    return score;
}
