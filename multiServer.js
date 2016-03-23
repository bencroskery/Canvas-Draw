"use strict";

// NOT READY FOR USE.
// ------------------

// Setup express server.
var cluster = require("cluster"),
    fs = require('fs'),
    _ = require('lodash');
var port = process.env.PORT || 3000;

var players,    // List of the names of the users.
    words = [], // Words the drawer is asked to choose from.
    wordList;   // The full list of all words.

/**
 * Setup all game variables (used for reset).
 */
function setupGame() {
    players = [];
    wordList = fs.readFileSync('words.txt').toString().split("\n");
}
setupGame();

/**
 * Generate 3 an array of 3 words from the list.
 */
function generateWords() {
    words = _.sampleSize(wordList, 3);
}

if (cluster.isMaster) {
    let workers = [];
    let CPUs = require('os').cpus().length;
    for (let i = 0; i < CPUs; i++) {
        let worker = cluster.fork();

        worker.on('message', (msg) => {
            console.log('Received messsage');
            for (let i = 0; i < workers.length; i++) {
                workers[i].send(msg);
            }
        });

        workers[i] = worker;
    }

    cluster.on('fork', (worker) => {
        console.log("Forked worker " + worker.process.pid);
    });

    cluster.on('listening', (worker, address) => {
        console.log("Worker " + worker.process.pid + " is now connected to port " + address.port);
    });

    cluster.on('exit', (worker) => {
        console.log("Worker " + worker.process.pid + " died");
        if (!worker.suicide) {
            console.log("Forked new worker " + worker.process.pid);
            cluster.fork();
        }
    });
} else {
    var http = require('http'),
        express = require('express'),
        app = express(),
        server = http.createServer(app),
        io = require('socket.io')(server),
        redis = require('socket.io-redis');

    http.globalAgent.maxSockets = Infinity;
    io.adapter(redis({host: 'localhost', port: 6379}));

    // Folder holding all client pages.
    app.use(express.static(__dirname + '/public'));

    // Start listening on the port.
    server.on('error', (e) => console.log('Another process is already using port ' + port));
    server.listen(port, () => console.log('Server listening on port ' + port));

    process.on('message', (msg) => {
        if (msg.name) {
            console.log('Add player.');
            players.push(msg);
        } else if (msg.disc) {
            console.log('Remove player.');
            players.splice(msg.disc, 1);
        }
    });

    io.on('connection', function (socket) {
        console.log('Socket handled by worker #' + process.pid);
        var joined = false;

        socket.on('add user', function (player) {
            // Add the user.
            socket.number = players.length;
            socket.name = player.name;
            joined = true;

            // Tell everyone that this user has joined.
            console.log('User ' + player.name + ' has joined');
            socket.emit('setup', players);
            socket.broadcast.emit('user joined', player);
            process.send(player);
        });

        socket.on('list users', function () {
            console.log('Number of players: ' + players.length);
            console.log(players.map(p => p.name));
        });

        socket.on('start game', function () {
            console.log('Game started!');
            io.sockets.emit('start game', 0);
            io.sockets.emit('turn-wait', 0);
            generateWords();
        });

        socket.on('stop game', function () {
            console.log('Game stopped!');
            io.sockets.emit('stop game', 0);
        });

        socket.on('settings', function (s) {
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
            if (word === -1) word = _.sample(wordList); // Generate Word.
            io.sockets.emit('turn-draw', word);
        });

        socket.on('reveal char', function (i) {
            socket.broadcast.emit('reveal char', i);
        });

        socket.on('p', function (point) {
            socket.broadcast.emit('p', point);
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

        socket.on('allDone guess', function () {
            console.log(socket.name + ' guessed right!');
            // Send the message to everyone.
            io.sockets.emit('allDone guess', socket.number);
        });

        socket.on('reboot server', function () {
            //setupGame();
            console.log('Server rebooted.');
            io.sockets.emit('reboot', 0);
        });

        socket.on('disconnect', function () {
            // Remove the name from global players list.
            if (joined) {
                console.log('User ' + socket.name + ' (current ID #' + socket.number + ') has left');
                socket.broadcast.emit('user left', {
                    name: socket.name,
                    number: socket.number
                });
                process.send({disc: socket.number});
            }
        });
    });
}