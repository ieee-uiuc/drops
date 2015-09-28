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

var currElapsed = 0;
var currSongLength = 0;

/* USER INTERACTIONS */

// Upvote/downvote a song, disable vote buttons for that song for current user
function vote(id, vote) {
	Materialize.toast('Sorry, voting is not available yet!', 2500);
	return;
	socket.emit('vote', { id : id, vote : vote}, function() {
		$('.voteButton-' + id).hide();
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
		$('#play_pause').html('pause');
	}
	// If the system is currently paused, the button icon should be play
	else {
		playing = false;
		$('#play_pause').html('play_arrow');
	}
});

// When the queue updates
socket.on('queueUpdated', function(data) {
	var songHTML = '';
	$('#queue').html('');

	// Set up for the seekbar
	if (data.newQueue.length > 0)
		currSongLength = data.newQueue[0].length_seconds;
	else
		currSongLength = 0;

	$.each(data.newQueue, function(index, song) {
		var songHTML = '<div class="row"> \
					        <div class="col s12 m6 offset-m3 l4 offset-l4"> \
					          <div class="card medium"> \
					            <div class="card-image"> \
					              <img src="' + song.thumbnail + '"> \
					              <span class="card-title">' + song.title + '</span> \
					            </div> \
					            <div class="card-content"> \
					              <p>' + song.duration + '</p> \
					              <p>Added by: ' + song.addedBy + '</p> \
					            </div> \
					            <div class="card-action">';

		// for the currently playing song, inform the user as such
		if (index == 0) {
			songHTML += '<h6>Now Playing</h6>';
		}
		// don't add vote buttons for the currently playing song
		if (index > 0) {
			songHTML += '<a href="#" class="btn-floating btn-flat waves-effect waves-light voteButton-' + song.id + '" onclick="vote(\'' + song.id + '\', 1)"><i class="material-icons upvote">thumb_up</i></a> \
						<a href="#" class="btn-floating btn-flat waves-effect waves-light voteButton-' + song.id + '" onclick="vote(\'' + song.id + '\', -1)"><i class="material-icons downvote">thumb_down</i></a>'
		}
					            
		songHTML += '</div> \
					</div> \
					</div> \
					</div>' ;

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

// If they press Esc, close the search results
$(document).keyup(function(e) {
	switch(e.which) {
		case 27:
			closeSearchResults();
			break;
		default:
			return;
	}
})