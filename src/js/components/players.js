let element = document.getElementById("users");

/**
 * The player type.
 * @typedef {{name: string, color: string, score: number}} Player
 */

/**
 * The full list of players
 * @type {Player|Player[]}
 */
let players = {
    name: '??',     // Player name.
    color: '',      // Player defining color.
    score: 0        // Player score, totalling points.
};

/**
 * Get the number of players.
 * @returns {number}
 */
export function length() {
    return players.length;
}

/**
 * Get a player by their ID, or all players.
 * @param {Number} [id]
 * @returns {Player|Player[]}
 */
export function get(id) {
    if (id === undefined)
        return players;

    return players[id]
}

/**
 * Set the list of players.
 * @param {Player|Player[]} p
 */
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

/**
 * Add a new player to the list.
 * @param {Player} player
 */
export function add(player) {
    players.push(player);

    // Add the players to the list.
    let node = document.createElement("li");
    node.innerHTML = '<span style="color:' + player.color + '">' + player.name + '</span>' + '<div>0 PTS</div>';
    element.appendChild(node);
}

/**
 * Remove a player by ID.
 * @param {Number} id
 */
export function remove(id) {
    players.splice(id, 1);

    // Remove the players from the list.
    element.removeChild(element.childNodes[id]);
}

/**
 * Update a player's score.
 * @param {Number} id
 * @param {Number} amount
 */
export function updateScore(id, amount) {
    players[id].score += amount;
    element.childNodes[id].lastChild.innerHTML = players[id].score + ' PTS';
}

export default {length, get, set, add, remove, updateScore}