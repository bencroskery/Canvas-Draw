let element = document.getElementById("messages");
let form = document.getElementById("gform");
let props;

export function setup(command, check) {
    form.onsubmit = submit;
    props =  {command, check};
}

function submit(e) {
    e.preventDefault();
    let guessBox = document.getElementById("guessIn");

    if (guessBox.value.charAt(0) === '/') {
        props.command(guessBox.value.split(' '));
    } else if (guessBox.value !== '') {
        console.log(props);
        props.check(guessBox.value);
    }

    guessBox.value = '';
}

export function addMessage(text, player) {
    let node = document.createElement("li");
    node.innerHTML = (player ? ('<span style="color:' + player.color + '">'
        + player.name + '</span>') : '') + text;
    element.appendChild(node);
}

export default {setup, addMessage}