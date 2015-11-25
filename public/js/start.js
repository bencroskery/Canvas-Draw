var canvas = document.getElementById('draw')
  , draw = new Draw(canvas)
  , WIDTH = 1280;

function setSize() {
    var ASPECT = 16 / 8
      , FONT = 16
      , dw = window.innerWidth - 40
      , dh = window.innerHeight - 40;

    // Scale by largest edge.
    if (dw > dh * ASPECT) dw = dh * ASPECT;
    else dh = dw / ASPECT;

    // Set the size and resize the drawing canvas.
    var game = document.getElementById("game");
    game.style.width = dw + "px";
    game.style.height = dh + "px";
    draw.resized();

    // Set the font size based off size (for scaling elements).
    document.body.style.fontSize = FONT * dw / WIDTH + "px";
} setSize();