var express = require('express');
var app = express();
var io = require('socket.io')(http);
var spawn = require("child_process").spawn;

var port = 80;

// The public site
app.use(express.static('public'));
var server = app.listen(80);

// APIs and socket interactions

io.on('connection', function(socket){
  console.log('a user connected');
});

testURL = "https://www.youtube.com/watch?v=z5ZdjwbQnXc";

var process = spawn('python',["audio_url.py", testURL]);
process.stdout.on('data', function (data) {
	results = JSON.parse(data);
	console.log(results);
})

