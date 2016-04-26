// Game info.
export let game = {
    timer: null,    // Timer for the game interval.
    draw: true,     // If this player can draw.
    word: '',       // The word being drawn.
    hideList: null, // List of the hidden characters of the word.
    iDone: false,  // Whether this player is done for this turn.
    allDone: 0,     // Number of players who have correctly guessed.
    currentID: -1,  // The current player ID.
    myID: -1,       // This player's ID.
    mode: 0,        // The game mode: 0 = wait, 1 = choosing, 2 = draw.
    time: 0         // The current game time.
};

// Complete settings list.
export let settings = {
    gamemode: 0,
    time_wait: 6,
    time_choose: 10,
    time_draw: 60,
    time_react: 8
};

export function setSettings(s) {
    settings = s;
}