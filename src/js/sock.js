"use strict";

var socket = io(); // Socket for connections.

function sockEmit(type, data) {
    socket.emit(type, data)
}

function socketeer() {
    socket.on('settings', function (s) {
        settings = s;
    });

    socket.on('get skip', function (skip) {
        addMessage(null, 'Skipping ' + skip + ' points at a time.')
    });

    socket.on('start game', start);

    socket.on('stop game', stop);

    socket.on('turn-wait', turn_wait);

    socket.on('turn-choose', turn_choose);

    socket.on('turn-draw', turn_draw);

    socket.on('reveal char', function (i) {
        document.getElementById('info').children[i].innerHTML = game.word.split('')[i];
    });

    socket.on('correct guess', function (id) {
        // Pull down time to the reaction time for guessing.
        if (game.time > settings.time_react) {
            game.hideList = null;
            game.time = settings.time_react;
        }
        // Give points to player drawing on first correct.
        if (game.allDone++ === 0) {
            updateScore(game.currentID, 2);
        }
        // Update score of the player that is correct with relative points.
        updateScore(id, Math.floor(5 / game.allDone));
        addMessage(id, ' guessed the word!');
    });

    socket.on('setup', function (p) {
        p[p.length] = players;  // Add this player to list.
        players = p;            // Save players.
        game.myID = p.length - 1;
        document.getElementById("users").innerHTML = '';
        for (var i = 0; i < players.length; i++) {
            addUser(i);
        }
    });

    socket.on('reboot', function () {
        location.reload();
    });


    socket.on('p', getPoint);

    /**
     * Set the drawing color.
     */
    socket.on('set color', function (d) {
        draw.setColor(d.c, d.l);
    });

    /**
     * Set the drawing size.
     */
    socket.on('set size', function (d) {
        draw.setRadius(d.r, d.l);
    });

    /**
     * Undo the last drawn line.
     */
    socket.on('undo line', function () {
        draw.undo();
    });

    /**
     * Clear the canvas of lines.
     */
    socket.on('clear canvas', function () {
        draw.clear();
    });

    /**
     * Getting a chat message.
     */
    socket.on('message', function (data) {
        addMessage(data.id, ': ' + data.message);
    });


    /**
     * A user connected.
     */
    socket.on('user joined', function (p) {
        // Add the player in.
        players[players.length] = p;

        // List in interface and leave message.
        addUser(players.length - 1);
        addMessage(players.length - 1, ' has joined.');
    });

    /**
     * A user disconnected.
     */
    socket.on('user left', function (data) {
        // Cut the player out.
        players.splice(data.number, 1);
        draw.spliceLayer(data.number);

        // Remove from interface and leave message.
        removeUser(data.number);
        addMessage(data.number, ' has left.');

        // Fix IDs and change turn if needed,
        if (game.myID > data.number) {
            game.myID--;
        }
        if (game.currentID >= data.number) {
            if (game.currentID >= players.length) {
                game.currentID = 0;
            }
            if (game.currentID === game.myID) {
                sockEmit('turn-wait', 0);
            }
        }
    });
}