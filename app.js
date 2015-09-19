var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var spawnSync = require("child_process").spawnSync;
var vlc = require('vlc')([
  '-I', 'dummy',
  '-V', 'dummy',
  '--verbose', '1',
  '--no-video-title-show',
  '--no-disable-screensaver',
  '--no-snapshot-preview',
]);

// change so it doesn't spawn a new process on every single call to this function
// also change to not using pafy/python down the line
// make it asynchronous
function getAudioURL(yturl) {
	ret = '';
	var py = spawnSync('python',["audio_url.py", yturl]);
	console.log(py);
	process.stdout.on('data', function (data) {
		var results = JSON.parse(data);
		ret = results.url;
	});
	console.log("Audio URL: " + ret);
	return ret;
}

var port = 80;

// The public site
app.use(express.static('public'));
server.listen(port);

// Player instance
var player = vlc.mediaplayer;

// APIs and socket interactions
io.on('connection', function(socket){

	console.log('a user connected');

	// Add a song to the playlist
	socket.on('addSong', function(data) {
		var media = vlc.mediaFromUrl(getAudioURL(data.url));
		media.parseSync();
		
		player.media = media;
		player.play();
	});

	// Commands
	socket.on('command', function(data) {
		command = data.command;
		if (command === "play")
			player.play();
		else if (command == "pause")
			player.pause();
		
	});
});

