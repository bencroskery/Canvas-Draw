"use strict";

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
            addMessage(null, 'Possible commands are:\nhelp, start, stop, gamemode, user, listusers');
            break;
        case '/start':
            sockEmit('start game', 0);
            break;
        case '/stop':
            sockEmit('stop game', 0);
            break;
        case '/gamemode':
            var mode = settings.gamemode;
            if (arg[1] === 'default')   mode = 0;
            else if (arg[1] === 'team') mode = 1;
            else if (arg[1] === 'vs')   mode = 2;
            else if (arg[1] === 'rate') mode = 3;
            if (settings.gamemode !== mode && game.currentID === -1) {
                settings.gamemode = mode;
                sockEmit('settings', settings);
                addMessage(null, 'Gamemode: ' + arg[1]);
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
            sockEmit('list users', 0);
            addMessage(null, 'See server console');
            break;
        case '/getskip':
            sockEmit('get skip', 0);
            break;
        case '/reboot':
            sockEmit('reboot server', 0);
            break;
        case '/export':
            window.open('data:text/html,' + encodeURIComponent(draw.exportSVG(arg[1])));
            break;
        default:
            addMessage(null, 'Unrecognized command\nTry /help for info');
    }
}

function start() {
    document.getElementById('start').classList.add("going");
    game.draw = false;
    game.currentID = 0;
    game.timer = setInterval(timerStep, 1000);
}

function stop() {
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
}

function turn_wait(next) {
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
}

function turn_choose(words) {
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
}

function turn_draw(word) {
    game.word = word;
    buildWord();
    game.mode = 2;
    game.time = settings.time_draw;
    setTimer(game.time--);
}

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

/**
 * Main game timer loop.
 */
function timerStep() {
    if (game.currentID === -1) {
        // Should not be running a timer step if the game is stopped.
        console.log('Halt timer.');
        clearInterval(game.timer);
    }

    if (game.time >= 0) {
        // Decrement the time if not passed zero.
        setTimer(game.time--);
        if (game.draw && game.hideList !== null) {
            // Potentially show another letter.
            if (game.time + 1 < settings.time_draw * game.hideList.char.length / game.hideList.length) {
                sockEmit('reveal char', game.hideList.char.splice(Math.random() * game.hideList.char.length, 1));
            }
        }
    }
    else if (game.draw) {
        if (game.mode === 0) {
            // Waiting for next turn ended.
            sockEmit('turn-choose', 0);
        }
        else if (game.mode === 1) {
            // Selecting word ended (auto select by ID -1).
            sockEmit('turn-draw', -1);
        }
        else if (game.mode === 2) {
            // Guessing out of time (increment current player by 1).
            sockEmit('turn-wait', 1);
        }
    }
}

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
    try {
        document.getElementById('word1').value = words[0];
        document.getElementById('word2').value = words[1];
        document.getElementById('word3').value = words[2];
        fadeIn('worddiag');
    }
    catch (e) {
        console.debug("Setting up word dialog -> " + e);
    }
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
    if (game.draw) {
        var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        if (e.button === 2) {
            if (mouseDown) {
                draw.fill(game.myID);
                emitPoint(3, mouseX, mouseY);
            } else {
                draw.bucket(mouseX, mouseY, game.myID);
                emitPoint(4, mouseX, mouseY);
            }
            mouseDown = false;
        } else {
            mouseDown = true;
            emitPoint(0, mouseX, mouseY);
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
    if (game.draw && mouseDown) {
        var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        emitPoint(1, mouseX, mouseY);
        draw.drag(mouseX, mouseY, game.myID);
    } else if (mouseDown) {
        onUp();
    }
};

/**
 * Mouse button was released.
 * @type event
 */
window.onmouseup = canvas.ontouchend = function onUp() {
    if (game.draw && mouseDown) {
        mouseDown = false;
        emitPoint(2, 0, 0);
        draw.up(game.myID);
    }
};

/**
 * Send a point to the server.
 * @param type
 * @param x
 * @param y
 */
function emitPoint(type, x, y) {
    sockEmit('p', {
        t: type,
        x: (x / draw.getWidth()).toFixed(8),
        y: (y / draw.getHeight()).toFixed(8),
        l: game.myID
    });
}

/**
 * Add a point according to type.
 * @param p
 */
function getPoint(p) {
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
}

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
    sockEmit('set color', {c: val, l: game.myID});
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
    sockEmit('set size', {r: val, l: game.myID});
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
    sockEmit('undo line', 0);
};

/**
 * Clear button clicked.
 */
document.getElementById('clear').onclick = function () {
    draw.clear();
    sockEmit('clear canvas', 0);
};

/**
 * Start button clickled.
 */
document.getElementById('start').onclick = function () {
    if (this.classList.contains("going"))
        sockEmit('stop game', 0);
    else
        sockEmit('start game', 0);
    return false;
};

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
        if (guessBox.value.trim().toLowerCase() === game.word.toLowerCase() && !game.draw) {
            sockEmit('correct guess');
        } else {
            addMessage(game.myID, ': ' + guessBox.value);
            sockEmit('message', guessBox.value);
        }
    }

    guessBox.value = '';
    return false;
};

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
        if (game.currentID === game.myID) sockEmit('turn-draw', val);
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
        sockEmit('add user', players);
        fadeOut("logo");
        fadeOut("login");
        fadeIn("game");
        resize();
    }
    return false;
};