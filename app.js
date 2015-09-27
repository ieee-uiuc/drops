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
var playing = false;
var stopped = true;

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
						length_seconds : info.length_seconds,
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

// Returns false if the song is not in the queue, or the index if it is
function songIndexInQueue(id) {
	var ret = false;

	for (var i = 0; i < queue.length; i++) {
		if (queue[i].id == id) {
			ret = i;
			break;
		}
	}

	return ret;
}

// Remove a song from the queue
function removeSong(id) {
	var index = songIndexInQueue(id);
	if (!index) {
		queue.splice(index,1);
		sendQueue();
	}
}

// Removes any songs from the queue that have a score of -(numUsers/2)
// Sorts the queue based on score of the songs
function sortQueue(cb) {
	queue.forEach(function (queueItem, index) {
		if (queueItem.score < (-numUsers/2) ) {
			queue.splice(index,1);
		}
	});

	// Sorts queue from highest to lowest score
	queue.sort(function(a,b) {
		if (a.score > b.score)
			return -1;
		if (a.score < b.score)
			return 1;
		return 0;
	});

	cb();
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

function sendAll() {
	sendNumUsers();
	sendQueue();
	sendNowPlaying();
}

// Go to next song
function nextSong() {
	rcVLC('clear');

	// If the queue length is 0, do nothing
	if (queue.length == 0)
		return;

	// Since we're going to the next song, pop the current one off, and start the new one. but what if there's only one song...

	// Only if the queue has more than one song, pop off the currentlly playing one
	// If there was only one song in the queue (like at the very first play), then nothing would ever play
	if (queue.length > 1)
		queue.shift();

	var nextSong = queue[0];

	// Add does enqueue and play
	if (nextSong) {
		rcVLC('add ' + nextSong.audioURL);
		playing = true;
		stopped = false;
	}

	// Send out updated queue and now playing status
	sendQueue();
	sendNowPlaying();
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
			// Check if the song is already in the queue
			var index = songIndexInQueue(song.id);

			// If the request song is more than 10 minutes, don't allow it to be added to the queue. This is to prevent those 10 hour mixes.
			if (song.length_seconds > 600) {
				fn('Sorry, that song is too long!');
			}

			// Prevent adding the song if it's already in the queue
			else if (index !== false) {
				fn('That song is already in the queue!');
			}

			// otherwise, add the song
			else {
				queue.push(song);
				queueLog.write("Adding song: " + song.title + '\n');
				sendQueue();
				fn('Song added!');

				// If nothing is currently playing, start playing the song that was just added
				if (stopped)
					nextSong();
			}
		});
	});

	// Modifies the queue item's score based on what the user clicked
	// Once that's done, it sorts the queue, then sends out an updated queue
	socket.on('vote', function(data,fn) {
		var index = songIndexInQueue(data.id);
		if (index) {
			queue[index].score += data.vote;
			sortQueue(sendQueue);
		}
	})

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

	// Clear vlc's playlist, and add from the front of our queue
	socket.on('next', function (data,fn) {
		nextSong();
	})

});

