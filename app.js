var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var spawn = require('child_process').spawn;
var fs = require('fs');

// Total current user counter
var numUsers = 0;

// Now Playing status
// could use vlc is_playing
var playing = false;

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding('utf-8');

// VLC input/output logs
var vlcin = fs.createWriteStream("vlcin.txt");
var vlcout = fs.createWriteStream("vlcout.txt");

// Queue log
var queueLog = fs.createWriteStream("queueLog.txt");

// The current queue
var queue = [];

// Returns a direct URL to the first audio stream for the video
// TODO: also return the title, duration, etc
function getInfo(id, cb) {
	var ytdl = require('ytdl-core');
	var BASE = "http://www.youtube.com/watch?v=";
	var url = BASE + id;
	ytdl.getInfo(url,
				{"downloadURL":true},
				function(err, info) {
					var ret = {
						thumbnail : info.iurlhq,
						title : info.title,
						duration : info.length_seconds,
						audioURL : '',
						score: 0
					}

					var results = info.formats;
					results.forEach(function(item) {
						if ((item.type).indexOf("audio/mp4") > -1) {
							ret.audioURL = item.url;
							cb(ret);
						}
					});
	});
}

// Should return the output from stdout via callback
// Need to fix the logging so it doesn't do the full stdout every time
function rcVLC(command) {
	var toWrite = command + "\n";
	vlcin.write(toWrite);
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

function broadcast(key, value) {
	io.emit(key, value);
}

function sendNumUsers() {
	broadcast('numUsersChanged', {newNumUsers : numUsers});
}

// APIs and socket interactions
io.on('connection', function(socket){

	// Up the total current user counter
	numUsers++;
	sendNumUsers();
	
	// when someone disconnects, send the updated num to all the other users
	socket.on('disconnect', function() {
		numUsers--;
		sendNumUsers();
	});

	// Add a song to the playlist
	// "Returns" the current queue
	socket.on('addSong', function(data, fn) {
		getInfo(data.id, function(info) {
			queue.push(info);
			rcVLC('enqueue ' + info.audioURL);
			queueLog.write("Adding song: " + info.title + '\n');
			fn();
		});
	});

	// Remove a song to the playlist
	// VLC doesn't have anything for this
	// could use our queue, and only add to VLC as they get popped off from our queue
	// socket.on('removeSong', function(data) {
	// 	getInfo(data.id, function(info) {
	// 		rcVLC('enqueue ' + info.audioURL);
	// 	});
	// });

	// Returns the current playlist
	socket.on('getQueue', function(fn) {
		fn(queue);
	});

	// Clear the queue
	socket.on('clearQueue', function(data) {
		queue = [];
		rcVLC('clear');
	});

	// Commands
	socket.on('control', function(data,fn) {
		switch(data.command) {
			case "play":
				rcVLC("play");
				playing = true;
				break;
			case "pause":
				rcVLC("pause");
				playing = false;
				break;
			case "next":
				rcVLC(data.command);
				var pop = queue.shift();
				if (!pop) {
					rcVLC('clear');
				}
				fn();
				break;
			case "volUp":
				rcVLC('volup 5');
				break;
			case "volDown":
				rcVLC('voldown 5');
				break;
			default: 
				console.log("Invalid command");
		}
	});
});

