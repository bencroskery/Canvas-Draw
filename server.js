// server.js
var express = require('express')
  , app = express()
  , server = require('http').Server(app)
  , io = require('socket.io')(server)
  , port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
    socket.on('point', function (msg) {
        console.log(msg);
        socket.broadcast.emit('point', msg);
    });
    socket.on('message', function (msg) {
        console.log(msg);
        socket.broadcast.emit('message', msg);
    });
});

// listen on port 3000 (for localhost) or the port defined for heroku
server.listen(port, function () {
    console.log('Server listening on port 3000');
});