// Main Variables.
var path
  , $drawing = $('#drawing')
  , socket = io()
  , canvas = document.getElementById('drawing')
  , ctx = canvas.getContext("2d")
  , STDWIDTH = 1280
  , TIMEWAIT = 10
  , TIMEDRAW = 20;


// Game info.
var game = {
    running : false, 
    word : '', 
    currentplayer : 0, 
    mode : 0, 
    time : 0
};

// User info.
var player = {
    name : 'Casper',
    number : -1,
    mode: 1
}
  , playernames = [];

// Startup.
setSize();
$('.login').fadeIn("fast");
$('.usernameInput').focus();

// ----------------------------
// Game
// ----------------------------

function runCommand(arg) {
    switch (arg[0]) {
        case '/test':
            $('#messages').append($('<li>').text('You said: ' + arg[1]));
            break;
        case '/start':
            socket.emit('start game', 0);
            break;
        case '/freedraw':
            game.running = true;
            player.mode = 1;
            game.mode = 2;
            break;
        case '/user':
            $('#messages').append($('<li>').text('I am ' + player.name + ' player number ' + player.number));
            break;
        case '/userlist':
            $('#messages').append($('<li>').text('The users are: ' + playernames));
            break;
        case '/userlistserver':
            socket.emit('list users', 0);
            break;
        default:
            $('#messages').append($('<li>').text('Unrecognized command'));
    }
}

socket.on('start game', function (d) {
    $('#messages').append($('<li>').text('START THE GAME!!!'));
    player.mode = 0;
    game.running = true;
    game.currentplayer = -1;
    timer();
});

socket.on('turn-wait', function (d) {
    resetCanvas();
    $('#messages').append($('<li>').text('NEXT TURN!!!'));
    game.currentplayer++;
    if (game.currentplayer == playernames.length) {
        game.currentplayer = 0;
    }
    if (game.currentplayer == player.number) {
        player.mode = 1;
        $('#options').fadeIn('fast');
    } else {
        player.mode = 0;
        $('#options').fadeOut('fast');
    }
    game.mode = 0;
    game.time = TIMEWAIT;
});

socket.on('turn-choose', function (d) {
    $('#messages').append($('<li>').text('CHOOSE!!!'));
    game.mode++;
    game.time = TIMEWAIT;
});

socket.on('turn-draw', function (d) {
    game.word = 'TEST';
    $('#messages').append($('<li>').text('DRAW!!! Word: ' + game.word));
    game.mode++;
    game.time = TIMEDRAW;
});

function timer() {
    document.querySelector('#timer').textContent = game.time;
    game.time--;
    setInterval(function () {
        document.querySelector('#timer').textContent = game.time;
        if (game.time != 0) {
            game.time--;
        } 
        else if (player.mode == 1) {
            if (game.mode == 0) {
                // Waiting for next turn ended.
                socket.emit('turn-choose', 0);
            }
            else if (game.mode == 1) {
                // Selecting word ended (auto select).
                socket.emit('turn-draw', false);
            }
            else if (game.mode == 2) {
                // Guessing out of time.
                socket.emit('turn-wait', 0);
            }
        }
    }, 1000);
}

socket.on('setup', function (names) {
    playernames = names;
    player.number = playernames.length - 1;
});

// ----------------------------
// Draw Section
// ----------------------------

var mousedown;
// Mouse button was pressed.
canvas.onmousedown = function (e) {
    mousedown = true;
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        if (game.running) {
            emitPoint('mousedown', mouseX, mouseY);
        }
        drawDown(mouseX, mouseY);
    }
};

// Mouse was dragged.
canvas.onmousemove = function (e) {
    if (!mousedown) return;
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        if (game.running) {
            emitPoint('mousedrag', mouseX, mouseY);
        }
        drawDrag(mouseX, mouseY);
    }
};

// Mouse button was released.
canvas.onmouseup = function (e) {
    mousedown = false;
};

// Color button clicked.
$("input[name=color]:radio").change(function () {
    draw.color = $("label[for=" + $(this).attr('id') + "]").css("background-color");
    if (game.running) {
        socket.emit('set color', draw.color);
    }
});

// Size button clicked.
$("input[name=size]:radio").change(function () {
    draw.radius = $(this).attr('num');
    if (game.running) {
        socket.emit('set size', draw.radius);
    }
});

// Undo button clicked.
$('.undobtn').click(function () {
    removeLine();
    if (game.running) {
        socket.emit('undo line', 0);
    }
});

// Clear button clicked.
$('.clearbtn').click(function () {
    clearCanvas();
    if (game.running) {
        socket.emit('clear canvas', 0);
    }
});

// Send a point to the server.
function emitPoint(type, x, y) {
    socket.emit('point', {
        type: type,
        x: x / $drawing.width() * STDWIDTH,
        y: y / $drawing.height() * STDWIDTH
    })
}

// Add a point according to type.
socket.on('point', function (p) {
    if (p.type == 'mousedown') {
        drawDown(p.x * $drawing.width() / STDWIDTH, p.y * $drawing.height() / STDWIDTH);
    }
    else {
        drawDrag(p.x * $drawing.width() / STDWIDTH, p.y * $drawing.height() / STDWIDTH);
    }
});

