var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    first_name: String,
    last_name: String,
    id: String,
    profile_pic: String,
    locale: String,
    timezone: Number
});

module.exports = mongoose.model('User', userSchema);