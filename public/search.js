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

	// Fade out the queue temporarily
	$('#queueContainer').fadeOut('fast');

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
		$('#searchContainer').fadeIn('fast');
	  }
	});
	
  });
}

function closeSearchResults() {
	$('#searchContainer').fadeOut('fast', function() {
		$('#queueContainer').fadeIn('fast');
	});
}