// Set the color
socket.on('set color', function (c) {
    draw.color = c;
    //$('#' + c).prop('checked', true).trigger("change");
});

// Set the size
socket.on('set size', function (c) {
    draw.radius = c;
    //$('#' + c).prop('checked', true).trigger("change");
});

// Undo the last drawn line.
socket.on('undo line', function (d) {
    removeLine();
});

// Clear the canvas of lines.
socket.on('clear canvas', function (d) {
    clearCanvas();
});

// ----------------------------
// Chat Section
// ----------------------------

// Creating a chat message.
$('form#gform').submit(function () {
    var $guessbox = $('.guessInput');
    
    if ($guessbox.val().charAt(0) == '/') {
        runCommand($guessbox.val().split(' '));
        $guessbox.val('');
    }
    else if ($guessbox.val() != '') {
        $('#messages').append($('<li>').text(player.name + ': ' + $guessbox.val()));
        socket.emit('message', $guessbox.val());
        $guessbox.val('');
    }
    return false;
});

// Getting a chat message.
socket.on('message', function (data) {
    $('#messages').append($('<li>').text(data.name + ': ' + data.message));
});


// A user connected.
socket.on('user joined', function (name) {
    $('#messages').append($('<li>').text(name + ' has joined.'));
    playernames.push(name);
});

// A user disconnected.
socket.on('user left', function (data) {
    $('#messages').append($('<li>').text(data.name + ' has left.'));
    playernames.splice(data.number, 1);
    if (data.num < player.number) {
        player.number--;
    }
});

$(window).resize(function () {
    setSize();
});

// ----------------------------
// Login Pane
// ----------------------------

// Player's name submitted.
$('form#lform').submit(function () {
    var name = $('.usernameInput').val();
    if (name != '') {
        player.name = name;
        socket.emit('add user', name);
        $('.login').fadeOut("fast");
        $('.game').fadeIn("fast");
        setSize();
    }
    return false;
});

// ----------------------------
// Resize
// ----------------------------

function setSize() {
    var ASPECT = 16 / 8;
    var FONTSIZE = 16;
    var docwidth = $(window).width() - 40;
    var docheight = $(window).height() - 40;
    
    if (docwidth > docheight * ASPECT) {
        docwidth = docheight * ASPECT;
    } else {
        docheight = docwidth / ASPECT;
    }
    
    // Resize game area.
    var $game = $('.game');
    $game.width(docwidth);
    $game.height(docheight);
    ctx.canvas.width = $drawing.width();
    ctx.canvas.height = $drawing.height();
    
    
    // Resize font.
    $('body').css('font-size', FONTSIZE * docwidth / STDWIDTH);
}



// ------------------------------------------------------------------------------------------------------

var draw = { line : new Array(), color : 'black', radius : 10, size : 0, current : { x : 0, y : 0 }, last : { x : 0, y : 0 } };

// Mouse goes down.
function drawDown(x, y) {
    draw.line.push({ point : new Array(), color : draw.color, width : draw.radius * 2 * $drawing.width() / STDWIDTH });
    draw.size++;
    last = null;
    drawPoint(x, y);
}

// Mouse is dragging.
function drawDrag(x, y) {
    drawPoint(x, y);
}

// Remove the last line.
function removeLine() {
    if (draw.size > 0) {
        draw.line.pop();
        draw.size--;
        reDraw();
    }
}

// Clears all lines from the canvas.
function clearCanvas() {
    draw = { line : new Array(), size : 0 };
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
}

// Clears all lines from the canvas.
function resetCanvas() {
    draw = { line : new Array(), color : 'black', radius : 10, size : 0, current : { x : 0, y : 0 }, last : { x : 0, y : 0 } };
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
}

function drawPoint(px, py) {
    if (last == null) {
        last = { x : px + 0.01, y : py };
    } else {
        last = current;
    }
    current = { x : px, y : py };
    draw.line[draw.size - 1].point.push(current);
    
    ctx.lineJoin = "round";
    ctx.strokeStyle = draw.line[draw.size - 1].color;
    ctx.lineWidth = draw.line[draw.size - 1].width;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(current.x, current.y);
    ctx.closePath();
    ctx.stroke();
}

function reDraw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
    
    ctx.lineJoin = "round";
    
    for (var i = 0; i < draw.size; i++) {
        ctx.strokeStyle = draw.line[i].color;
        ctx.lineWidth = draw.line[i].width;
        
        if (draw.line[i].point.length < 2) {
            ctx.beginPath();
            ctx.moveTo(draw.line[i].point[0].x - 0.1, draw.line[i].point[0].y);
            ctx.lineTo(draw.line[i].point[0].x, draw.line[i].point[0].y);
            ctx.closePath();
            ctx.stroke();
        } else {
            for (var n = 1; n < draw.line[i].point.length; n++) {
                ctx.beginPath();
                ctx.moveTo(draw.line[i].point[n - 1].x, draw.line[i].point[n - 1].y);
                ctx.lineTo(draw.line[i].point[n].x, draw.line[i].point[n].y);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }
}




