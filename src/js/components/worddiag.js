import * as d from "../data";
import * as tools from "../tools";
import {sockEmit} from "../sock";

export function init() {
    document.getElementById('worddiag').onsubmit = chosen;
}

/**
 * A word was chosen.
 * @param {InputEvent} e
 */
function chosen(e) {
    e.preventDefault();
    const val = this.value.trim();
    if (val.length) {
        console.log("Picked word" + val);
        if (d.game.currentID === d.game.myID) sockEmit('turn-draw', val);
        tools.fadeOut('worddiag');
    }
}

/**
 * Set the dialog words.
 * @param {String[]}words
 */
export function set(words) {
    try {
        document.getElementById('word1').value = words[0];
        document.getElementById('word2').value = words[1];
        document.getElementById('word3').value = words[2];
        tools.fadeIn('worddiag');
    }
    catch (e) {
        console.debug("Setting up word dialog -> " + e);
    }
}

export default {init, set}
