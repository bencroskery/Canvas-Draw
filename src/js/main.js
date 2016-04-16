import {socketeer, sockEmit} from './sock'
import * as tools from './tools'
import * as d from './data'
import {addMessage, setInfo} from './view'
import {playMusic, stopMusic} from './sound'

// Startup.
tools.fadeIn('login');
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
            var mode = d.settings.gamemode;
            if (arg[1] === 'default')   mode = 0;
            else if (arg[1] === 'team') mode = 1;
            else if (arg[1] === 'vs')   mode = 2;
            else if (arg[1] === 'rate') mode = 3;
            if (d.settings.gamemode !== mode && d.game.currentID === -1) {
                d.settings.gamemode = mode;
                sockEmit('settings', d.settings);
                addMessage(null, 'Gamemode: ' + arg[1]);
            }
            break;
        case '/user':
            addMessage(null, 'I am ' + d.players[d.game.myID].name + ', player number ' + d.game.myID);
            break;
        case '/listusers':
            addMessage(null, 'The users are: ' + d.players.map(function (p) {
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
        case '/playmusic':
            playMusic();
            break;
        case '/stopmusic':
            stopMusic();
            break;
        default:
            addMessage(null, 'Unrecognized command\nTry /help for info');
    }
}

/**
 * Check if the word was guessed correcly.
 * @param guess
 */
function checkGuess(guess) {
    // Cannot be drawing, can only guess once, guess must match word.
    if (!d.game.draw && guess.trim().toLowerCase().localeCompare(d.game.word.toLowerCase()) === 0) {
        if (!d.game.iDone) {
            sockEmit('correct guess');
            d.game.iDone = true;
            setInfo(d.game.word);
        } else {
            addMessage(null, "Chill bro, you already got it");
        }

        return true;
    }
    return false;
}

// ----------------------------
// Draw Section
// ----------------------------

var mouseDown = false; // Remember if down and already drawing.
/**
 * Mouse button was pressed.
 * @type event
 */
canvas.onmousedown = canvas.ontouchstart = function onDown(e) {
    if (d.game.draw) {
        var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        if (e.button === 2) {
            if (mouseDown) {
                draw.fill(d.game.myID);
                emitPoint(3, mouseX, mouseY);
            } else {
                draw.bucket(mouseX, mouseY, d.game.myID);
                emitPoint(4, mouseX, mouseY);
            }
            mouseDown = false;
        } else {
            mouseDown = true;
            emitPoint(0, mouseX, mouseY);
            draw.down(mouseX, mouseY, d.game.myID);
        }

    }
    return false;
};

/**
 * Mouse was dragged.
 * @type event
 */
canvas.onmousemove = canvas.ontouchmove = function onMove(e) {
    if (d.game.draw && mouseDown) {
        var mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        var mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        emitPoint(1, mouseX, mouseY);
        draw.drag(mouseX, mouseY, d.game.myID);
    } else if (mouseDown) {
        onUp();
    }
};

/**
 * Mouse button was released.
 * @type event
 */
window.onmouseup = canvas.ontouchend = function onUp() {
    if (d.game.draw && mouseDown) {
        mouseDown = false;
        emitPoint(2, 0, 0);
        draw.up(d.game.myID);
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
        l: d.game.myID
    });
}

/**
 * Capture all key presses.
 */
document.onkeypress = function (e) {
    var key = e.charCode || e.keyCode;
    // Check keys for colors.
    if (document.activeElement.type !== 'text' && document.activeElement.type !== 'number') {
        if ((key >= 48 && key <= 57 || key === 45) && d.game.draw) {
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
    draw.setColor(val, d.game.myID);
    sockEmit('set color', {c: val, l: d.game.myID});
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
    draw.setRadius(val, d.game.myID);
    sockEmit('set size', {r: val, l: d.game.myID});
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
document.getElementById("sizeIn").onchange = function () {
    setDrawSize(parseInt(this.value))
};

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
 * Start button clicked.
 */
document.getElementById('start').onclick = function (e) {
    e.preventDefault();
    if (this.classList.contains("going"))
        sockEmit('stop game', 0);
    else
        sockEmit('start game', 0);
};

// ----------------------------
// Chat Section
// ----------------------------

/**
 * Output a chat message.
 * @returns {boolean} Stop form submit.
 */
document.getElementById("gform").onsubmit = function (e) {
    e.preventDefault();
    var guessBox = document.getElementById("guessIn");

    if (guessBox.value.charAt(0) === '/') {
        runCommand(guessBox.value.split(' '));
    } else if (guessBox.value !== '') {
        if (!checkGuess(guessBox.value)) {
            addMessage(d.game.myID, ': ' + guessBox.value);
            sockEmit('message', guessBox.value);
        }
    }

    guessBox.value = '';
    return false;
};

document.getElementsByClassName("menu")[0].onclick = function () {
    tools.openMenu(this)
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
        if (d.game.currentID === d.game.myID) sockEmit('turn-draw', val);
        tools.fadeOut('worddiag');
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
document.getElementById('lform').onsubmit = function (e) {
    e.preventDefault();
    var name = document.getElementById('nameIn').value;
    if (name !== '' && name.toLowerCase() !== 'you') {
        d.players.name = name;
        d.players.color = tools.randRGB();
        socketeer();
        sockEmit('add user', d.players);
        tools.fadeOut("logo");
        tools.fadeOut("login");
        tools.fadeIn("game");
        resize();
    }
    return false;
};