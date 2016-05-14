var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    
var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    admin: { type: Boolean, default: false},
    banned: { type: Boolean, default: false}
});

module.exports = mongoose.model('User', UserSchema);