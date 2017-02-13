var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    first_name: String,
    last_name: String,
    userId: String,
    profile_pic: String,
    locale: String,
    timezone: Number,
    gender: String,
    pageMessaged: String,
    timeOfFirstMessage: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);