var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SongSchema = new Schema({
    youtubeId: { type: String, required: true, index: { unique: true } },
    timesPlayed: { type: Number, default: 0 },
    banned: { type: Boolean, default: false}
});

module.exports = mongoose.model('Song', SongSchema);
