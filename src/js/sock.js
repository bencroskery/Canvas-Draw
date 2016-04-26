import * as game from './game'
import * as d from './data'
import Players from './components/players'
import Chat from './components/chat'

let socket = io(); // Socket for connections.

export function sockEmit(type, data) {
    socket.emit(type, data)
}

export function socketeer() {
    socket.on('settings', function (s) {
        d.setSettings(s);
    });

    socket.on('get skip', function (skip) {
        Chat.addMessage('Skipping ' + skip + ' points at a time.')
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
            Players.updateScore(d.game.currentID, 2);
        }
        // Update score of the player that is correct with relative points.
        Players.updateScore(id, Math.floor(5 / d.game.allDone));
        Chat.addMessage(' guessed the word!', Players.get(id));
    });

    socket.on('setup', function (p) {
        p.push(Players.get());    // Add this player to list.
        Players.set(p)  ;         // Save players.
        d.game.myID = p.length - 1;
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
        Chat.addMessage(': ' + data.message, Players.get(data.id));
    });


    /**
     * A user connected.
     */
    socket.on('user joined', function (p) {
        Chat.addMessage(' has joined.', p);

        // Add the player in.
        Players.add(p);
    });

    /**
     * A user disconnected.
     */
    socket.on('user left', function (data) {
        Chat.addMessage(' has left.', Players.get(data.number));

        // Pull the player out.
        Players.remove(data.number);

        // Cut the drawing layer out.
        draw.spliceLayer(data.number);

        // Fix IDs and change turn if needed,
        if (d.game.myID > data.number) {
            d.game.myID--;
        }
        if (d.game.currentID >= data.number) {
            if (d.game.currentID >= Players.length()) {
                d.game.currentID = 0;
            }
            if (d.game.currentID === d.game.myID) {
                sockEmit('turn-wait', 0);
            }
        }
    });
}