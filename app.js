var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var spawn = require("child_process").spawn;
var vlc = require('vlc')([
  '-I', 'dummy',
  '-V', 'dummy',
  '--verbose', '1',
  '--no-video-title-show',
  '--no-disable-screensaver',
  '--no-snapshot-preview',
]);


var port = 8080;

// The public site
app.use(express.static('public'));
server.listen(port);

// APIs and socket interactions

io.on('connection', function(socket){
  console.log('a user connected');
});

testURL = "https://www.youtube.com/watch?v=z5ZdjwbQnXc";

var process = spawn('python',["audio_url.py", testURL]);
process.stdout.on('data', function (data) {
	results = JSON.parse(data);

	console.log("Audio URL: " + results.audioUrl);

	var media = vlc.mediaFromUrl(results.audioURL);
	media.parseSync();

	var player = vlc.mediaplayer;
	player.media = media;

	player.play();

	// pause after 10 seconds
	setTimeout(function() {
		player.pause();
	}, 10000);
})


