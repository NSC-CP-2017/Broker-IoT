var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaWater = new Schema ({
    pos : { type: { type: String, default:'Point' }, coordinates: [Number] }
})
  
module.exports = mongoose.model('water', schemaWater);