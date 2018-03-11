var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaRisks = new Schema({
  email: String,
  phone: String,
  subject: String,
  content: String,
  deviceID: String,
  createDate: Date,
  valueSet: Array,
  waterSet: { coef: { type: Number, dafault: 0 }, sq: { type: Number, default: 0 } },
  roadSet: { coef: { type: Number, dafault: 0 }, sq: { type: Number, default: 0 } },
  rainSet: { coef: { type: Number, dafault: 0 }, sq: { type: Number, default: 0 } },
  windSet: { coef: { type: Number, dafault: 0 }, sq: { type: Number, default: 0 } },
  humidSet: { coef: { type: Number, dafault: 0 }, sq: { type: Number, default: 0 } },
  tempSet: { coef: { type: Number, dafault: 0 }, sq: { type: Number, default: 0 } },
  threshold: Number,
  operation: String
});
module.exports = mongoose.model('risks', schemaRisks);
