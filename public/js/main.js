"use strict";

// Socket for connections.
var socket = io();

// Game info.
var game = {
    timer: null,    // Timer for the game interval.
    draw: true,     // If this player can draw.
    word: '',       // The word being drawn.
    hideList: null, // List of the hidden characters of the word.
    correct: 0,     // Number of players who have correctly guessed.
    currentID: -1,  // The current player ID.
    myID: -1,       // This player's ID.
    mode: 0,        // The game mode: 0 = wait, 1 = choosing, 2 = draw.
    time: 0         // The current game time.
};

// Complete settings list.
var settings = {
    gamemode: 0,
    time_wait: 6,
    time_choose: 10,
    time_draw: 60,
    time_react: 8
};

// Player info.
var players = {
    name: '??',     // Player name.
    color: '',      // Player defining color.
    score: 0        // Player score, totalling points.
};

// Startup.
fadeIn('login');
document.getElementById('nameIn').focus();

// ----------------------------
// Game
// ----------------------------

function runCommand(arg) {
    switch (arg[0]) {
        case '/help':
            addMessage(null, 'Possible commands are:\nhelp, test, start, stop, freedraw, user, userlist');
            break;
        case '/start':
            socket.emit('start game', 0);
            break;
        case '/stop':
            socket.emit('stop game', 0);
            break;
        case '/gamemode':
            var mode = settings.gamemode;
            if (arg[1] === 'default')   mode = 0;
            else if (arg[1] === 'team') mode = 1;
            else if (arg[1] === 'vs')   mode = 2;
            else if (arg[1] === 'rate') mode = 3;
            if (settings.gamemode !== mode && game.currentID !== -1) {
                settings.gamemode = mode;
                socket.emit('settings', settings);
                addMessage(null, 'Gamemode changed.');
            }
            break;
        case '/user':
            addMessage(null, 'I am ' + players[game.myID].name + ', player number ' + game.myID);
            break;
        case '/listusers':
            addMessage(null, 'The users are: ' + players.map(function (p) {
                    return '<span style="color:' + p.color + '">' + p.name + '</span>';
                }));
            break;
        case '/listusersserver':
            socket.emit('list users', 0);
            addMessage(null, 'See server console');
            break;
        case '/reboot':
            socket.emit('reboot server', 0);
            break;
        default:
            addMessage(null, 'Unrecognized command\nTry /help for info');
    }
}

socket.on('start game', function () {
    document.getElementById('start').classList.add("going");
    game.draw = false;
    game.currentID = 0;
    game.timer = setInterval(timerStep, 1000);
});

socket.on('stop game', function () {
    document.getElementById('start').classList.remove("going");
    setInfo('Draw freely or start a game');
    if (game.mode === 1 && game.currentID === game.myID) fadeOut('worddiag');
    game.draw = true;
    game.currentID = -1;
    game.mode = 0;
    game.time = 0;
    draw.clear();
    fadeIn('tools');
    clearInterval(game.timer);
});

socket.on('settings', function (s) {
    settings = s;
});

socket.on('turn-wait', function turn_wait(next) {
    if (next !== 0) {
        addMessage(null, 'The word was: ' + game.word);
    }
    draw.dump();
    game.correct = 0;
    game.currentID += next;
    if (game.currentID >= players.length) {
        game.currentID = 0;
    }
    if (game.currentID === game.myID) {
        game.draw = true;
        setInfo("It's now your turn!");
        fadeIn('tools');
    } else {
        game.draw = false;
        setInfo("It's now " + players[game.currentID].name + "'s turn!");
        fadeOut('tools');
    }
    game.mode = 0;
    game.time = settings.time_wait;
    setTimer(game.time--);
});

socket.on('turn-choose', function turn_choose(words) {
    draw.reDraw();
    if (game.draw) {
        setInfo('Choose a word!');
        setChoose(words);
    } else {
        setInfo(players[game.currentID].name + ' is choosing!');
    }
    game.mode = 1;
    game.time = settings.time_choose;
    setTimer(game.time--);
});

