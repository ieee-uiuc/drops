var socket = io();

$('#submit').click(function() {
	socket.emit('addSong', {
		url : $('#formYTurl').val()
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

$('#getPlaylist').click(function() {
	socket.emit('getPlaylist', function(data) {
		$('#playlist').html(data);
	});
});
