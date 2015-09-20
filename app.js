var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var spawn = require('child_process').spawn;

// Total current user counter
var userCount = 0;

// Returns a direct URL to the first audio stream for the video
function getInfo(url, cb) {
	var ytdl = require('ytdl-core');
	ytdl.getInfo(url,
				{"downloadURL":true},
				function(err, info) {
					var results = info.formats;
					results.forEach(function(item) {
						if ((item.type).indexOf("audio/mp4") > -1) 
							cb(item.url);
					});
	});
}

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding('utf-8');

// Should return the output from stdout via callback
function rcVLC(command, cb) {
	var toWrite = command + "\n";
	console.log("Attempted command: " + toWrite);
	vlc.stdin.write(toWrite);

	vlc.stdout.on('data', function(data) {
		console.log("rc results: " + data);
        cb(data.toString());
    });
}

// if you do port 80, you need sudo, but vlc won't run with sudo...
var port = 8080;

// The public site
app.use(express.static('public'));
server.listen(port);

// APIs and socket interactions
io.on('connection', function(socket){

	// Up the total current user counter
	userCount++;
	console.log("User Count: " + userCount);

	socket.on('disconnect', function() {
		userCount--;
		console.log("User Count: " + userCount);
	});

	// Returns the current playlist
	socket.on('getPlaylist', function(data, fn) {
		rcVLC('playlist', function(result) {
			console.log("wat: " + result);
			fn(result);
		});
	});

	// Add a song to the playlist
	socket.on('addSong', function(data) {
		getInfo(data.url, function(audioURL) {
			rcVLC('add ' + audioURL);
		});
	});

	// Commands
	socket.on('control', function(data) {
		switch(data.command) {
			case "play":
			case "pause":
			case "next":
			case "prev":
				rcVLC(data.command);
				break;
			default: 
				console.log("Invalid command");
		}
	});
});

