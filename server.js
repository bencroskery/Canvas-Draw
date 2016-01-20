"use strict";

// Setup express server.
var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    _ = require('lodash');

// Folder holding all client pages.
app.use(express.static(__dirname + '/public'));

// Start listening on the port.
var port = process.env.PORT || 3000;
server.on('error', (e) => console.log('Another process is already using port ' + port));
server.listen(port, () => console.log('Server listening on port ' + port));

var players,    // List of the names of the users.
    running,    // Whether a game is in progress.
    words,      // Words the drawer is asked to choose from.
    wordList;   // The full list of all words.

/**
 * Setup all game variables (used for reset).
 */
function setupGame() {
    players = [];
    running = false;
    words = [];
    wordList = fs.readFileSync('words.txt').toString().split("\n");
}
setupGame();

/**
 * Generate 3 an array of 3 words from the list.
 */
function generateWords() {
    words = _.sample(wordList, 3);
}

io.on('connection', function (socket) {
    var joined = false;

    socket.on('add user', function (player) {
        if (running) {
            return;
        }
        // Add the user.
        players.push(player);
        socket.number = players.length - 1;
        socket.name = player.name;
        joined = true;

        // Tell everyone that this user has joined.
        console.log('User ' + player.name + ' has joined');
        socket.emit('setup', players);
        socket.broadcast.emit('user joined', player);
    });

    socket.on('list users', function () {
        console.log('Number of players: ' + players.length);
        console.log(players.map(p => p.name));
    });

    socket.on('start game', function () {
        if (running) return;
        running = true;
        console.log('Game started!');
        io.sockets.emit('start game', 0);
        io.sockets.emit('turn-wait', 0);
        generateWords();
    });

    socket.on('stop game', function () {
        if (!running) return;
        running = false;
        console.log('Game stopped!');
        io.sockets.emit('stop game', 0);
    });

    socket.on('settings', function (s) {
        if (running) return;
        console.log('Settings changed.');
        socket.broadcast.emit('settings', s);
    });

    socket.on('turn-wait', function (next) {
        console.log('Next turn');
        io.sockets.emit('turn-wait', next);
        generateWords();
    });

    socket.on('turn-choose', function () {
        console.log('Choosing word');
        io.sockets.emit('turn-choose', words);
    });

    socket.on('turn-draw', function (word) {
        console.log('Drawing');
        if (word === -1) word = _.sample(wordList);
        io.sockets.emit('turn-draw', word);
    });

    socket.on('reveal char', function (i) {
        socket.broadcast.emit('reveal char', i);
    });

    socket.on('point', function (point) {
        socket.broadcast.emit('point', point);
    });

    socket.on('set color', function (d) {
        console.log('Color of layer ' + d.l + ' is now ' + d.c);
        socket.broadcast.emit('set color', d);
    });

    socket.on('set size', function (d) {
        console.log('Size of layer ' + d.l + ' is now ' + d.r);
        socket.broadcast.emit('set size', d);
    });

    socket.on('undo line', function () {
        socket.broadcast.emit('undo line', 0);
    });

    socket.on('clear canvas', function () {
        socket.broadcast.emit('clear canvas', 0);
    });

    socket.on('message', function (msg) {
        console.log(socket.name + ' said ' + msg);
        // Send the message to everyone.
        socket.broadcast.emit('message', {
            id: socket.number,
            message: msg
        });
    });

    socket.on('correct guess', function () {
        console.log(socket.name + ' guessed right!');
        // Send the message to everyone.
        io.sockets.emit('correct guess', socket.number);
    });

    socket.on('reboot server', function () {
        setupGame();
        console.log('Server rebooted.');
        io.sockets.emit('reboot', 0);
    });

    socket.on('disconnect', function () {
        // Remove the name from global players list.
        if (joined) {
            if (players.length === 1) {
                console.log('Nobody left.');
                setupGame();
            } else {
                players.splice(socket.number, 1);
                _.values(io.sockets.sockets).forEach(s => {if (s.number > socket.number) s.number--});

                console.log('User ' + socket.name + ' (current ID #' + socket.number + ') has left');
                // Tell everyone that this user has left.
                socket.broadcast.emit('user left', {
                    name: socket.name,
                    number: socket.number
                });
            }
        }
    });
});