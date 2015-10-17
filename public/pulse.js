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
var queue;

var currElapsed = 0;
var currSongLength = 0;

/* Credential related functions */

// Saves the provided token into sessionStorage
function setToken(token) {
	sessionStorage.setItem('authToken', token);
}

// Returns the token from sessionStorage
function getToken() {
	return sessionStorage.getItem('authToken');
}

// This checks for a token in sessionStorage and makes sure it's valid. If both conditions match, it returns the token
// Shouldn't verify on client side, should verify by calling an API endpoint
function checkToken(cb) {
	var authToken = getToken();

	if ( (authToken === null) || (authToken === undefined) ) {
		cb(false);
	}

	socket.emit('verifyToken', {token : authToken}, function(response) {
		cb(response.success); // don't need the decoded token
	});
}

function register() {
	socket.emit('register', {username : $('#register-username').val(), password : $('#register-password').val()}, function(response) {
		// If registration was unsuccessful (username already taken or some other error), display the response message
		if (!response.success)
			$('#register-results').html(response.message);
		
		// If registration succeeded, it'll make the user return with the JWT which we store in sessionStorage
		else {
			setToken(response.token);
			$('#register-results').html(response.message);

			// Show the message for 1.5 seconds before closing the modal
			setTimeout(function() {
				$('#sign-in-modal').closeModal();
				$('.sign-in-button, .register-button').fadeOut('fast');
			}, 1500);
		}
	});
}

function login() {
	socket.emit('login', {username : $('#login-username').val(), password : $('#login-password').val()}, function(response) {
		// If login was unsuccessful (username and/or password was incorrect)
		if (!response.success)
			$('#login-results').html(response.message);
		
		// If login was successful, save it in sessionStorage
		else {
			setToken(response.token);
			$('#login-results').html(response.message);

			// Show the message for 1.5 seconds before closing the modal
			setTimeout(function() {
				$('#sign-in-modal').closeModal();
				$('.sign-in-button, .register-button').fadeOut('fast');
			}, 1500);
		}
	});
		
}

/* USER INTERACTIONS */

// Upvote/downvote a song, disable vote buttons for that song for current user
function vote(id, vote) {
	var authToken = getToken();

	if ( (authToken === null) || (authToken === undefined) ) {
		$('login-results').html("Please sign in to add songs.");
		$('#sign-in-modal').openModal();
	}
	
	else {
		socket.emit('vote', { id : id, vote : vote, token : authToken}, function() {
			$('.voteButton-' + id).fadeOut('fast');
			Materialize.toast('Voted!', 2500);
		});
	}
}

// id is youtube video id
function addSong(id) {
	// Call checkToken first
	var authToken = getToken();

	if ( (authToken === null) || (authToken === undefined) ) {
		$('login-results').html("Please sign in to add songs.");
		$('#sign-in-modal').openModal();
	}
	
	else {
		socket.emit('addSong', { id : id, token : authToken }, function(response) {
			Materialize.toast(response, 2500);
		});
	}
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
			songHTML += '<div class="col s2"></div><div class="col s8"><h5>Now Playing</h5></div><div class="col s2"></div>';
		}
		// don't add vote buttons for the currently playing song
		if (index > 0) {
			songHTML += '<div class="col s2"><a class="btn-floating btn-flat waves-effect waves-light voteButton-' + song.id + '" onclick="vote(\'' + song.id + '\', 1)"><i class="material-icons upvote">thumb_up</i></a></div> \
						<div class="col s8"><h5>Score : ' + song.score + '</h5></div> \
						<div class="col s2"><a class="btn-floating btn-flat waves-effect waves-light voteButton-' + song.id + '" onclick="vote(\'' + song.id + '\', -1)"><i class="material-icons downvote">thumb_down</i></a></div>'
		}
					            
		songHTML += '</div> \
					</div> \
					</div> \
					</div>' ;

		$('#queue').append(songHTML);
	});

	Materialize.toast('Queue Updated!', 2500);
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
	// Call checkToken first
	var authToken = getToken();

	if ( (authToken === null) || (authToken === undefined) ) {
		$('login-results').html("Please sign in to add songs.");
		$('#sign-in-modal').openModal();
	}
	
	else {
		socket.emit('next', { token : authToken }, function(response) {
			Materialize.toast(response, 2500);
		});
	}
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

$(document).ready(function(){
	// the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
	$('.modal-trigger').leanModal();

	// Check if there's already a valid token. If so, hide sign-in and register buttons
	checkToken(function(valid) {
		if (valid) {
			$('.sign-in-button, .register-button').fadeOut('fast');
		}
	});
});
