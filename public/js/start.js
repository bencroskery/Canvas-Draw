var canvas = document.getElementById('drawing')
  , draw = new Draw(canvas)
  , STDWIDTH = 1280;

function setSize() {
    var ASPECT = 16/8
      , FONT = 16
      , dw = window.innerWidth-40
      , dh = window.innerHeight-40;

    if (dw > dh*ASPECT) dw = dh*ASPECT;
    else dh = dw/ASPECT;

    var game = document.getElementById("game");
    game.style.width = dw+"px";
    game.style.height = dh+"px";
    draw.resized();

    document.body.style.fontSize = FONT*dw/STDWIDTH+"px";
} setSize();