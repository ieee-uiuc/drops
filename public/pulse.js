// add events like play status, volume, playlist, etc changed

var socketPath = window.location.hostname + ':8080';
console.log("Connecting to : " + socketPath);
var socket = io(socketPath);

// Global now playing variable. Should always match the backend system now playing variable
var playing = false;

/* USER INTERACTIONS */

// Downvote a song, disable vote buttons for that song for current user
function downvote(id) {
	// stuff
}

// Upvote a song, disable vote buttons for that song for current user
function upvote(id) {
	// stuff
}

// id is youtube video id
function addSong(id) {
	socket.emit('addSong', { id : id }, function(response) {
		Materialize.toast(response, 4000);
	});
}

/* INCOMING EVENTS */

// Now Playing status changed
socket.on('nowPlayingChanged', function(data) {
	// If the system is currently playing, the button icon should be pause
	if (data.newNowPlaying) {
		playing = true;
		$('#play_icon').html('pause');
	}
	// If the system is currently paused, the button icon should be play
	else {
		playing = false;
		$('#play_icon').html('play_arrow');
	}
});

// When the queue updates
socket.on('queueUpdated', function(data) {
	var songHTML = '';
	$('#queue').html('');

	$.each(data.newQueue, function(index, song) {
		songHTML = '<div class="row"><div class="col s4"><img class="responsive-img thumbnail-img" src="' + song.thumbnail + '"/></div><div class="col s6">' + song.title + '<br><b>' + song.duration + '</b></div><div class="col s2"><button class="btn-floating btn-flat waves-effect waves-light"><i class="material-icons upvote">thumb_up</i></button><button class="btn-floating btn-flat waves-effect waves-light"><i class="material-icons downvote">thumb_down</i></button></div></div>';
		$('#queue').append(songHTML);
	});
});

// when numUsers updates
socket.on('numUsersChanged', function(data) {
	$('#numUsers').text(data.newNumUsers);
});

$('#prev').click(function() {
	socket.emit('control', {
		command : 'prev'
	});
});

// The socket is going to send the updated now playing status, which is handled by the function above
$('#play_pause').click(function() {
	// If the system is currently playing, the pause button is displayed, so command should be pause
	if (playing) {
		socket.emit('pause');
	}
	else {
		socket.emit('play');
	}
});


$('#next').click(function() {
	socket.emit('control', { command : 'next' }, function() {
		updateQueue();
	});
});

// $('#clear').click(function() {
// 	socket.emit('clearQueue');
// 	$('#queue').html('');
// });
