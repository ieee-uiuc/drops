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

		// Replace the close results button with the search
		$('#search-button').fadeOut('fast', function() {
			$('#close-results-button').fadeIn('fast');
		});


		var q = $('#query').val();
		var request = gapi.client.youtube.search.list({
		q: q,
		part: 'snippet',
		maxResults : 10,
		key: 'YT_KEY'
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

				html = '<div class="col s12 m6 l4"> \
					          <div class="card medium"> \
					            <div class="card-image"> \
					              <img src="' + item.snippet.thumbnails.high.url + '"> \
					              <span class="card-title">' + item.snippet.title + '</span> \
					            </div> \
					            <div class="card-content"> \
					              <p class="truncate">' + item.snippet.description + '</p> \
					            </div> \
					            <div class="card-action"> \
					              <a class="add-song-button" onclick="addSong(\'' + videoID + '\')"><i class="small material-icons">add</i>Add song to queue</a> \
					            </div> \
					          </div> \
					        </div>' ;

			$('#search-results').append(html);
			$('#searchContainer').fadeIn('fast');
			}
		});
	});
}

function closeSearchResults() {
	// Replace search results container with the queue
	$('#searchContainer').fadeOut('fast', function() {
		$('#queueContainer').fadeIn('fast');
	});

	// Replace the close results button with the search button
	$('#close-results-button').fadeOut('fast', function() {
		$('#query').val('');
		$('#search-button').fadeIn('fast');
	});
}