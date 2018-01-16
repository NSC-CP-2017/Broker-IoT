var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaProjects = new Schema({
    name: String,
    desc: String,
    owner: Schema.ObjectId,
    registrationDate: Date,
    devices: Array,
    warningState : Array
});
module.exports = mongoose.model('projects', schemaProjects);
