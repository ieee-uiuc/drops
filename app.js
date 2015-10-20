var app = require('http').createServer()
var io = require('socket.io')(app);
var spawn = require('child_process').spawn;
var mongoose = require('mongoose');
var User = require('./user');
var fs = require('fs');
var jwt = require('jsonwebtoken');

/* GLOBAL RULE: QUEUE[0] IS ALWAYS THE SONG PLAYING AT THE MOMENT */

// Make connection to MongoDB
var connStr = 'mongodb://localhost/drops';
mongoose.connect(connStr, function(err) {
    if (err) throw err;
    //console.log('Successfully connected to MongoDB');
});

// JSON Web Token related things
var jwtSecret = fs.readFileSync('.jwt-secret');
var AUDIENCE = "http://ecerso.party";
var ISSUER = "http://ecerso.party";
var EXPIRY = "2h";
var ALGORITHM = "HS256";

// Listen to WebSocket connections on port 8080
app.listen(8080);

// Total current user counter
var numUsers = 0;

// Now Playing status
var playing = false;
var stopped = true;

// This holds the number of seconds elapsed since the start of the current song
var currElapsed = 0;
var intervalObj, masterIntervalObj;

// Create the remote controlled VLC process
var vlc = spawn('vlc', ['-I', 'rc']);
vlc.stdin.setEncoding('utf-8');

// Pipes the command to the VLC remote control interface
function rcVLC(command) {
	var toWrite = command + "\n";
	vlc.stdin.write(toWrite);
}

// The current queue
var queue = [];

// Sets the song interval to increment currElapsed every second
function setSongInterval() {
	intervalObj = setInterval(function () {
		currElapsed += 1;
	}, 1000);
}

// Sets the master interval
// This checks if the current song is done playing, and if so, go to the next song
// This should occur regardless of the other setIntervals
function setMasterInterval() {
	masterIntervalObj = setInterval(function () {
		if ( (queue.length > 0) && (playing) && (!stopped) ) {
			if (currElapsed >= queue[0].length_seconds) {
				nextSong();
			}
		}
	}, 1000);
}

