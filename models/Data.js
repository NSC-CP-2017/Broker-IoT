var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaData = new Schema({
    deviceID: Schema.ObjectId,
    lat: Number,
    lon: Number,
    wind: String,
    temperature: Number,
    roadType: String,
    weather: String
});
module.exports = mongoose.model('data', schemaData);
