let element = document.getElementById("users");

let players = {
    name: '??',     // Player name.
    color: '',      // Player defining color.
    score: 0        // Player score, totalling points.
};

export function length() {
    return players.length;
}

export function get(id) {
    if (id === undefined)
        return players;

    return players[id]
}

export function set(p) {
    players = p;
    element.innerHTML = ''; // Clear the players to refresh.

    // Add all the players to the list.
    players.forEach((player) => {
        let node = document.createElement("li");
        node.innerHTML = '<span style="color:' + player.color + '">' + player.name + '</span>' + '<div>0 PTS</div>';
        element.appendChild(node);
    })
}

export function add(player) {
    players.push(player);

    // Add the players to the list.
    let node = document.createElement("li");
    node.innerHTML = '<span style="color:' + player.color + '">' + player.name + '</span>' + '<div>0 PTS</div>';
    element.appendChild(node);
}

export function remove(id) {
    players.splice(id, 1);

    // Remove the players from the list.
    element.removeChild(element.childNodes[id]);
}

export function updateScore(id, amount) {
    players[id].score += amount;
    element.childNodes[id].lastChild.innerHTML = players[id].score + ' PTS';
}

export default {length, get, set, add, remove, updateScore}