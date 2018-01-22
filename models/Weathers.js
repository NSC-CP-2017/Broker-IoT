
const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  city : String,
  city_id : String,
  lat : Number,
  lon : Number,
  dt : String,
  temp : Number,
  humidity : Number,
  weather : [],
  rain : Number,
  wind : Number
});
const Weather = mongoose.model('weathers', weatherSchema);

module.exports = Weather;
