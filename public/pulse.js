var socket = io();

$('#add').click(function() {
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

$('#next').click(function() {
	socket.emit('control', {
		command : 'next'
	});
});

$('#prev').click(function() {
	socket.emit('control', {
		command : 'prev'
	});
});

$('#getPlaylist').click(function() {
	socket.emit('getPlaylist', function(data) {
		$('#temp').append(data + "<br>");
	});
});
