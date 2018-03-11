var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaDevices = new Schema({
    name : String,
    owner : Schema.ObjectId,
    deviceID: String,
    deviceKey: String,
    deviceSecret: String,
    online: Boolean,
    lastOnline: Date,
    weather: Object,
    lastData: Array,
    riskRule: Object,
    forecastWeather: Object,
    features : Array,
    lastUpdateWeather : Date,
    lastUpdateFeatures : Date,
    data : Object,
    desc : String,
    settings : Object,
    state: {type: Number, default: 0}                 //0 == no risk, 1 == have risk
});
module.exports = mongoose.model('devices',schemaDevices);
