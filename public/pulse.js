var socket = io();

$('#add').click(function() {
	socket.emit('addSong', {
		url : $('#formYTurl').val()
	});
});

$('#prev').click(function() {
	socket.emit('control', {
		command : 'prev'
	});
});

$('#playpause').click(function() {
	socket.emit('control', {
		command : 'pause'
	});
});

$('#next').click(function() {
	socket.emit('control', {
		command : 'next'
	});
});

$('#getPlaylist').click(function() {
	socket.emit('getPlaylist', function(data) {
		$('#temp').append(data + "<br>");
	});
});
