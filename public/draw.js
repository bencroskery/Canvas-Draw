// Main Variables.
var path;
var $drawing = $('#drawing');
var radius = 10;
var color = 'black'
var socket = io();

// User info.
var username;

// Startup.
$('.usernameInput').focus();

// ----------------------------
// Draw Section
// ----------------------------

// Functions for mouse events.
function onMouseDown(event) {
    drawDown(event.point.x, event.point.y);
    emitPoint(event.type, event.point.x, event.point.y);
}
function onMouseDrag(event) {
    drawDrag(event.point.x, event.point.y);
    emitPoint(event.type, event.point.x, event.point.y);
}
function onMouseUp(event) {
    drawUp();
    emitPoint(event.type, event.point.x, event.point.y);
}

// Undo button clicked.
$('.undobtn').click(function () {
    if (path != null) {
        removeLine();
        socket.emit('undo line', 0);
    }
});


$("input[name=rGroup]:radio").change(function () {
    color = $("label[for=" + $(this).attr('id') + "]").css("background-color");
    socket.emit('set color', color);
});

// Mouse goes down, make a new path and add a point.
function drawDown(x, y) {
    p = new Point(x, y);
    path = new Path({
        segments: [p],
        strokeColor: color,
        strokeWidth: radius * 2 * $drawing.width() / 1280,
        strokeCap: 'round'
    });
    var myCircle = new Path.Circle(p, radius * $drawing.width() / 1280);
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

// Send a point to the server.
function emitPoint(type, x, y) {
    var data = {
        type: type,
        x: x / $drawing.width() * 1280,
        y: y / $drawing.height() * 1280
    }

    socket.emit('point', data)
}

// Get a point and apply it accordingly.
socket.on('point', function (msg) {
    if (msg.type == 'mousedown') {
        drawDown(msg.x * $drawing.width() / 1280, msg.y * $drawing.height() / 1280);
    }
    else if (msg.type == 'mousedrag') {
        drawDrag(msg.x * $drawing.width() / 1280, msg.y * $drawing.height() / 1280);
    }
    else {
        drawUp();
    }

    view.draw();
});

socket.on('undo line', function (d) {
    removeLine();
});

socket.on('set color', function (c) {
    color = c;
    //$('#' + c).prop('checked', true).trigger("change");
});

// ----------------------------
// Chat Section
// ----------------------------

// Creating a chat message.
$('form#gform').submit(function () {
    var $guessbox = $('.guessInput');
    if ($guessbox.val() != '') {
        $('#messages').append($('<li>').text(username + ': ' + $guessbox.val()));
        socket.emit('message', $guessbox.val());
        $guessbox.val('');
    }
    return false;
});

// Getting a chat message.
socket.on('message', function (data) {
    $('#messages').append($('<li>').text(data.username + ': ' + data.message));
});

$(window).resize(function () {
    setSize();
});

// ----------------------------
// Login Pane
// ----------------------------

$('form#lform').submit(function () {
    var name = $('.usernameInput').val()
    if (name != '') {
        username = name;
        socket.emit('add user', name);
        $('.login').remove();
        $('.game').show();
        setSize();
    }
    return false;
});

function setSize() {
    var ASPECT = 16 / 8;
    var docwidth = $(window).width() - 50;
    var docheight = $(window).height() - 50;

    if (docwidth > docheight * ASPECT) {
        docwidth = docheight * ASPECT;
    } else {
        docheight = docwidth / ASPECT;
    }

    var con = $('.game');
    con.width(docwidth);
    con.height(docheight);
    view.viewSize = new Size($drawing.width(), $drawing.height());
}