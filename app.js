var app = require('http').createServer()
var io = require('socket.io')(app);
var spawn = require('child_process').spawn;
var fs = require('fs');

// Listen to WebSocket connections on port 80
// if you do port 80, you need sudo, but vlc won't run with sudo...
app.listen(8080);

// Total current user counter
var numUsers = 0;

// Now Playing status
// could use vlc is_playing
var playing = false;

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding('utf-8');
vlc.stdout.on('data', function (data) {
	vlcout.write(data.toString());
});

// VLC input/output logs
var vlcin = fs.createWriteStream("vlcin.txt");
var vlcout = fs.createWriteStream("vlcout.txt");

// Queue log
var queueLog = fs.createWriteStream("queueLog.txt");

// The current queue
var queue = [];

// Returns thumbnail url, title, duration, audio url, and sets score to 0
function getInfo(id, cb) {
	var ytdl = require('ytdl-core');
	var BASE = "http://www.youtube.com/watch?v=";
	var url = BASE + id;
	ytdl.getInfo(url,
				{"downloadURL":true},
				function (err, info) {
					var ret = {
						id : id,
						url : url,
						thumbnail : info.iurlhq,
						title : info.title,
						duration : Math.floor(info.length_seconds/60) + ':' + (info.length_seconds%60),
						audioURL : '',
						nowPlaying : false,
						elapsed : 0,
						score: 0
					}

					var results = info.formats;
					// this might call the callback function more than once...
					results.forEach(function (item) {
						if ((item.type).indexOf("audio/mp4") > -1) {
							ret.audioURL = item.url;
							cb(ret);
						}
					});
	});
}

// Remove a song from the queue
function removeSong(id) {
	queue.forEach(function (queueItem, index) {
		if (queueItem.id === song.id) {
			queue.splice(index, 1);
			sendQueue();
			return;
		}
	});
}

// Should return the output from stdout via callback
// Need to fix the logging so it doesn't do the full stdout every time
function rcVLC(command) {
	var toWrite = command + "\n";
	vlcin.write(toWrite);
	vlc.stdin.write(toWrite);
}

// Set repeat, loop, and random to off
rcVLC("repeat off");
rcVLC("loop off");
rcVLC("random off");

/* BROADCASTS */
function broadcast(key, value) {
	io.emit(key, value);
}

function sendNumUsers() {
	broadcast('numUsersChanged', {newNumUsers : numUsers});
}

function sendQueue() {
	io.emit('queueUpdated', {newQueue : queue});
}

function sendNowPlaying() {
	io.emit('nowPlayingChanged', {newNowPlaying : playing});
}

// APIs and socket interactions
io.on('connection', function (socket){

	// Up the total current user counter
	numUsers++;
	sendNumUsers();

	// Send them the queue for the first time, and the current playing status
	sendQueue();
	sendNowPlaying();
	
	// when someone disconnects, send the updated num to all the other users
	socket.on('disconnect', function () {
		numUsers--;
		sendNumUsers();
	});

	// Add a song to the queue
	// "Returns" whether the song was successfully added or not
	// This would fail if the song was too long, if it's already in the queue, or some error occurred
	socket.on('addSong', function (data, fn) {
		getInfo(data.id, function (song) {

			// If the request song is more than 10 minutes, don't allow it to be added to the queue. This is to prevent those 10 hour mixes.
			if (song.length_seconds > 600) {
				fn('Sorry, that song is too long!');
				return;
			}

			// now check if the song is already in the queue
			queue.forEach(function (queueItem, index) {
				if (queueItem.id === song.id) {
					fn('That song is already in the queue!')
					return;
				}
			});

			// otherwise, add the song
			queue.push(song);
			//rcVLC('enqueue ' + song.audioURL);
			queueLog.write("Adding song: " + song.title + '\n');
			sendQueue();
			fn('Song added!');
		});
	});

	// Decrement the score for that song
	// if the new score is less than the half of numUsers, remove it from the queue
	socket.on('downvote', function (data,fn) {
		// use data.id, which is the unique youtube id
	});

	// Increment the score for that song 
	// sort the queue by score
	socket.on('upvote', function (data,fn) {
		// use data.id, which is the unique youtube id
	})

	// Clear the queue
	socket.on('clearQueue', function (data) {
		queue = [];
		rcVLC('clear');
	});

	// when the playing status changes, broadcast out to everyone

	/* MUSIC CONTROLS */

	socket.on('play', function (data, fn) {
		rcVLC('play');
		playing = true;
		sendNowPlaying();
	});

	socket.on('pause', function (data, fn) {
		rcVLC('pause');
		playing = false;
		sendNowPlaying();
	});

	socket.on('next', function (data,fn) {
		// Clear vlc's playlist, and add from the front of our queue
		rcVLC('clear');
		var nextSong = queue.shift();

		// Add does queue and play
		if (!nextSong) {
			rcVLC('add ' + nextSong.audioURL);
		}

		// Send out updated queue
		sendQueue();
	})

});

