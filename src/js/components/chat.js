let element = document.getElementById("messages");
let form = document.getElementById("gform");
let props;

/**
 * Initialize the chat.
 * @param {Function} command
 * @param {Function} check
 */
export function init(command, check) {
    form.onsubmit = submit;
    props = {command, check};
}

/**
 * Submit a chat message.
 * @param {InputEvent} e
 */
function submit(e) {
    e.preventDefault();
    let guessBox = document.getElementById("guessIn");

    if (guessBox.value.charAt(0) === '/') {
        props.command(guessBox.value.split(' '));
    } else if (guessBox.value !== '') {
        props.check(guessBox.value);
    }

    guessBox.value = '';
}

/**
 * Add a new message from a specific player.
 * @param {String} text
 * @param {Player} [player]
 */
export function addMessage(text, player) {
    let node = document.createElement("li");
    node.innerHTML = (player ? ('<span style="color:' + player.color + '">'
        + player.name + '</span>') : '') + text;
    element.appendChild(node);
}

export default {init, addMessage}