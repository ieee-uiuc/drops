var socket = io(window.location.hostname + ':8080');

// By default, show the user it isn't connected, but once it has, allow the user to interact
socket.on('connect', function() {
	$('#queueContainer').html('<h2>QUEUE</h2><div id="queue"></div>');
});

// Display message on disconnect
socket.on('disconnect', function() {
	$('#queueContainer').html('<h2>Disconnected. Try refreshing, otherwise, the system went down.</h2>');
});

// Global now playing variable. Should always match the backend system now playing variable
var playing = false;

/* USER INTERACTIONS */

// Upvote/downvote a song, disable vote buttons for that song for current user
function vote(id, vote) {
	socket.emit('vote', { id : id, vote : vote}, function() {
		// remove vote buttons
		$('.voteButton').hide();
	});
}

// id is youtube video id
function addSong(id) {
	socket.emit('addSong', { id : id }, function(response) {
		Materialize.toast(response, 2500);
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
		songHTML = '<div class="row"><div class="col s4"> \
			<img class="responsive-img thumbnail-img" src="' + song.thumbnail + '"/></div><div class="col s6">' + song.title + '<br><b>' + song.duration + '</b></div><div class="col s2"> \
			<button class="btn-floating btn-flat waves-effect waves-light voteButton" onclick="vote(\'' + song.id + '\', 1)"><i class="material-icons upvote">thumb_up</i></button> \
			<button class="btn-floating btn-flat waves-effect waves-light voteButton" onclick="vote(\'' + song.id + '\', -1)"><i class="material-icons downvote">thumb_down</i></button> \
			</div></div>';
		$('#queue').append(songHTML);
	});
});

// when numUsers updates
socket.on('numUsersChanged', function(data) {
	$('#numUsers').text(data.newNumUsers);
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
	socket.emit('next');
});
