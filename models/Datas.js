var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaData = new Schema({
    deviceID: String,
    pos: Array, // [lat,lon]
    value: Object,
    timeStamp: Number,
    weather: Object,
    rain: Number,
    temp: Number,
    wind: Number,
    city: String,
    features: Array
});
module.exports = mongoose.model('data', schemaData);
