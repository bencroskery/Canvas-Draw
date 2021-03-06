"use strict";

// Setup express server.
let express = require('express'),
    app = express(),
    compress = require('compression'),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    _ = require('lodash');

// Folder holding all client pages.
app.use(compress());
app.use(express.static(__dirname + '/public'));

// Start listening on the port.
const port = process.env.PORT || 3000;
server.on('error', (e) => console.log('Another process is already using port ' + port));
server.listen(port, () => console.log('Server listening on port ' + port));

let players = [],  // List of the names of the users.
    running,       // Whether a game is in progress.
    words = [],    // Words the drawer is asked to choose from.
    wordList,      // The full list of all words.
    skipper,
    skip;

const MAXSCALER = 1.5;
/**
 * Calculate the skipper to maintain performance while sending points.
 */
function calcSkip() {
    skipper = Math.floor((Math.sqrt(players.length - 10) || 0) / MAXSCALER);
}

/**
 * Setup all game variables (used for reset).
 */
function setupGame() {
    players.length = 0;
    running = false;
    words.length = 0;
    wordList = fs.readFileSync('words.txt').toString().split("\n");
    skip = skipper = 0;
}
setupGame();

/**
 * Generate 3 an array of 3 words from the list.
 */
function generateWords() {
    words = _.sampleSize(wordList, 3);
}

io.on('connection', (socket) => {
    var joined = false;

    socket.on('add user', (player) => {
        if (running) {
            return;
        }
        // Add the user.
        socket.number = players.length;
        socket.name = player.name;
        joined = true;

        // Tell everyone that this user has joined.
        console.log('User ' + player.name + ' has joined');
        socket.emit('setup', players);
        socket.broadcast.emit('user joined', player);
        players.push(player);
        calcSkip();
    });

    socket.on('list users', () => {
        console.log('Number of players: ' + players.length);
        console.log(players.map(p => p.name));
    });

    socket.on('get skip', () => {
        socket.emit('get skip', skipper);
    });

    socket.on('start game', () => {
        if (running) return;
        running = true;
        console.log('Game started!');
        io.sockets.emit('start game', 0);
        io.sockets.emit('turn-wait', 0);
        generateWords();
    });

    socket.on('stop game', () => {
        if (!running) return;
        running = false;
        console.log('Game stopped!');
        io.sockets.emit('stop game', 0);
    });

    socket.on('settings', (s) => {
        if (running) return;
        console.log('Settings changed.');
        socket.broadcast.emit('settings', s);
    });

    socket.on('turn-wait', (next) => {
        console.log('Next turn');
        io.sockets.emit('turn-wait', next);
        generateWords();
    });

    socket.on('turn-choose', () => {
        console.log('Choosing word');
        io.sockets.emit('turn-choose', words);
    });

    socket.on('turn-draw', (word) => {
        console.log('Drawing');
        if (word === -1) word = _.sample(wordList);
        io.sockets.emit('turn-draw', word);
    });

    socket.on('reveal char', (i) => {
        socket.broadcast.emit('reveal char', i);
    });

    socket.on('p', (point) => {
        if (point.t !== 1) {
            socket.broadcast.emit('p', point);
        } else if (skip === 0) {
            socket.broadcast.volatile.emit('p', point);
            skip = skipper;
        } else {
            skip--;
        }
    });

    socket.on('set color', (d) => {
        console.log('Color of layer ' + d.l + ' is now ' + d.c);
        socket.broadcast.emit('set color', d);
    });

    socket.on('set size', (d) => {
        console.log('Size of layer ' + d.l + ' is now ' + d.r);
        socket.broadcast.emit('set size', d);
    });

    socket.on('undo line', () => {
        socket.broadcast.emit('undo line', 0);
    });

    socket.on('clear canvas', () => {
        socket.broadcast.emit('clear canvas', 0);
    });

    socket.on('message', (msg) => {
        console.log(socket.name + ' said ' + msg);
        // Send the message to everyone.
        socket.broadcast.emit('message', {
            id: socket.number,
            message: msg
        });
    });

    socket.on('correct guess', () => {
        console.log(socket.name + ' guessed right!');
        // Send the message to everyone.
        io.sockets.emit('correct guess', socket.number);
    });

    socket.on('reboot server', () => {
        setupGame();
        console.log('Server rebooted.');
        io.sockets.emit('reboot', 0);
    });

    socket.on('disconnect', () => {
        // Remove the name from global players list.
        if (joined) {
            if (players.length === 1) {
                console.log('Nobody left.');
                setupGame();
            } else {
                players.splice(socket.number, 1);
                _.values(io.sockets.sockets).forEach(s => {
                    if (s.number > socket.number) s.number--
                });

                console.log('User ' + socket.name + ' (current ID #' + socket.number + ') has left');
                // Tell everyone that this user has left.
                socket.broadcast.emit('user left', {
                    name: socket.name,
                    number: socket.number
                });
                calcSkip();
            }
        }
    });
});