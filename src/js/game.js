import {sockEmit} from './sock'
import * as tools from './tools'
import * as d from './data'

import {playSound} from './sound'
import Players from './components/players'
import Chat from './components/chat'
import WordDiag from './components/worddiag'
import Info from './components/info'
import Time from './components/time'

WordDiag.init();

export function start() {
    document.getElementById('start').classList.add("going");
    d.game.draw = false;
    d.game.currentID = 0;
    Time.set(d.settings.time_wait, timerStep)
}

export function stop() {
    document.getElementById('start').classList.remove("going");
    Info.set('Draw freely or start a game');
    if (d.game.mode === 1 && d.game.currentID === d.game.myID) tools.fadeOut('worddiag');
    d.game.draw = true;
    d.game.currentID = -1;
    d.game.mode = 0;
    draw.clear();
    tools.fadeIn('tools');
    Time.clear();
}

/**
 * Turn: waiting (recovery time).
 * @param {Number} next
 */
export function turn_wait(next) {
    if (next !== 0) {
        Chat.addMessage('The word was: ' + d.game.word);
    }
    draw.dump();
    d.game.iDone = false;
    d.game.allDone = 0;
    d.game.currentID += next;
    if (d.game.currentID >= Players.length()) {
        d.game.currentID = 0;
    }
    if (d.game.currentID === d.game.myID) {
        d.game.draw = true;
        Info.set("It's now your turn!");
        tools.fadeIn('tools');
    } else {
        d.game.draw = false;
        Info.set("It's now " + Players.get(d.game.currentID).name + "'s turn!");
        tools.fadeOut('tools', true);
    }
    d.game.mode = 0;
    Time.set(d.settings.time_wait, timerStep);
}

/**
 * Turn: player choosing.
 * @param {String[]} words
 */
export function turn_choose(words) {
    draw.reDraw();
    if (d.game.draw) {
        Info.set('Choose a word!');
        WordDiag.set(words);
    } else {
        Info.set(Players.get(d.game.currentID).name + ' is choosing!');
    }
    d.game.mode = 1;
    Time.set(d.settings.time_choose, timerStep);
}

/**
 * Turn: player drawing the chosen word.
 * @param {String} word
 */
export function turn_draw(word) {
    d.game.word = word;
    buildWord();
    d.game.mode = 2;
    Time.set(d.settings.time_draw, timerStep);
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
        Info.set('DRAW!!! Word: ' + d.game.word);
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
        Info.set(out);
    }
}

/**
 * Main game timer loop.
 */
function timerStep(time) {
    if (time >= 0) {
        // Play countdown sounds if needed.
        if ((d.game.mode === 1 && d.game.draw) || d.game.mode === 2) {
            if (time === 0)
                playSound('blip2');
            else if (time <= 5)
                playSound('blip1', 0.6 - (time / 10));
        }
        // Decrement the time if not passed zero.
        if (d.game.draw && d.game.hideList !== null) {
            // Potentially show another letter.
            if (time + 1 < d.settings.time_draw * d.game.hideList.char.length / d.game.hideList.length) {
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