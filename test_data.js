var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Projects = require('./models/Projects');
var Devices = require('./models/Devices');

mongoose.connect('mongodb://localhost/IntelligentThings');

var device1 = new Devices({
    name : "thermometer",
    deviceID: "id1000",
    deviceKey: "secret",
    online: false,
    lastOnine: new Date(),
    authorized: true,
    joinData : [],
    position: [],
    internalData : [],
});

var device2 = new Devices({
    name : "Accelerometer",
    deviceID: "id2000",
    deviceKey: "secret",
    online: false,
    lastOnine: new Date(),
    authorized: true,
    joinData : [],
    position: [],
    internalData : []
});

var device3 = new Devices({
    name : "Gyroscope",
    deviceID: "id3000",
    deviceKey: "secret",
    online: false,
    lastOnine: new Date(),
    authorized: true,
    joinData : [],
    position: [],
    internalData : []
});
device1.save((err,device)=>{
    if (err) console.log(err);
});
device2.save((err,device)=>{
    if (err) console.log(err);
});
device3.save((err,device)=>{
    if (err) console.log(err);
});