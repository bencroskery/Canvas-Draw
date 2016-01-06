var canvas = document.getElementById('draw'),
    draw = new Draw(canvas);

function resize() {
    var A = 16 / 8, // Aspect ratio.
        P = "px",   // Pixel tag.
        dw = window.innerWidth - 40,
        dh = window.innerHeight - 40;

    // Scale by largest edge.
    if (dw > dh * A) dw = dh * A;
    else dh = dw / A;

    // Set the size and resize the game and drawing canvas.
    var g = document.getElementById("game").style;
    g.width = dw + P;
    g.height = dh + P;
    draw.resize();

    // Set the font size based off size and scaling factor (16pt font / 1280px width).
    document.body.style.fontSize = dw / 80 + P;
}
resize();