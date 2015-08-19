// Main Variables.
var path
  , $drawing = $('#drawing')
  , radius = 10
  , color = 'black'
  , socket = io()
  , STDWIDTH = 1280;

// Game info.
var started = false
  , drawing = true
  , current = 0
  , time;

// User info.
var username
  , number
  , usernames = [];

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
        case '/listusers':
            $('#messages').append($('<li>').text('The users are: ' + usernames));
            break;
        case '/listusersserver':
            socket.emit('list users', 0);
            break;
        default:
            $('#messages').append($('<li>').text('Unrecognized command'));
    }
}

socket.on('start game', function (d) {
    $('#messages').append($('<li>').text('START THE GAME!!!'));
    drawing = false;
    started = true;
    time = 60;
    timer();
});

socket.on('turn', function (player) {
    $('#messages').append($('<li>').text('NEXT TURN!!!'));
    current = 0;
});

function timer() {
    document.querySelector('#timer').textContent = time;
    --time;
    setInterval(function () {
        document.querySelector('#timer').textContent = time;
        --time;
    }, 1000);
}

socket.on('setup', function (data) {
    usernames = data;
});

// ----------------------------
// Draw Section
// ----------------------------

// Functions for mouse events.
function onMouseDown(event) {
    if (drawing) {
        drawDown(event.point.x, event.point.y);
        if (started) {
            emitPoint(event.type, event.point.x, event.point.y);
        }
    }
}
function onMouseDrag(event) {
    if (drawing) {
        drawDrag(event.point.x, event.point.y);
        if (started) {
            emitPoint(event.type, event.point.x, event.point.y);
        }
    }
}
function onMouseUp(event) {
    if (drawing) {
        drawUp();
        if (started) {
            emitPoint(event.type, event.point.x, event.point.y);
        }
    }
}

// Color button clicked.
$("input[name=rGroup]:radio").change(function () {
    color = $("label[for=" + $(this).attr('id') + "]").css("background-color");
    socket.emit('set color', color);
});

// Undo button clicked.
$('.undobtn').click(function () {
    if (path != null) {
        removeLine();
        socket.emit('undo line', 0);
    }
});

// Clear button clicked.
$('.clearbtn').click(function () {
    clearCanvas();
    socket.emit('clear canvas', 0);
});

// Mouse goes down, make a new path and add a point.
function drawDown(x, y) {
    p = new Point(x, y);
    path = new Path({
        segments: [p],
        strokeColor: color,
        strokeWidth: radius * 2 * $drawing.width() / STDWIDTH,
        strokeCap: 'round'
    });
    var myCircle = new Path.Circle(p, radius * $drawing.width() / STDWIDTH);
    myCircle.fillColor = color;
}

// Mouse is dragging, add points and smooth the line.
function drawDrag(x, y) {
    path.add(new Point(x, y));
    path.smooth();
}

// Mouse goes up, simplify the path.
function drawUp() {
    path.simplify(0);
}

// Remove the last line.
function removeLine() {
    path.remove();
    project.activeLayer.lastChild.remove();
    path = project.activeLayer.lastChild;
    view.draw();
}

// Clears all lines from the canvas.
function clearCanvas() {
    project.clear();
    view.draw();
}

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
    else if (p.type == 'mousedrag') {
        drawDrag(p.x * $drawing.width() / STDWIDTH, p.y * $drawing.height() / STDWIDTH);
    }
    else {
        drawUp();
    }

    view.draw();
});

// Set the color
socket.on('set color', function (c) {
    color = c;
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
        $('#messages').append($('<li>').text(username + ': ' + $guessbox.val()));
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
    usernames.push(name);
});

// A user disconnected.
socket.on('user left', function (data) {
    $('#messages').append($('<li>').text(data.name + ' has left.'));
    usernames.splice(data.number, 1);
});

$(window).resize(function () {
    setSize();
});

// ----------------------------
// Login Pane
// ----------------------------

// Username submitted.
$('form#lform').submit(function () {
    var name = $('.usernameInput').val();
    if (name != '') {
        username = name;
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
    view.viewSize = new Size($drawing.width(), $drawing.height());

    // Resize font.
    $('body').css('font-size', FONTSIZE * docwidth / STDWIDTH);
}