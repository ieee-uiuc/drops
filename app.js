var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var child_process = require('child_process');
var spawnSync = child_process.spawnSync;
var spawn = child_process.spawn;

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding

function rcVLC(command) {
	vlc.stdin.write(command);
}

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

// APIs and socket interactions
io.on('connection', function(socket){

	console.log('a user connected');

	// Add a song to the playlist
	socket.on('addSong', function(data) {

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

