var passportLocalMongoose = require('passport-local-mongoose');
var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var schemaUsers = new Schema({
    userpassword : String,
    email : String,
    registrationDate : Date,
    fullname : String,
    devicecount : Number,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

schemaUsers.methods.generateHash = function(password){
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

schemaUsers.methods.validPassword = function(password){
  return bcrypt.compareSync(password, this.userpassword);
};

schemaUsers.plugin(passportLocalMongoose, {errorMessages: {UserExistsError:"อีเมลดังกล่าวมีอยู่ในระบบแล้ว"} });

module.exports = mongoose.model('users', schemaUsers);
