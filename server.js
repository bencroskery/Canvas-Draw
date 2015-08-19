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

// Users which are connected to the chat.
var userlist = [];
var playernames = [];

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('add user', function (name) {
        // Add the user.
        userlist.push(socket.id);
        playernames.push(name);
        socket.number = userlist.length - 1;
        socket.name = name;
        addedUser = true;

        console.log('User ' + name + ' has joined');
        // Tell everyone that this user has joined.
        socket.emit('setup', playernames);
        socket.broadcast.emit('user joined', socket.name);
    });
    
    socket.on('list users', function (d) {
        console.log('Number of users: ' + userlist.length);
        console.log(userlist);
        console.log(playernames);
    });

    socket.on('start game', function (d) {
        console.log('Game started!');
        io.sockets.emit('start game', 0);
        io.sockets.emit('turn', 0);
    });
    
    socket.on('turn', function (player) {
        console.log('Next turn');
        io.sockets.emit('turn', player);
    });

    socket.on('point', function (point) {
        console.log(point);
        io.emit('point', point);
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
        console.log(socket.name + ' said ' + msg);
        // Send the message to everyone.
        socket.broadcast.emit('message', {
            name: socket.name,
            message: msg
        });
    });

    socket.on('disconnect', function () {
        // Remove the name from global userlist and playernames list.
        if (addedUser) {
            userlist.splice(socket.number, 1);
            playernames.splice(socket.number, 1);

            // Tell everyone that this user has left.
            socket.broadcast.emit('user left', {
                name: socket.name,
                number: socket.number
            });
        }
    });
});
