import * as game from './game'
import * as d from './data'
import {addUser, updateScore, removeUser, addMessage} from './view'

let socket = io(); // Socket for connections.

export function sockEmit(type, data) {
    socket.emit(type, data)
}

export function socketeer() {
    socket.on('settings', function (s) {
        d.setSettings(s);
    });

    socket.on('get skip', function (skip) {
        addMessage(null, 'Skipping ' + skip + ' points at a time.')
    });

    socket.on('start game', game.start);

    socket.on('stop game', game.stop);

    socket.on('turn-wait', game.turn_wait);

    socket.on('turn-choose', game.turn_choose);

    socket.on('turn-draw', game.turn_draw);

    socket.on('reveal char', function (i) {
        document.getElementById('info').children[i].innerHTML = d.game.word.split('')[i];
    });

    socket.on('correct guess', function (id) {
        // Pull down time to the reaction time for guessing.
        if (d.game.time > d.settings.time_react) {
            d.game.hideList = null;
            d.game.time = d.settings.time_react;
        }
        // Give points to player drawing on first correct.
        if (d.game.allDone++ === 0) {
            updateScore(d.game.currentID, 2);
        }
        // Update score of the player that is correct with relative points.
        updateScore(id, Math.floor(5 / d.game.allDone));
        addMessage(id, ' guessed the word!');
    });

    socket.on('setup', function (p) {
        p[p.length] = d.players;  // Add this player to list.
        d.setPlayers(p)           // Save players.
        d.game.myID = p.length - 1;
        document.getElementById("users").innerHTML = '';
        for (var i = 0; i < d.players.length; i++) {
            addUser(i);
        }
    });

    /**
     * Reload all clients after reboot.
     */
    socket.on('reboot', function () {
        location.reload();
    });

    /**
     * Add a point according to type.
     * @param p
     */
    socket.on('p', function (p) {
        switch (p.t) {
            case 0:
                draw.down(p.x * draw.getWidth(), p.y * draw.getHeight(), p.l);
                break;
            case 1:
                draw.drag(p.x * draw.getWidth(), p.y * draw.getHeight(), p.l);
                break;
            case 2:
                draw.up(p.l);
                break;
            case 3:
                draw.fill(p.l);
                break;
            case 4:
                draw.bucket(p.x * draw.getWidth(), p.y * draw.getHeight(), p.l);
                break;
        }
    });

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
        d.players[d.players.length] = p;

        // List in interface and leave message.
        addUser(d.players.length - 1);
        addMessage(d.players.length - 1, ' has joined.');
    });

    /**
     * A user disconnected.
     */
    socket.on('user left', function (data) {
        // Remove from interface and leave message.
        removeUser(data.number);
        addMessage(data.number, ' has left.');

        // Cut the player out.
        d.players.splice(data.number, 1);
        draw.spliceLayer(data.number);

        // Fix IDs and change turn if needed,
        if (d.game.myID > data.number) {
            d.game.myID--;
        }
        if (d.game.currentID >= data.number) {
            if (d.game.currentID >= d.players.length) {
                d.game.currentID = 0;
            }
            if (d.game.currentID === d.game.myID) {
                sockEmit('turn-wait', 0);
            }
        }
    });
}