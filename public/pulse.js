var socket = io();

function updateQueue() {
	socket.emit('getQueue', function(data) {
		var songHTML = '';
		$('#queue').html('');

		$.each(data, function(index, song) {
			songHTML = '<div class="row"><div class="col s4"><img class="responsive-img" src="' + song.thumbnail + '"/></div><div class="col s6">' + song.title + '</div><div class="col s2">' + song.duration + '</div></div>';
			$('#queue').append(songHTML);
		});
	});
}

$('#add').click(function() {
	socket.emit('addSong', { url : $('#formYTurl').val() }, function() {
		updateQueue();
	});
});

// $('#prev').click(function() {
// 	socket.emit('control', {
// 		command : 'prev'
// 	});
// });

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

// add events like play status, volume, playlist, etc changed

updateQueue();
