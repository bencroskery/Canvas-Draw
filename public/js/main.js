"use strict";

// Main Variables.
var socket = io(),
    TIME_WAIT = 6,
    TIME_DRAW = 60;

// Game info.
var game = {
    running: false,     // Whether the game has been started.
    word: '',           // The word being drawn.
    currentPlayer: 0,   // The current player ID.
    mode: 0,            // The game mode: 0 = wait, 1 = choosing word, 2 = draw.
    time: 0             // The current game time.
};

// User info.
var player = {
        name: '??',     // The name of the player.
        number: -1,     // The ID number of the player.
        mode: -1        // The mode of the player: 0 = guessing, 1 = drawing.
    },
    playerNames = [];   // Names of all players in the lobby.

// Startup.
fadeOut('loading');
fadeIn('login');
document.getElementById('nameIn').focus();

// ----------------------------
// Game
// ----------------------------

function runCommand(arg) {
    switch (arg[0]) {
        case '/help':
            addMessage('Possible commands are:\nhelp, test, start, stop, freedraw, user, userlist');
            break;
        case '/test':
            addMessage('You said: ' + arg[1]);
            break;
        case '/start':
            socket.emit('start game', 0);
            addMessage('You started the game');
            break;
        case '/stop':
            socket.emit('stop game', 0);
            addMessage('You stopped the game');
            break;
        case '/freedraw':
            game.running = true;
            player.mode = 1;
            game.mode = 2;
            addMessage('Free drawing activated');
            break;
        case '/user':
            addMessage('I am ' + player.name + ' player number ' + player.number);
            break;
        case '/userlist':
            addMessage('The users are: ' + playerNames);
            break;
        case '/userlistserver':
            socket.emit('list users', 0);
            addMessage('See server console');
            break;
        case '/reboot':
            socket.emit('reboot server', 0);
            break;
        default:
            addMessage('Unrecognized command\nTry /help for info');
    }
}

socket.on('start game', function () {
    setInfo('START THE GAME!!!');
    player.mode = 0;
    game.running = true;
    game.currentPlayer = 0;
    timer();
});

socket.on('stop game', function () {
    setInfo('Use /start to start the game');
    player.mode = 1;
    game.running = false;
    game.currentPlayer = 0;
    game.mode = 0;
    game.time = 0;
    setTimer('-');
    draw.clear();
    fadeIn('tools');
});

socket.on('turn-wait', function (next) {
    draw.clear();
    game.currentPlayer += next;
    if (game.currentPlayer >= playerNames.length) {
        game.currentPlayer = 0;
    }
    if (game.currentPlayer === player.number) {
        player.mode = 1;
        setInfo("It's now your turn!");
        fadeIn('tools');
    } else {
        player.mode = 0;
        setInfo("It's now " + playerNames[game.currentPlayer] + "'s turn!");
        fadeOut('tools');
    }
    game.mode = 0;
    game.time = TIME_WAIT;
});

socket.on('turn-choose', function (words) {
    if (player.mode == 1) {
        setInfo('Choose a word!');
        setChoose(words);
    } else {
        setInfo(playerNames[game.currentPlayer] + ' is choosing!');
    }
    game.mode = 1;
    game.time = TIME_WAIT;
});

