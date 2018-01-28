var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaWeather = new Schema({
  city : String,
  city_id : String,
  pos : { type: { type: String, default:'Point' }, coordinates: [Number] },
  dt : String,
  temp : Number,
  humidity : Number,
  weather : [],
  rain : Number,
  wind : Number
});
module.exports = mongoose.model('weather', schemaWeather);
