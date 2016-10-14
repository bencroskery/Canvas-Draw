import {socketeer, sockEmit} from './sock'
import * as tools from './tools'
import * as d from './data'
import {setInfo} from './view'
import {playMusic, stopMusic} from './sound'

import Players from './components/players'
import Chat from './components/chat'
import Canvas from './components/canvas'

// Startup.
tools.fadeIn('login');
document.getElementById('nameIn').focus();

// ----------------------------
// Game
// ----------------------------

function runCommand(arg) {
    switch (arg[0]) {
        case '/help':
            Chat.addMessage('Possible commands are:\nhelp, start, stop, gamemode, user, listusers');
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
                Chat.addMessage('Gamemode: ' + arg[1]);
            }
            break;
        case '/user':
            Chat.addMessage('I am ' + Players.get(d.game.myID).name + ', player number ' + d.game.myID);
            break;
        case '/listusers':
            Chat.addMessage('The users are: ' + Players.get().map(function (p) {
                    return '<span style="color:' + p.color + '">' + p.name + '</span>';
                }));
            break;
        case '/listusersserver':
            sockEmit('list users', 0);
            Chat.addMessage('See server console');
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
            Chat.addMessage('Unrecognized command\nTry /help for info');
    }
}

/**
 * Check if the word was guessed correctly.
 * @param {String} guess
 */
function checkGuess(guess) {
    // Cannot be drawing, can only guess once, guess must match word.
    if (!d.game.draw && guess.trim().toLowerCase().localeCompare(d.game.word.toLowerCase()) === 0) {
        if (!d.game.iDone) {
            sockEmit('correct guess');
            d.game.iDone = true;
            setInfo(d.game.word);
        } else {
            Chat.addMessage("Chill bro, you already got it");
        }
    } else {
        Chat.addMessage(': ' + guess, Players.get(d.game.myID));
        sockEmit('message', guess);
    }
}

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

document.getElementById("ham").onclick = function () {
    tools.openMenu(this)
};

/**
 * Resize the game when the window is resized.
 */
window.onresize = resize;

// ----------------------------
// Login Pane
// ----------------------------

/**
 * Player's name submitted.
 */
document.getElementById('lform').onsubmit = function (e) {
    e.preventDefault();
    let name = document.getElementById('nameIn').value;
    if (name !== '' && name.toLowerCase() !== 'you') {
        // Setup the player and send it.
        Players.get().name = name;
        Players.get().color = tools.randRGB();
        socketeer();
        sockEmit('add user', Players.get());

        // Switch to game view.
        tools.fadeOut("logo");
        tools.fadeOut("login");
        tools.fadeIn("game");
        resize();

        // Initialize stuff.
        Canvas.init();
        Chat.init(runCommand, checkGuess);
    }
};