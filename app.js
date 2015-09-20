var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var child_process = require('child_process');
var spawnSync = child_process.spawnSync;
var spawn = child_process.spawn;

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding('utf-8');

function rcVLC(command) {
	var toWrite = command + "\n";
	console.log("Attempted command: " + toWrite);
	vlc.stdin.write(toWrite);
}

// change so it doesn't spawn a new process on every single call to this function
// also change to not using pafy/python down the line
// make it asynchronous
function getAudioURL(yturl) {
	var py = spawnSync('python',["audio_url.py", yturl]);
	return JSON.parse(py.stdout.toString()).audioURL;
}

// if you do port 80, you need sudo, but vlc won't run with sudo...
var port = 8080;

// The public site
app.use(express.static('public'));
server.listen(port);

// APIs and socket interactions
io.on('connection', function(socket){

	console.log('a user connected');

	// Add a song to the playlist
	socket.on('addSong', function(data) {
		var url = getAudioURL(data.url);
		rcVLC('add ' + url);
	});

	// Commands
	socket.on('command', function(data) {
		command = data.command;
		if (command === "play")
			rcVLC('play');
		else if (command == "pause")
			rcVLC('pause');
		
	});
});

