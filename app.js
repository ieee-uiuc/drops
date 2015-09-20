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

// ISSUE: VLC stdout and stdin don't work

// pipe vlc's output and errors to our stdout
vlc.stdout.pipe(process.stdout);
vlc.stderr.pipe(process.stdout);

// test if it works
vlc.stdin.write('help\n');
vlc.stdin.write('add http://r2---sn-258av8hxqp5-vgqe.googlevideo.com/videoplayback?sparams=clen%2Cdur%2Cgir%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Ckeepalive%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cpl%2Csource%2Cupn%2Cexpire&fexp=9406985%2C9408710%2C9409069%2C9415365%2C9415485%2C9416023%2C9416126%2C9417707%2C9418153%2C9418448%2C9420348%2C9421013&source=youtube&lmt=1441534950888642&dur=124.801&clen=2008810&gir=yes&sver=3&itag=251&signature=EA46303ACD27C5B8CF5D75F07ECBAB06F540EA1F.CF1A0889AE563B4506A235785966C5900D24F226&initcwndbps=3587500&mime=audio%2Fwebm&key=yt5&upn=jfbYz3heAKk&expire=1442740626&pl=16&keepalive=yes&id=o-APKR_Lmym9tfrYJocv1UlTbJ2cKlWz8gnS5-4tczrf1s&mt=1442718991&mv=m&ms=au&mm=31&ip=130.126.255.46&mn=sn-258av8hxqp5-vgqe&ipbits=0&ratebypass=yes' + '\n');

function rcVLC(command) {
	console.log("\nAttempted command: " + command + "\n");
	vlc.stdin.write(command + '\n');
}

// change so it doesn't spawn a new process on every single call to this function
// also change to not using pafy/python down the line
// make it asynchronous
function getAudioURL(yturl) {
	var py = spawnSync('python',["audio_url.py", yturl]);
	return JSON.parse(py.stdout.toString()).audioURL;
}

var port = 80;

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
			player.pause('pause');
		
	});
});

