var socket = io();

function updateQueue() {
	socket.emit('getQueue', function(data) {
		var songHTML = '';
		$('#queue').html('');

		$.each(data, function(index, song) {
			songHTML = '<div class="row"><div class="col s4"><img class="responsive-img thumbnail-img" src="' + song.thumbnail + '"/></div><div class="col s6">' + song.title + '<br><b>' + song.duration + '</b></div><div class="col s2"><a class="btn-floating btn waves-effect waves-light red"><i class="material-icons">thumb_down</i></a></div></div>';
			$('#queue').append(songHTML);
		});
	});
}

// either all APIs should call updateQueue or all should expect the updated queue to come back in the response

// id is youtube video id
function addSong(id) {
	socket.emit('addSong', { id : id }, function() {
		updateQueue();
	});
}

$('#prev').click(function() {
	socket.emit('control', {
		command : 'prev'
	});
});

$('#play').click(function() {
	socket.emit('control', {
		command : 'play'
	});
});

$('#pause').click(function() {
	socket.emit('control', {
		command : 'pause'
	});
});

$('#next').click(function() {
	socket.emit('control', { command : 'next' }, function() {
		updateQueue();
	});
});

// when numUsers updates
socket.on('numUsersChanged', function(data) {
	$('#numUsers').text(data.newNumUsers);
});

/* 

Youtube Search

*/

// Upon loading, the Google APIs JS client automatically invokes this callback.
googleApiClientReady = function() {
  gapi.auth.init(function() {
	window.setTimeout(loadAPIClientInterfaces, 1);
  });
}

// Load the client interfaces for the YouTube Analytics and Data APIs
function loadAPIClientInterfaces() {
  gapi.client.load('youtube', 'v3', function() {
	handleAPILoaded();
  });
}

// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
  $('#search-button').attr('disabled', false);
}

// Search for a specified keywords.
function ytSearch() {
  var q = $('#query').val();
  var request = gapi.client.youtube.search.list({
	q: q,
	part: 'snippet',
	key: 'AIzaSyBhZubf4N-jenWLm8aUQhkxjCc8_EMnEKA'
  });

  request.execute(function(response) {
	// already json-parsed
	var results = response.result.items;

	var html = '';

	// clear out the search results first
	$('#search-results').html('');

	// go through each one and remove the ones that are not of kind youtube#video
	// for each result that is a video, output to user
	$.each(results, function(key, item) {	  
	  if (item.id.kind === "youtube#video") {
	  	var videoID = item.id.videoId;
	  	var thumbnail = item.snippet.thumbnails.high.url;
	  	var title = item.snippet.title;
	  	var description = item.snippet.description;

	  	html = '<div class="row"> \
								<div class="col s2"> \
									<img class="responsive-img thumbnail-img" src="' + item.snippet.thumbnails.high.url + '"/> \
								</div> \
								<div class="col s8"> \
									<h5>' + title + '</h5> \
									<p>' + description + '</p> \
								</div> \
								<div class="col s2"> \
									<button onclick="addSong(\'' + videoID + '\')"class="btn-floating btn-large waves-effect waves-light red"><i class="material-icons">add</i></button> \
								</div> \
							</div>';

		$('#search-results').append(html);
	  }
	});

	// need video id, title, thumbnail image, description, duration
	
  });
}




// add events like play status, volume, playlist, etc changed
updateQueue();
