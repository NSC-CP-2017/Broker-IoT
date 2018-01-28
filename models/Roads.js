var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaRoad = new Schema ({
    pos : { type: { type: String, default:'Point' }, coordinates: [Number] }
})
  
module.exports = mongoose.model('road', schemaRoad);