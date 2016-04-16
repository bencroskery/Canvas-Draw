import {sockEmit} from './sock'
import * as tools from './tools'
import * as d from './data'
import * as view from './view'
import {playSound} from './sound'

export function start() {
    document.getElementById('start').classList.add("going");
    d.game.draw = false;
    d.game.currentID = 0;
    d.game.timer = setInterval(timerStep, 1000);
}

export function stop() {
    document.getElementById('start').classList.remove("going");
    view.setInfo('Draw freely or start a game');
    if (d.game.mode === 1 && d.game.currentID === d.game.myID) tools.fadeOut('worddiag');
    d.game.draw = true;
    d.game.currentID = -1;
    d.game.mode = 0;
    d.game.time = 0;
    draw.clear();
    tools.fadeIn('tools');
    clearInterval(d.game.timer);
}

export function turn_wait(next) {
    if (next !== 0) {
        view.addMessage(null, 'The word was: ' + d.game.word);
    }
    draw.dump();
    d.game.iDone = false;
    d.game.allDone = 0;
    d.game.currentID += next;
    if (d.game.currentID >= d.players.length) {
        d.game.currentID = 0;
    }
    if (d.game.currentID === d.game.myID) {
        d.game.draw = true;
        view.setInfo("It's now your turn!");
        tools.fadeIn('tools');
    } else {
        d.game.draw = false;
        view.setInfo("It's now " + d.players[d.game.currentID].name + "'s turn!");
        tools.fadeOut('tools');
    }
    d.game.mode = 0;
    d.game.time = d.settings.time_wait;
    view.setTimer(d.game.time--);
}

export function turn_choose(words) {
    draw.reDraw();
    if (d.game.draw) {
        view.setInfo('Choose a word!');
        view.setChoose(words);
    } else {
        view.setInfo(d.players[d.game.currentID].name + ' is choosing!');
    }
    d.game.mode = 1;
    d.game.time = d.settings.time_choose;
    view.setTimer(d.game.time--);
}

export function turn_draw(word) {
    d.game.word = word;
    buildWord();
    d.game.mode = 2;
    d.game.time = d.settings.time_draw;
    view.setTimer(d.game.time--);
}

/**
 * Build up the word as time goes on.
 */
function buildWord() {
    // Hide elements by character type then split into an array.
    let chars = d.game.word.replace(/[aeiou]/ig, '♠').replace(/[a-z0-9]/ig, '♣').split('');

    if (d.game.draw) {
        tools.fadeOut('worddiag');
        // Create a list of elements that can be revealed.
        d.game.hideList = chars.reduce(function (o, c) {
            if (c === '♣') {
                o.char.push(o.length);
            }
            o.length++;
            return o;
        }, {char: [], length: 0});
        view.setInfo('DRAW!!! Word: ' + d.game.word);
    } else {
        d.game.hideList = true;
        // Add all the visible and hidden elements to the output.
        let out = chars.reduce(function (o, c) {
            if (c === '♠' || c === '♣') {
                return o + "<span class='char b'> </span>";
            } else {
                return o + "<span class='char'>" + c + "</span>";
            }
        }, '');
        view.setInfo(out);
    }
}

/**
 * Main game timer loop.
 */
function timerStep() {
    if (d.game.currentID === -1) {
        // Should not be running a timer step if the game is stopped.
        console.log('Halt timer.');
        clearInterval(d.game.timer);
    }

    if (d.game.time >= 0) {
        // Play countdown sounds if needed.
        if ((d.game.mode === 1 && d.game.draw) || d.game.mode === 2) {
            if (d.game.time === 0)
                playSound('blip2');
            else if (d.game.time <= 5)
                playSound('blip1', 0.6 - (d.game.time / 10));
        }
        // Decrement the time if not passed zero.
        view.setTimer(d.game.time--);
        if (d.game.draw && d.game.hideList !== null) {
            // Potentially show another letter.
            if (d.game.time + 1 < d.settings.time_draw * d.game.hideList.char.length / d.game.hideList.length) {
                sockEmit('reveal char', d.game.hideList.char.splice(Math.random() * d.game.hideList.char.length, 1));
            }
        }
    }
    else if (d.game.draw) {
        if (d.game.mode === 0) {
            // Waiting for next turn ended.
            sockEmit('turn-choose', 0);
        }
        else if (d.game.mode === 1) {
            // Selecting word ended (auto select by ID -1).
            sockEmit('turn-draw', -1);
        }
        else if (d.game.mode === 2) {
            // Guessing out of time (increment current player by 1).
            sockEmit('turn-wait', 1);
        }
    }
}