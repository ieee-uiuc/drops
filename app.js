var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var spawn = require('child_process').spawn;
var fs = require('fs');

// Total current user counter
var userCount = 0;

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding('utf-8');

// VLC input/output logs
var vlcin = fs.createWriteStream("vlcin.txt");
var vlcout = fs.createWriteStream("vlcout.txt");

// Returns a direct URL to the first audio stream for the video
// TODO: also return the title, duration, etc
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

// Should return the output from stdout via callback
// Need to fix the logging so it doesn't do the full stdout every time
function rcVLC(command) {
	var toWrite = command + "\n";
	vlcin.write(toWrite + "\n");
	vlc.stdin.write(toWrite);

	vlc.stdout.on('data', function(data) {
        vlcout.write(data.toString() + "\n");
    });
}

// Set repeat, loop, and random to off
rcVLC("repeat off");
rcVLC("loop off");
rcVLC("random off");

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
	socket.on('getPlaylist', function(fn) {
		rcVLC('playlist', function(out) {
			console.log(out);
			fn(out);
		});
	});

	// Add a song to the playlist
	socket.on('addSong', function(data) {
		getInfo(data.url, function(audioURL) {
			rcVLC('enqueue ' + audioURL, function(out) {
				console.log(out);
			});
		});
	});

	// Commands
	socket.on('control', function(data) {
		switch(data.command) {
			case "play":
			case "pause":
			case "next":
			case "prev":
				rcVLC(data.command, function(out) {
					console.log(out);
				});
				break;
			default: 
				console.log("Invalid command");
		}
	});
});

