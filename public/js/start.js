var canvas = document.getElementById('draw'),
    draw = new Draw(canvas),
    WIDTH = 1280;

function resize() {
    var A = 16 / 8,
        P = "px",
        dw = window.innerWidth - 40,
        dh = window.innerHeight - 40;

    // Scale by largest edge.
    if (dw > dh * A) dw = dh * A;
    else dh = dw / A;

    // Set the size and resize the game and drawing canvas.
    var g = document.getElementById("game").style;
    g.width = dw + P;
    g.height = dh + P;
    draw.resized();

    // Set the font size based off size (for scaling elements).
    document.body.style.fontSize = 16 * dw / WIDTH + P;
}
resize();