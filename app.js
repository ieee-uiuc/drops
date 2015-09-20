var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var child_process = require('child_process');
var spawnSync = child_process.spawnSync;
var spawn = child_process.spawn;

function getInfo(url) {
	var ytdl = require('ytdl-core');
	ytdl.getInfo(url,
				{"downloadURL":true},
				function(err, info) {
					var results = info.formats;
					results.forEach(function(item) {
						// only take the ones that are of audio mp4 type
						if ((item.type).indexOf("audio/mp4") > -1)
							console.log(item.url)
					});
	});
}

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding('utf-8');

function rcVLC(command) {
	var toWrite = command + "\n";
	console.log("Attempted command: " + toWrite);
	vlc.stdin.write(toWrite);
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
		var url = getInfo(data.url);
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

