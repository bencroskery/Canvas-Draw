// Setup express server.
var express = require('express')
  , app     = express()
  , server  = require('http').Server(app)
  , io      = require('socket.io')(server)
  , fs      = require('fs');

// Folder holding all client pages.
app.use(express.static(__dirname + '/public'));

// Start listening on the port.
var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('Server listening on port ' + port);
});

var userList     // List of all users with IDs.
  , playerNames  // List of the names of the users.
  , running      // Whether a game is in progress.
  , words        // Words the drawer is asked to choose from.
  , wordList;    // The full list of all words.

// Setup all game variables (used for reset).
function setupGame() {
    userList = [];
    playerNames = [];
    running = false;
    words = [];
    wordList = fs.readFileSync('words.txt').toString().split("\n");
    for (i in wordList) {
        console.log(wordList[i]);
    }
}
setupGame();

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('add user', function (name) {
        if (running) {
            return;
        }
        // Add the user.
        userList.push(socket.id);
        playerNames.push(name);
        socket.number = userList.length - 1;
        socket.name = name;
        addedUser = true;

        console.log('User ' + name + ' has joined');
        // Tell everyone that this user has joined.
        socket.emit('setup', playerNames);
        socket.broadcast.emit('user joined', socket.name);
    });
    
    socket.on('list users', function (d) {
        console.log('Number of users: ' + userList.length);
        console.log(userList);
        console.log(playerNames);
    });

    socket.on('start game', function (d) {
        if (running) {
            return;
        }
        running = true;
        console.log('Game started!');
        io.sockets.emit('start game', 0);
        io.sockets.emit('turn-wait', 0);
        words = [wordList[Math.floor(Math.random() * wordList.length)], wordList[Math.floor(Math.random() * wordList.length)], wordList[Math.floor(Math.random() * wordList.length)]];
    });
    
    socket.on('stop game', function (d) {
        if (!running) {
            return;
        }
        running = false;
        console.log('Game stopped!');
        io.sockets.emit('stop game', 0);
    });
    
    socket.on('turn-wait', function (d) {
        io.sockets.emit('turn-wait', 0);
        console.log('Next turn');
        words = [wordList[Math.floor(Math.random() * wordList.length)], wordList[Math.floor(Math.random() * wordList.length)], wordList[Math.floor(Math.random() * wordList.length)]];
    });
    
    socket.on('turn-choose', function (d) {
        console.log('Choosing word');
        io.sockets.emit('turn-choose', words);
    });
    
    socket.on('turn-draw', function (word) {
        console.log('Drawing');
        if (word === -1) {
            word = wordList[Math.floor(Math.random() * wordList.length)];
        }
        io.sockets.emit('turn-draw', word);
    });

    socket.on('point', function (point) {
        console.log(point);
        socket.broadcast.emit('point', point);
    });

    socket.on('set color', function (c) {
        console.log('Color is now ' + c);
        socket.broadcast.emit('set color', c);
    });
    
    socket.on('set size', function (c) {
        console.log('Size is now ' + c);
        socket.broadcast.emit('set size', c);
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

    socket.on('correctguess', function (d) {
        console.log(socket.name + ' guessed right!');
        // Send the message to everyone.
        io.sockets.emit('correctguess', socket.name);
    });
    
    socket.on('reboot server', function (d) {
        setupGame();
        console.log('Server rebooted.');
        io.sockets.emit('reboot', 0);
    });

    socket.on('disconnect', function () {
        // Remove the name from global userList and playerNames list.
        if (addedUser) {
            userList.splice(socket.number, 1);
            playerNames.splice(socket.number, 1);
            
            console.log('User ' + socket.name + ' has left');
            // Tell everyone that this user has left.
            socket.broadcast.emit('user left', {
                name: socket.name,
                number: socket.number
            });
        }
    });
});