var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaDevices = new Schema({
    name : String,
    owner : Schema.ObjectId,
    deviceID: String,
    deviceKey: String,
    deviceSecret: String,
    online: Boolean,
    lastOnine: Date,
    joinData : Array,
    position: Array,
    data : Array
});
module.exports = mongoose.model('devices',schemaDevices);

