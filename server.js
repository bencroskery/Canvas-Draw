// Setup express server.
var express = require('express')
  , app = express()
  , server = require('http').Server(app)
  , io = require('socket.io')(server)
  , port = process.env.PORT || 3000;

// Folder holding all client pages.
app.use(express.static(__dirname + '/public'));

// Listen on port 3000.
server.listen(port, function () {
    console.log('Server listening on port 3000');
});

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('add user', function (username) {
        // Add the user.
        socket.username = username;
        usernames[username] = username;
        ++numUsers;
        addedUser = true;

        console.log('User ' + username + ' has joined');
        // Tell everyone that a user has joined
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    socket.on('point', function (point) {
        console.log(point);
        socket.broadcast.emit('point', point);
    });

    socket.on('set color', function (c) {
        console.log('Color is now ' + c);
        socket.broadcast.emit('set color', c);
    });

    socket.on('undo line', function (d) {
        console.log('UNDO!');
        socket.broadcast.emit('undo line', 0);
    });

    socket.on('clear canvas', function (d) {
        console.log('CLEAR!');
        socket.broadcast.emit('clear canvas', 0);
    });

    socket.on('message', function (msg) {
        console.log(socket.username + ' said ' + msg);
        // Send the message to everyone.
        socket.broadcast.emit('message', {
            username: socket.username,
            message: msg
        });
    });
});
