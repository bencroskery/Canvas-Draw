import {fadeIn} from './tools'

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
        fadeIn('worddiag');
    }
    catch (e) {
        console.debug("Setting up word dialog -> " + e);
    }
}