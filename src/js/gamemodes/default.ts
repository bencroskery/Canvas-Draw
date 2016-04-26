class DefaultMode {
    timer:any;
    draw:boolean;
    word:string;
    hideList:Array<string>;
    correct:number;
    currentID:number;
    myID:number;
    mode:number;
    time:number;

    constructor() {
        this.timer = null;     // Timer for the game interval.
        this.draw = true;      // If this player can draw.
        this.word = '';        // The word being drawn.
        this.hideList = null;  // List of the hidden characters of the word.
        this.correct = 0;      // Number of players who have correctly guessed.
        this.currentID = -1;   // The current player ID.
        this.myID = -1;        // This player's ID.
        this.mode = 0;         // The game mode: 0 = wait, 1 = choosing, 2 = draw.
        this.time = 0;         // The current game time.
    }

    stop() {

    }
}