socket.on('turn-draw', function turn_draw(word) {
    game.word = word;
    buildWord();
    game.mode = 2;
    game.time = settings.time_draw;
    setTimer(game.time--);
});

/**
 * Build up the word as time goes on.
 */
function buildWord() {
    // Hide elements by character type then split into an array.
    var chars = game.word.replace(/[aeiou]/ig, '♠').replace(/[a-z0-9]/ig, '♣').split('');

    if (game.draw) {
        fadeOut('worddiag');
        // Create a list of elements that can be revealed.
        game.hideList = chars.reduce(function (o, c) {
            if (c === '♣') {
                o.char.push(o.length);
            }
            o.length++;
            return o;
        }, {char: [], length: 0});
        setInfo('DRAW!!! Word: ' + game.word);
    } else {
        // Add all the visible and hidden elements to the output.
        var out = chars.reduce(function (o, c) {
            if (c === '♠' || c === '♣') {
                return o + "<span class='char b'> </span>";
            } else {
                return o + "<span class='char'>" + c + "</span>";
            }
        }, '');
        setInfo(out);
    }
}

socket.on('reveal char', function (i) {
    document.getElementById('info').children[i].innerHTML = game.word.split('')[i];
});

function timerStep() {
    if (game.time >= 0) {
        // Decrement the time if not passed zero.
        setTimer(game.time--);
        if (game.draw && game.hideList !== null) {
            // Potentially show another letter.
            if (game.time < settings.time_draw * game.hideList.char.length / game.hideList.length) {
                socket.emit('reveal char', game.hideList.char.splice(Math.random() * game.hideList.char.length, 1));
            }
        }
    }
    else if (game.draw) {
        if (game.mode === 0) {
            // Waiting for next turn ended.
            socket.emit('turn-choose', 0);
        }
        else if (game.mode === 1) {
            // Selecting word ended (auto select by ID -1).
            socket.emit('turn-draw', -1);
        }
        else if (game.mode === 2) {
            // Guessing out of time (increment current player by 1).
            socket.emit('turn-wait', 1);
        }
    }
}

socket.on('correct guess', function (id) {
    if (game.time > settings.time_react) {
        game.hideList = null;
        game.time = settings.time_react;
    }
    if (game.correct++ === 0) {
        updateScore(game.currentID, 2);
    }
    updateScore(id, Math.floor(5 / game.correct));
    addMessage(id, ' guessed the word!');
});

socket.on('setup', function (p) {
    players = p;
    game.myID = p.length - 1;
    document.getElementById("users").innerHTML = '';
    for (var i = 0; i < players.length; i++) {
        addUser(i);
    }
});

socket.on('reboot', function () {
    location.reload();
});

// ----------------------------
// Info Section
// ----------------------------

function setTimer(text) {
    document.getElementById('timer').textContent = text;
}

function setInfo(text) {
    document.getElementById('info').innerHTML = text;
}

function setChoose(words) {
    document.getElementById('word1').value = words[0];
    document.getElementById('word2').value = words[1];
    document.getElementById('word3').value = words[2];
    fadeIn('worddiag');
}

// ----------------------------
// Draw Section
// ----------------------------

var mouseDown; // Remember if down and already drawing.
/**
 * Mouse button was pressed.
 * @type event
 */
canvas.onmousedown = canvas.ontouchstart = function onDown(e) {
    if (draw.reScale) {
        refreshOff();
        return false;
    }
    if (game.draw) {
        var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        if (e.button === 2) {
            if (mouseDown) {
                draw.fill(game.myID);
                emitMouse(3, mouseX, mouseY);
            } else {
                draw.bucket(mouseX, mouseY, game.myID);
                emitMouse(4, mouseX, mouseY);
            }
            mouseDown = false;
        } else {
            mouseDown = true;
            emitMouse(0, mouseX, mouseY);
            draw.down(mouseX, mouseY, game.myID);
        }

    }
    return false;
};

