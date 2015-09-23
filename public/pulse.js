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
		Materialize.toast('Song added!', 4000);
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

$('#volUp').click(function() {
	socket.emit('control', { command : 'volUp'});
});

$('#volDown').click(function() {
	socket.emit('control', { command : 'volDown'});
});

$('#clear').click(function() {
	socket.emit('clearQueue');
	$('#queue').html('');
});


// when numUsers updates
socket.on('numUsersChanged', function(data) {
	$('#numUsers').text(data.newNumUsers);
});

// add events like play status, volume, playlist, etc changed
updateQueue();
