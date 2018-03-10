var request = require('request');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaProjects = new Schema({
    UserID: Schema.ObjectId,
    name: String,
    projectID : Number,
    desc: String,
    appID: Number,
    appKey: String,
    appSecret: String,
    slots: Array
});
var schemaDevices = new Schema({
    name: String,
    online: Boolean,
    lastOnline: Date,
    environment: String,
    projectID: Schema.ObjectId,
    time: Date,
    value: String,
    lat: Number,
    lon: Number
});
var schemaReacts = new Schema({
    sms: Boolean,
    phone: String,
    threshold: Number,
    status: Boolean,
    email: String,
    subject: String,
    message: String
});
var pubsubsettings = {
    //using ascoltatore
    type: 'mongo',
    url: 'mongodb://localhost:27017/mqtt',
    pubsubCollection: 'ascoltatori',
    mongo: {}
  };

var Reacts = mongoose.model('reacts', schemaReacts);
var Devices = mongoose.model('devices', schemaDevices);
var Projects = mongoose.model('projects', schemaProjects);

mongoose.connect('mongodb://localhost/IntelligentThings');    // X-Chnage

var SECURE_KEY = __dirname + '/ssl.key';      // X-Chnage
var SECURE_CERT = __dirname + '/ssl.cert';    // X-Chnage

var mosca = require('mosca')
var settings = {
    id:"SIoTP",
    interfaces: [
        { type: "mqtt", port: 1883 },
      //  { type: "mqtts", port: 8082, credentials: { keyPath: SECURE_KEY, certPath: SECURE_CERT } },
        { type: "http", port: 8081, bundle: true }
       // { type: "https", port: 8083, bundle: true, credentials: { keyPath: SECURE_KEY, certPath: SECURE_CERT } }
    ],
    backend: {
        type: 'mongo',
        url: 'mongodb://localhost:27017/mqtt',
        pubsubCollection: 'pubsub',
        mongo: {}
    }
};


var nodemailer = require('nodemailer');
// create reusable transporter object using the default SMTP transport
var smtpConfig = {
    "host": "",       // X-Chnage
    "port": 465,      // X-Chnage
    "secure": true,   // X-Chnage
    auth: {
        user: '',     // X-Chnage
        pass: ''      // X-Chnage
    }
};
var transporter = nodemailer.createTransport(smtpConfig);

function operator(t,a,b){
    if(t=="gt"){
        return a > b;
    } else if(t=="gte"){
        return a >= b;
    } else if(t=="lt"){
        return a < b;
    } else if(t=="lte"){
        return a <= b;
    } else if(t=="eq"){
        return a == b;
    } else if(t=="ne"){
        return a != b;
    } else {
        return false;
    }
}

function sendMail(to,subject,message){
    if(typeof to == 'undefined' || to == '') return false;
    var mailOptions = {
        from: '"Smart ReActs" <react@iot-chula.com>',
        to: to+",wisit@gipsic.com",
        subject: subject,
        html: message
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            return false;
        }
        console.log('Message sent: ' + info.response);
        return true;
    });
}

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
    var authorized = false;
    if(!username || !password) return callback(null, false);
    //console.log("Authorizing "+username+" "+password);
     Reacts.find({UserID:result.UserID}).exec(function(err, reacts) {
            if(result !== null) {
                authorized = true;
                client.user = result.UserID.toString();
                client.key = username;
                client.path = result.appID;
                client.reacts = {};
                if(reacts.length) {
                    for(var k in reacts){
                        client.reacts[reacts[k]['appID']+"/"+reacts[k]['slot']] = {
                            message:reacts[k]['message'],
                            subject:reacts[k]['subject'],
                            email:reacts[k]['email'] && reacts[k]['status'],
                            sms:reacts[k]['sms'],
                            phone:reacts[k]['phone'],
                            threshold:reacts[k]['threshold'],
                            compare:reacts[k]['compare']
                        }
                    }
                }
                console.log(client.reacts);
            } else {
            }
            callback(null, authorized);
        });
    });
}

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
    callback(null, topic == 'latlon' || client.path+"" == ""+topic.split('/')[0]);
}

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
    callback(null, client.path+"" == ""+topic.split('/')[0]);
}