// Returns thumbnail url, title, duration, audio url, and sets score to 0
function getInfo(id, cb) {
	var ytdl = require('ytdl-core');
	var BASE = "http://www.youtube.com/watch?v=";
	var url = BASE + id;
	ytdl.getInfo(url,
				{"downloadURL":true},
				function (err, info) {
					// Error handling if ytdl couldn't get info for the request video
					if (err || !info) {
						cb('error');
						return;
					}
					// Calculate and format duration properly
					var seconds = info.length_seconds % 60;
					if (seconds < 10) 
						seconds = '0' + seconds;

					var ret = {
						id : id,
						url : url,
						thumbnail : info.iurlhq,
						title : info.title,
						addedBy : 'DJ ROOMBA',
						length_seconds : info.length_seconds,
						duration : Math.floor(info.length_seconds / 60) + ':' + seconds,
						audioURL : '',
						score: 0,
						votedOnBy : []
					}

					var results = info.formats;
					for (var i = 0; i < results.length; i++) {
						if (results[i].type === undefined)
							continue;
						if ((results[i].type).indexOf("audio/mp4") > -1) {
							ret.audioURL = results[i].url;
							cb(ret);
							break;
						}
					};
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

// Removes any songs from the queue that have a score of -3
// Sorts the queue based on score of the songs
function sortQueue(cb) {
	queue.forEach(function (queueItem, index) {
		if (queueItem.score < -3 ) {
			queue.splice(index,1);
		}
	});

	// Sort the queue, ignoring the now playing item
	var tempQueue = queue.slice(1);
	tempQueue.sort(function(a,b) {
		if (a.score > b.score)
			return -1;
		if (a.score < b.score)
			return 1;
		return 0;
	});

	// Delete all of it except the currently playing one, and put the sorted part back in
	// TODO: This part could be made more efficient
	queue.splice(1, queue.length-1);
	queue = queue.concat(tempQueue);

	cb();
}

// Go to next song by clearing vlc's playlist, and add from the front of our queue
function nextSong(first) {
	clearInterval(intervalObj);
	clearInterval(masterIntervalObj);
	currElapsed = 0;
	rcVLC('clear');

	// If the queue length is 0, do nothing
	if (queue.length == 0)
		return;

	// If this is the first song being played, just get the front, don't shift
	if (!first)
		queue.shift();
	var nextSong = queue[0];

	// If the queue is now empty
	if (!nextSong) {
		playing = false;
		stopped = true;
	}

	// Add does enqueue and play
	else {
		rcVLC('add ' + nextSong.audioURL);
		playing = true;
		stopped = false;
		
		// Start incrementing elapsed every second
		setSongInterval();
		setMasterInterval();
	}

	// Send out updated queue and now playing status
	sendQueue();
	sendNowPlaying();
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

// Set the master interval
setMasterInterval();

function verifyToken(token, fn) {
	jwt.verify(token, jwtSecret, {algorithms : [ALGORITHM], audience : AUDIENCE, issuer : ISSUER}, function(err, decoded) {
			// If the token is not valid
			if (err)
				fn({success : false, decodedToken : null});

			// If the token is not yet expired and is otherwise valid
			else 
				fn({success : true, decodedToken : decoded});
		});
}

// APIs and socket interactions
// These are on a per user 
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

	/* Credential related functions - register, login, verifyToken */

	// Registers a user in the db with their provided credentials
	socket.on('register', function(data, fn) {
		// Try finding the username first to see if it exists
		User.findOne({ username: data.username }, function(err, user) {
			// If some error happens
	        if (err) {
	        	fn({success : false, message : 'Something happened.'});
	        	throw err;
	        }

	        // If a user with that name is found, tell the end user that they can't use this one.
	        if (user)
	        	fn({success : false, message : 'User "' + data.username + '" already exists.'});

	        // If the user is not found, add the new one 
	        if (!user) {
	        	// create a user a new user
				var newUser = new User({
				    username: data.username,
				    password: data.password
				});

				// Save user to database
				newUser.save(function(err) {
				    if (err) {
				    	fn({success : false, message : 'Could not save user.'});
				    	throw err;
				    }
				});

				// Create the token and return that
            	var generatedToken = jwt.sign({	username : data.username},
            									jwtSecret,
            									{	expiresIn : EXPIRY,
            										audience : AUDIENCE,
            										issuer : ISSUER,
            										subject : user.username
            									}
            								);

	        	fn({success : true, message : 'Thanks for registering ' + data.username, token : generatedToken});
	        	return;
	        }
	    });

	    

		
	});

	// Checks whether the attempted credentials are correct and responds accordingly
	socket.on('login', function(data, fn) {
		// Find the user
		User.findOne({ username: data.username }, function(err, user) {
			// If some error happens
	        if (err) {
	        	fn({success : false, message : 'Something happened.'});
	        	throw err;
	        }

	        // If the user is not found
	        if (!user) {
	        	fn({success : false, message : 'User "' + data.username + '" not found.'});
	        	return;
	        }

	        // Check whether the password matches
	        user.comparePassword(data.password, function(err, isMatch) {
	            if (err)
	            	throw err;

	            // If the password does not match
	            if (!isMatch) {
	            	fn({success : false, message : 'Password incorrect.'});
	            }
	            
	            // If password matches, create and send the token.
	            if (isMatch) {
	            	// Create the token and return that
	            	var generatedToken = jwt.sign({	username : user.username},
	            									jwtSecret,
	            									{	expiresIn : EXPIRY,
	            										audience : AUDIENCE,
	            										issuer : ISSUER,
	            										subject : user.username
	            									}
	            								);
					fn({success : true, message : 'Login success.', token : generatedToken});
	            }
	        });

	    });
	});

	// Checks whether the supplied token is valid
	socket.on('verifyToken', function(data,fn) {
		verifyToken(data.token, fn);
	});

	// Add a song to the queue
	// "Returns" whether the song was successfully added or not
	// This would fail if the song was too long, if it's already in the queue, or some error occurred
	socket.on('addSong', function (data, fn) {
		// First check if the token was included and if it's valid. If it's not, don't add the song
		verifyToken(data.token, function(valid) {
			if (!valid.success) {
				fn({success : false, message : 'Please sign in to add songs!'});
				return;
			}

			getInfo(data.id, function (song) {
				// Error handling
				if (song === 'error') {
					fn({success : false, message : 'Error adding song.'});
					return;
				}
				// Check if the song is already in the queue
				var index = songIndexInQueue(song.id);

				// If the request song is more than 10 minutes, don't allow it to be added to the queue. This is to prevent those 10 hour mixes.
				if (song.length_seconds > 600) {
					fn({success : false, message : 'Sorry, that song is too long!'});
				}

				// Prevent adding the song if it's already in the queue
				else if (index !== false) {
					fn({success : false, message : 'That song is already in the queue!'});
				}

				// otherwise, add the song
				else {
					// Add the username of the person that added the song
					song.addedBy = valid.decodedToken.sub;
					queue.push(song);

					sendQueue();
					fn({success : true, message : 'Song added!'});

					// If nothing is currently playing, start playing the song that was just added
					if (stopped)
						nextSong(true);
				}
			});
		});
	});

	// Modifies the queue item's score based on what the user clicked
	// Once that's done, it sorts the queue, then sends out an updated queue
	socket.on('vote', function(data,fn) {
		verifyToken(data.token, function(valid) {
			if (!valid.success) {
				fn({success: false, message: "Please sign in to vote!"});
				return;
			}

			// Find the song in the queue
			var index = songIndexInQueue(data.id);
			if (index === false) {
				return;
			}

			// Check if the user has already voted on that song
			if ( (queue[index].votedOnBy).indexOf(valid.decodedToken.username) != -1 ) {
				fn({success: false, message: "You've already voted on this song."});
				return;
			}

			// If data.vote is 0, don't do anything. This won't happen from user interaction, but if the front end vote function is called some other way, cover this case
			if (data.vote == 0)
				return;

			// For up and down votes, mark down the user that voted

			// If it's is positive, increment the score
			else if (data.vote > 0) {
				queue[index].score += 1;
				queue[index].votedOnBy.push(valid.decodedToken.username);
				fn({success: true, message: "Upvoted!"});
			}
			// If it's negative, decrement the score
			else if (data.vote < 0) {
				queue[index].score -= 1;
				queue[index].votedOnBy.push(valid.decodedToken.username);
				fn({success: true, message: "Downvoted!"});
			}

			// Sort
			sortQueue(sendQueue);
		});		
	});

	/* MUSIC CONTROLS */

	socket.on('play', function (data, fn) {
		// Start incrementing elapsed every second
		setSongInterval();
		rcVLC('play');
		playing = true;
		sendNowPlaying();
	});

	socket.on('pause', function (data, fn) {
		clearInterval(intervalObj);
		rcVLC('pause');
		playing = false;
		sendNowPlaying();
	});

	socket.on('next', function (data,fn) {
		verifyToken(data.token, function(valid) {
			if (!valid.success) {
				fn({success : false, message : "Please sign in to skip songs."});
				return;
			}

			nextSong();
		});
	});

	/* MUSIC CONTROLS */

	socket.on('admin', function(data, fn) {
		switch(data.command) {
			case "changeVolume":
				break;
			case "clearQueue":
				clearInterval(intervalObj);
				clearInterval(masterIntervalObj);
				currElapsed = 0;
				rcVLC('clear');
				queue.length = 0;
				playing = false;
				stopped = true;
				sendQueue();
				sendNowPlaying();
				break;
			case "getListOfAllUsers":
				break;
			case "getListOfCurrUsers":
				break;
			case "banUser":
				break;
			case "banSong":
				break;
		}
	});

});