/**
 * Mouse was dragged.
 * @type event
 */
canvas.onmousemove = canvas.ontouchmove = function onMove(e) {
    if (game.draw) {
        if (!mouseDown) return;

        var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        emitMouse(1, mouseX, mouseY);
        draw.drag(mouseX, mouseY, game.myID);
    } else if (mouseDown) {
        onUp();
    }
};

/**
 * Mouse button was released.
 * @type event
 */
canvas.onmouseup = canvas.ontouchend = function onUp() {
    if (game.draw) {
        if (mouseDown) {
            mouseDown = false;
            emitMouse(2, 0, 0);
            draw.up(game.myID);
        }
    }
};

/**
 * Capture all key presses.
 */
document.onkeypress = function (e) {
    var key = e.charCode || e.keyCode;
    // Check keys for colors.
    if (document.activeElement.type !== 'text' && document.activeElement.type !== 'number') {
        if ((key >= 48 && key <= 57 || key === 45) && game.draw) {
            document.getElementById("r" + String.fromCharCode(key)).checked = true;
            setDrawColor(document.querySelector("label[for=r" + String.fromCharCode(key) + "]").style.backgroundColor);
        } else if (key === 47) {
            document.getElementById("guessIn").focus();
            return false;
        }
    }
};

/**
 * Color changed.
 * @param val : color to set
 */
function setDrawColor(val) {
    draw.setColor(val, game.myID);
    socket.emit('set color', {c: val, l: game.myID});
}
// Add event to all swatch buttons.
var inputColor = document.querySelectorAll("input[name=color]");
for (var x = 0; x < inputColor.length; x++) {
    inputColor[x].onchange = function () {
        setDrawColor(document.querySelector("label[for=" + this.id + "]").style.backgroundColor);
    }
}

/**
 * Size changed.
 * @param val : number size to set
 */
function setDrawSize(val) {
    draw.setRadius(val, game.myID);
    socket.emit('set size', {r: val, l: game.myID});
}
/**
 * Mouse was scrolled to change size.
 */
canvas.addEventListener((/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel", function (e) {
    if (mouseDown) return;
    var inputSize = document.getElementById('sizeIn');
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    var val = parseInt(inputSize.value) + delta * 2;

    if (val === 0 || val === 42) return;
    inputSize.value = val;
    setDrawSize(val);
}, false);

/**
 * Undo button clicked.
 */
document.getElementById('undo').onclick = function () {
    draw.undo();
    socket.emit('undo line', 0);
};

/**
 * Clear button clicked.
 */
document.getElementById('clear').onclick = function () {
    draw.clear();
    socket.emit('clear canvas', 0);
};

var refreshTime;
draw.reScale = false;
var refresh = document.getElementById("refresh");
/**
 * Turn on the refresh button and set a resize timer for 2s.
 */
function refreshOn() {
    draw.reScale = true;
    refresh.style.display = "block";
    if (draw.getWidth() === canvas.clientWidth) {
        draw.reScale = false;
        refresh.style.display = "none";
    }
    clearTimeout(refreshTime);
    refreshTime = setTimeout(refreshOff, 2000);
}
refresh.onclick = refreshOff;
/**
 * Turn OFF the refresh and resize the canvas.
 */
function refreshOff() {
    draw.reScale = false;
    draw.resize(true);
    refresh.style.display = "none";
}

document.getElementById('start').onclick = function () {
    if (this.classList.contains("going")) {
        socket.emit('stop game', 0);
    } else {
        socket.emit('start game', 0);
    }
    return false;
};

/**
 * Send a point to the server.
 * @param type
 * @param x
 * @param y
 */
