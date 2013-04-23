var socket = io.connect(window.location.protocol + '//' + window.location.host);
socket.on('getFolderReplay', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});