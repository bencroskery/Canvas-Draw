var canvas = document.getElementById('draw'),
    draw = new Draw(canvas);

function resize() {
    var ASPECT = 16 / 8,
        PX = "px",
        width = window.innerWidth - 40,
        height = window.innerHeight - 40;

    // Scale by largest edge.
    if (width > height * ASPECT) width = height * ASPECT;
    else height = width / ASPECT;

    // Set the size and resize the game and drawing canvas.
    var game = document.getElementById("game").style;
    game.width = width + PX;
    game.height = height + PX;
    draw.resize();

    // Set the font size based off size and scaling factor (16pt font / 1280px width).
    document.body.style.fontSize = width / 80 + PX;
}
resize();