import {players} from './data'
import * as tools from './tools'

/**
 * Add list user element.
 * @param id
 */
export function addUser(id) {
    let node = document.createElement("li");
    node.innerHTML = '<span style="color:' + players[id].color + '">'
        + players[id].name + '</span>' + '<div>0 PTS</div>';
    document.getElementById("users").appendChild(node);
}

/**
 * Update the score of a user.
 * @param num
 * @param amount
 */
export function updateScore(num, amount) {
    players[num].score += amount;
    document.getElementById("users").childNodes[num].lastChild.innerHTML = players[num].score + ' PTS';
}

/**
 * Remove list user element.
 * @param num
 */
export function removeUser(num) {
    let nodes = document.getElementById("users");
    nodes.removeChild(nodes.childNodes[num]);
}

/**
 * Add list message element.
 * @param id
 * @param text
 */
export function addMessage(id, text) {
    let node = document.createElement("li");
    node.innerHTML = (id !== null ? ('<span style="color:' + players[id].color + '">'
        + players[id].name + '</span>') : '') + text;
    document.getElementById("messages").appendChild(node);
}


// ----------------------------
// Info Section
// ----------------------------

export function setTimer(text) {
    document.getElementById('timer').textContent = text;
}

export function setInfo(text) {
    document.getElementById('info').innerHTML = text;
}

export function setChoose(words) {
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