socket.on('turn-draw', function (word) {
    game.word = word;
    if (player.mode == 1) {
        fadeOut('worddiag');
        setInfo('DRAW!!! Word: ' + game.word);
    } else {
        setInfo('Guess! ' + game.word.replace(/[^ '-.]/g, " _").replace(' ', '   '));
    }
    game.mode = 2;
    game.time = TIME_DRAW;
});

function timer() {
    setTimer(game.time--);
    setInterval(function () {
        if (!game.running) {
            return;
        }
        setTimer(game.time);
        if (game.time !== 0) {
            game.time--;
        }
        else if (player.mode === 1) {
            if (game.mode === 0) {
                // Waiting for next turn ended.
                socket.emit('turn-choose', 0);
            }
            else if (game.mode == 1) {
                // Selecting word ended (auto select).
                socket.emit('turn-draw', -1);
            }
            else if (game.mode == 2) {
                // Guessing out of time.
                socket.emit('turn-wait', 1);
            }
        }
    }, 1000);
}

socket.on('correct guess', function (name) {
    if (game.time > 8) {
        game.time = 8;
    }
    addMessage(name + ' guessed the word!');
});

socket.on('setup', function (names) {
    playerNames = names;
    player.number = playerNames.length - 1;
    document.getElementById("users").innerHTML = '';
    for (var i = 0; i < playerNames.length; i++) {
        addUser(playerNames[i]);
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
    document.getElementById('info').textContent = text;
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
canvas.onmousedown = canvas.ontouchstart = function (e) {
    var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
    var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        if (e.button === 2) {
            if (mouseDown) {
                mouseDown = false;
                draw.fill(player.number);
                emitMouse(3, mouseX, mouseY);
            } else {
                draw.bucket(mouseX, mouseY, player.number);
                emitMouse(4, mouseX, mouseY);
            }
        } else {
            mouseDown = true;
            emitMouse(0, mouseX, mouseY);
            draw.down(mouseX, mouseY, WIDTH, player.number);
        }

    }
    return false;
};

/**
 * Mouse was dragged.
 * @type event
 */
canvas.onmousemove = canvas.ontouchmove = function (e) {
    if (!mouseDown) {
        return;
    }
    var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
    var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        emitMouse(1, mouseX, mouseY);
        draw.drag(mouseX, mouseY, player.number);
    }
};

/**
 * Mouse button was released.
 * @type event
 */
canvas.onmouseup = canvas.ontouchend = function (e) {
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        if (e.button !== 2 && mouseDown) {
            mouseDown = false;
            emitMouse(2, 0, 0);
            draw.up(player.number);
        }
    }
};

/**
 * Capture all key presses.
 */
document.onkeypress = function () {
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        var key = event.charCode || event.keyCode;
        // Check keys for colors.
        if ((key >= 48 && key <= 57 || key === 45) && document.activeElement.id !== "guessIn") {
            document.getElementById("r" + String.fromCharCode(key)).checked = true;
            setDrawColor(document.querySelector("label[for=r" + String.fromCharCode(key) + "]").style.backgroundColor);
        } else {
            document.getElementById("guessIn").focus();
        }
    }
};

/**
 * Color changed.
 * @param val : color to set
 */
function setDrawColor(val) {
    draw.setColor(val, player.number);
    socket.emit('set color', {c: val, l: player.number});
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
 * @param val : size to set
 */
function setDrawSize(val) {
    draw.setRadius(val, player.number);
    socket.emit('set size', {r: val, l: player.number});
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
document.getElementById('undobtn').addEventListener('click', function () {
    draw.undo();
    socket.emit('undo line', 0);
});

/**
 * Clear button clicked.
 */
document.getElementById('clearbtn').addEventListener('click', function () {
    draw.clear();
    socket.emit('clear canvas', 0);
});

/**
 * Send a point to the server.
 * @param type
 * @param x
 * @param y
 */
function emitMouse(type, x, y) {
    socket.emit('point', {
        t: type,
        x: x / draw.getWidth() * WIDTH,
        y: y / draw.getHeight() * WIDTH,
        l: player.number
    });
}

/**
 * Add a point according to type.
 */
socket.on('point', function (p) {
    switch (p.t) {
        case 0:
            draw.down(p.x * draw.getWidth() / WIDTH, p.y * draw.getHeight() / WIDTH, WIDTH, p.l);
            break;
        case 1:
            draw.drag(p.x * draw.getWidth() / WIDTH, p.y * draw.getHeight() / WIDTH, p.l);
            break;
        case 2:
            draw.up(p.l);
            break;
        case 3:
            draw.fill(p.l);
            break;
        case 4:
            draw.bucket(p.x * draw.getWidth() / WIDTH, p.y * draw.getHeight() / WIDTH, p.l);
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
 * @param text
 */
function addUser(text) {
    var node = document.createElement("li");
    node.appendChild(document.createTextNode(text));
    document.getElementById("users").appendChild(node);
}

/**
 * Remove list user element.
 * @param num
 */
function removeUser(num) {
    var nodes = document.querySelectorAll("#users li");
    console.log(nodes);
    console.log(num + " " + nodes.length);
    document.getElementById("users").removeChild(nodes[num]);
}

/**
 * Add list message element.
 * @param text
 */
function addMessage(text) {
    var node = document.createElement("li");
    node.appendChild(document.createTextNode(text));
    document.getElementById("messages").appendChild(node);
}

/**
 * Output a chat message.
 * @returns {boolean} stop form submit
 */
document.getElementById("gform").onsubmit = function () {
    var guessBox = document.getElementById("guessIn");

    if (guessBox.value.charAt(0) == '/') {
        runCommand(guessBox.value.split(' '));
    } else if (guessBox.value !== '') {
        if (guessBox.value.toLowerCase() === game.word.toLowerCase() && player.mode === 0) {
            socket.emit('correct guess', 0);
        } else {
            addMessage(player.name + ': ' + guessBox.value);
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
    addMessage(data.name + ': ' + data.message);
});

/**
 * A user connected.
 */
socket.on('user joined', function (name) {
    addUser(name);
    addMessage(name + ' has joined.');
    playerNames.push(name);
});

/**
 * A user disconnected.
 */
socket.on('user left', function (data) {
    removeUser(data.number);
    addMessage(data.name + ' has left.');
    playerNames.splice(data.number, 1);
    draw.spliceLayer(data.number);
    if (data.number < player.number) {
        player.number--;
        if (game.currentPlayer >= playerNames.length) {
            game.currentPlayer = 0;
        }
        if (game.currentPlayer === player.number) {
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
        socket.emit('turn-draw', val);
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
    if (name !== '') {
        player.name = name;
        socket.emit('add user', name);
        fadeOut("login");
        fadeIn("game");
        resize();
    }
    return false;
};

/**
 * Fade an element out.
 * @param id
 */
function fadeOut(id) {
    var s = document.getElementById(id).style;
    var val = s.opacity = 1;
    (function fade() {
        s.opacity = (val -= .1).toFixed(1);
        val <= 0.1 ? s.display = "none" : setTimeout(fade, 40);
    })();
}

/**
 * Fade an element in.
 * @param id
 */
function fadeIn(id) {
    var s = document.getElementById(id).style;
    var val = s.opacity = 0;
    s.display = "inherit";
    (function fade() {
        s.opacity = (val += .1);
        val < 0.9 ? setTimeout(fade, 40) : 0;
    })();
}

function openMenu(el) {
    var cName = el.className;
    if (cName.substring(cName.length - 4, cName.length) === "open") {
        el.className = cName.substring(0, cName.length - 5);
        fadeOut('options');
    } else {
        el.className += " open";
        fadeIn('options');
    }
}