function emitMouse(type, x, y) {
    socket.emit('point', {
        t: type,
        x: x / draw.getWidth(),
        y: y / draw.getHeight(),
        l: game.myID
    });
}

/**
 * Add a point according to type.
 */
socket.on('point', function (p) {
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

// ----------------------------
// Chat Section
// ----------------------------

/**
 * Add list user element.
 * @param id
 */
function addUser(id) {
    var node = document.createElement("li");
    node.innerHTML = '<span style="color:' + players[id].color + '">'
        + (game.myID === id ? 'You' : players[id].name) + '</span>' + '<div>0 PTS</div>';
    document.getElementById("users").appendChild(node);
}

/**
 * Update the score of a user.
 * @param num
 * @param amount
 */
function updateScore(num, amount) {
    players[num].score += amount;
    document.getElementById("users").childNodes[num].lastChild.innerHTML = players[num].score + ' PTS';
}

/**
 * Remove list user element.
 * @param num
 */
function removeUser(num) {
    var nodes = document.getElementById("users");
    nodes.removeChild(nodes.childNodes[num]);
}

/**
 * Add list message element.
 * @param id
 * @param text
 */
function addMessage(id, text) {
    var node = document.createElement("li");
    node.innerHTML = (id !== null ? ('<span style="color:' + players[id].color + '">' + (game.myID === id ? 'You' : players[id].name) + '</span>') : '') + text;
    document.getElementById("messages").appendChild(node);
}

/**
 * Output a chat message.
 * @returns {boolean} Stop form submit.
 */
document.getElementById("gform").onsubmit = function () {
    var guessBox = document.getElementById("guessIn");

    if (guessBox.value.charAt(0) === '/') {
        runCommand(guessBox.value.split(' '));
    } else if (guessBox.value !== '') {
        if (guessBox.value.toLowerCase() === game.word.toLowerCase() && !game.draw) {
            socket.emit('correct guess');
        } else {
            addMessage(game.myID, ': ' + guessBox.value);
            socket.emit('message', guessBox.value);
        }
    }

    guessBox.value = '';
    return false;
};

/**
 * Getting a chat message.
 */
socket.on('message', function (data) {
    addMessage(data.id, ': ' + data.message);
});

/**
/**
 * A user connected.
 */
socket.on('user joined', function (p) {
    if (players[0] === undefined) {
        return;
    }
    players.push(p);
    addUser(players.length - 1);
    addMessage(players.length - 1, ' has joined.');
});

/**
 * A user disconnected.
 */
socket.on('user left', function (data) {
    if (players[0] === undefined) {
        return;
    }
    removeUser(data.number);
    addMessage(data.number, ' has left.');
    players.splice(data.number, 1);
    draw.spliceLayer(data.number);
    if (data.number < game.myID) {
        game.myID--;
        if (game.currentID >= players.length) {
            game.currentID = 0;
        }
        if (game.currentID === game.myID) {
            socket.emit('turn-wait', 0);
        }
    }
});

/**
 * Resize the game when the window is resized.
 */
window.onresize = resize;

// ----------------------------
// Choose Pane
// ----------------------------

/**
 * A word was chosen.
 * @returns {boolean} stop form submit
 */
document.getElementById('worddiag').onsubmit = function () {
    var val = document.activeElement.value.trim();
    if (val.length) {
        if (game.currentID === game.myID) socket.emit('turn-draw', val);
        fadeOut('worddiag');
    }
    return false;
};

// ----------------------------
// Login Pane
// ----------------------------

/**
 * Player's name submitted.
 * @returns {boolean} stop form submit
 */
document.getElementById('lform').onsubmit = function () {
    var name = document.getElementById('nameIn').value;
    if (name !== '' && name.toLowerCase() !== 'you') {
        players.name = name;
        players.color = randRGB();
        socket.emit('add user', players);
        fadeOut("logo");
        fadeOut("login");
        fadeIn("game");
        resize();
    }
    return false;
};