var updateDeviceData = function(appID, name, status, lat, lon, color){

    if(status == null) status = false;
    if(color == '') color = '#0099FF';
    if(isNaN(lat)) lat = null;
    if(isNaN(lon)) lon = null;
    Devices.findOne({appID:Number(appID),name:name}).exec(function(err, device) {
        if (err) throw err;
        if(device == null) {
            //Add new Devices
            if(color == null) color = '#0099FF';
            var device = new Devices({
                appID: Number(appID),
                name: name+"",
                online: status,
                lastOnline: new Date(),
                color: color,
                lat: lat+0,
                lon: lon+0
            });
            device.save(function(error){});
        } else {
            //Update Status
            if(status != null) device.online = status;
            if(color != null) device.color = color;
            if(lat != null) device.lat = lat;
            if(lon != null) device.lon = lon;
            device.lastOnline = new Date();
            device.save(function(error){});
        }
    });
}

//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
    server.authenticate = authenticate;
    server.authorizePublish = authorizePublish;
    server.authorizeSubscribe = authorizeSubscribe;
    console.log('Smart IoT Platform Service is up and running')
}

// fired whena  client is connected
server.on('clientConnected', function(client) {
    //console.log('client connected', client.id);
    updateDeviceData(Number(client.path), client.id, true, null, null, null);
});

// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
    //console.log('clientDisconnecting : ', client.id);
    updateDeviceData(Number(client.path), client.id, false, null, null, null);
});


// fired when a client is disconnected
server.on('clientDisconnected', function(client) {
    //console.log('clientDisconnected : ', client.id);
    updateDeviceData(Number(client.path), client.id, false, null, null, null);
});

// fired when a message is received
server.on('published', function(packet, client) {
    if(!client) return;

    //console.log(client.id + ' Published: ', packet.payload.toString());
    var topic = packet.topic.toLowerCase();
    if(topic == 'latlon'){
        var latlon = packet.payload.toString().split(",");
        var lat = Number(latlon[0].trim());
        var lon = Number(latlon[1].trim());
        updateDeviceData(Number(client.path), client.id, true, lat, lon, null);
    } else {
        var msec = new Date().getTime();
        var num = packet.payload.toString();
        var params = {
            TableName: "data."+client.user,
            Item: {
                "dataSlot": topic,
                "timeStamp": msec,
                "value":  num,
                "device":  client.id,
            }
        };

        docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add data", params.Item, ". Error JSON:", JSON.stringify(err, null, 2));
            } else {
                if(typeof client.reacts[topic] != 'undefined' && !isNaN(num)){
                    if(operator(client.reacts[topic]["compare"],Number(num),Number(client.reacts[topic]["threshold"]))){
                        if(client.reacts[topic]["sms"] == true) {
                            console.log("send SMS");
                            var input = {'method': 'send', 'username': 'gipsic', 'password': '498ef8', 'from': "NOTICE", 'to':client.reacts[topic]["phone"], 'message':client.reacts[topic]["message"] };
                            request.post({url:'http://www.thsms.com/api/rest', form: input}, function(error, response, body){
                                console.log("send sms");
                            });
                        } else {
                            sendMail(client.reacts[topic]["email"],client.reacts[topic]["subject"],client.reacts[topic]["message"]);
                        }
                        console.log("Matched "+topic+ " "+num+ " "+client.reacts[topic]["compare"]+ " "+client.reacts[topic]["threshold"]);
                    }
                }
            }
        });
    }


});

// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
    console.log('subscribed : ', topic);
});

// fired when a client subscribes to a topic
server.on('unsubscribed', function(topic, client) {
    console.log('unsubscribed : ', topic);
});
