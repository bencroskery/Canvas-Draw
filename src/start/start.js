var canvas = document.getElementById('draw'),
    draw = new Draw(canvas);

/**
 * Resize the game window, set the fontSize for CSS sizing, and ask the drawing to resize.
 */
function resize() {
    var ASPECT = 16 / 8,
        PX = "px",
        width = window.innerWidth,
        height = window.innerHeight,
        gameBox = document.getElementById("game").style;

    // Scale by largest edge.
    if (width > height * ASPECT) width = height * ASPECT;
    else height = width / ASPECT;

    // Set the size and resize the game and drawing canvas.
    gameBox.width = width + PX;
    gameBox.height = height + PX;
    draw.resize(game.myID > -1);

    // Set the font size based off size and scaling factor (16pt font / 1280px width).
    document.body.style.fontSize = width / 80 + PX;
}
resize();