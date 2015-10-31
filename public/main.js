// Main Variables.
var $drawing = $('#drawing')
  , canvas = document.getElementById('drawing')
  , draw = new Draw(canvas)
  , socket = io()
  , STDWIDTH = 1280
  , TIMEWAIT = 10
  , TIMEDRAW = 20;


// Game info.
var game = {
    running : false,   // Whether the game has been started.
    word : '',         // The word being drawn.
    currentplayer : 0, // The current player ID.
    mode : 0,          // The game mode: 0 = wait, 1 = choosing word, 2 = draw.
    time : 0           // The current game time.
};

// User info.
var player = {
    name : '??',       // The name of the player.
    number : -1,       // The ID number of the player.
    mode: 1            // The mode of the player: 0 = guessing, 1 = drawing.
}
  , playernames = [];  // Names of all players in the lobby.


// Startup.
setSize();
$('.login').fadeIn("fast");
$('.usernameInput').focus();

// ----------------------------
// Game
// ----------------------------

function runCommand(arg) {
    switch (arg[0]) {
        case '/help':
            addMessage('Possible commands are:\nhelp, test, start, stop, freedraw, user, userlist');
            break;
        case '/test':
            addMessage('You said: ' + arg[1]);
            break;
        case '/start':
            socket.emit('start game', 0);
            addMessage('You started the game');
            break;
        case '/stop':
            socket.emit('stop game', 0);
            addMessage('You stopped the game');
            break;
        case '/freedraw':
            game.running = true;
            player.mode = 1;
            game.mode = 2;
            addMessage('Free drawing activated');
            break;
        case '/user':
            addMessage('I am ' + player.name + ' player number ' + player.number);
            break;
        case '/userlist':
            addMessage('The users are: ' + playernames);
            break;
        case '/userlistserver':
            socket.emit('list users', 0);
            addMessage('A user list should pop up in the server console');
            break;
        case '/reboot':
            socket.emit('reboot server', 0);
            break;
        default:
            addMessage('Unrecognized command\nTry /help for info');
    }
}

socket.on('start game', function (d) {
    setInfo('START THE GAME!!!');
    player.mode = 0;
    game.running = true;
    game.currentplayer = -1;
    timer();
});

socket.on('stop game', function (d) {
    setInfo('Use /start to start the game');
    player.mode = 1;
    game.running = false;
    game.currentplayer = 0;
    game.mode = 0;
    game.time = 0;
    setTimer('-');
    draw.reset();
    $('#options').fadeIn('fast');
});

socket.on('turn-wait', function (d) {
    draw.reset();
    game.currentplayer++;
    if (game.currentplayer == playernames.length) {
        game.currentplayer = 0;
    }
    if (game.currentplayer == player.number) {
        player.mode = 1;
        setInfo("It's now your turn!");
        $('#options').fadeIn('fast');
    } else {
        player.mode = 0;
        setInfo("It's now " + playernames[game.currentplayer] + "'s turn!");
        $('#options').fadeOut('fast');
    }
    game.mode = 0;
    game.time = TIMEWAIT;
});

socket.on('turn-choose', function (d) {
    if (player.mode == 1) {
        setInfo('Choose a word!');
    } else {
        setInfo(playernames[game.currentplayer] + ' is choosing!');
    }
    game.mode = 1;
    game.time = TIMEWAIT;
});

socket.on('turn-draw', function (word) {
    game.word = word;
    if (player.mode == 1) {
        setInfo('DRAW!!! Word: ' + game.word);
    } else {
        setInfo('Guess! ' + game.word.replace(/[^ '-.]/g, " _").replace(' ', '   '));
    }
    game.mode = 2;
    game.time = TIMEDRAW;
});

function timer() {
    setTimer(game.time);
    game.time--;
    setInterval(function () {
        if (!game.running) {
            return;
        }
        setTimer(game.time);
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
                socket.emit('turn-draw', -1);
            }
            else if (game.mode == 2) {
                // Guessing out of time.
                socket.emit('turn-wait', 0);
            }
        }
    }, 1000);
}


socket.on('correctguess', function (name) {
    if (game.time > 8) {
        game.time = 8;
    }
    addMessage(name + ' guessed the word!')
});

socket.on('setup', function (names) {
    playernames = names;
    player.number = playernames.length - 1;
});

socket.on('reboot', function (d) {
    location.reload();
});

// ----------------------------
// Info Section
// ----------------------------

var obj_timer = document.querySelector('#timer');
function setTimer(text) {
    obj_timer.textContent = text;
}

var obj_info = document.querySelector('#info');
function setInfo(text) {
    obj_info.textContent = text;
}

// ----------------------------
// Draw Section
// ----------------------------

var mousedown;
// Mouse button was pressed.
canvas.onmousedown = function (e) {
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        if (e.button === 2) {
            if (mousedown) {
                mousedown = false;
                draw.fill();
                emitMouse(2, mouseX, mouseY);
            } else {
                draw.bucket(mouseX, mouseY);
                emitMouse(3, mouseX, mouseY);
            }
        } else {
            mousedown = true;
            draw.down(mouseX, mouseY);
            emitMouse(0, mouseX, mouseY);
        }
        
    }
};

// Mouse was dragged.
canvas.onmousemove = function (e) {
    if (!mousedown) return;
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    if (player.mode == 1 && game.mode == 2 || !game.running) {
        if (game.running) {
            emitMouse(1, mouseX, mouseY);
        }
        draw.drag(mouseX, mouseY);
    }
};

// Mouse button was released.
canvas.onmouseup = function (e) {
    mousedown = false;
};

// Mouse was scrolled to change size.
var inputSize = document.querySelector('#sizeInput');
canvas.onwheel = function (e) {
    if (mousedown) return;
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    var val = parseInt(inputSize.value) + delta*2;

    if (val === 0 || val === 42) return;
    inputSize.value = val;
    draw.setRadius(val);
    if (game.running) {
        socket.emit('set size', val);
    }
}

// Size button clicked.
inputSize.addEventListener('input', function () {
    var val = parseInt(inputSize.value);
    draw.setRadius(val);
    if (game.running) {
        socket.emit('set size', val);
    }
});

// Color button clicked.
$("input[name=color]:radio").change(function () {
    var val = $("label[for=" + $(this).attr('id') + "]").css("background-color");
    draw.setColor(val);
    if (game.running) {
        socket.emit('set color', val);
    }
});

// Undo button clicked.
$('#undobtn').click(function () {
    draw.pop();
    if (game.running) {
        socket.emit('undo line', 0);
    }
});

// Clear button clicked.
$('#clearbtn').click(function () {
    draw.clear();
    if (game.running) {
        socket.emit('clear canvas', 0);
    }
});

// Send a point to the server.
function emitMouse(type, x, y) {
    if (game.running) {
        socket.emit('point', {
            type: type,
            x: x / $drawing.width() * STDWIDTH,
            y: y / $drawing.height() * STDWIDTH,
        });
    }
}

// Add a point according to type.
socket.on('point', function (p) {
    if (p.type === 0) {
        draw.down(p.x * $drawing.width() / STDWIDTH, p.y * $drawing.height() / STDWIDTH);
    } else if (p.type === 1) {
        draw.drag(p.x * $drawing.width() / STDWIDTH, p.y * $drawing.height() / STDWIDTH);
    } else if (p.type === 2) {
        draw.fill();
    } else if (p.type === 3) {
        draw.bucket(p.x * $drawing.width() / STDWIDTH, p.y * $drawing.height() / STDWIDTH);
    }
});

// Set the color
socket.on('set color', function (c) {
    draw.setColor(c);
    //$('#' + c).prop('checked', true).trigger("change");
});

// Set the size
socket.on('set size', function (c) {
    draw.setRadius(c);
});

// Undo the last drawn line.
socket.on('undo line', function (d) {
    draw.pop();
});

// Clear the canvas of lines.
socket.on('clear canvas', function (d) {
    draw.clear();
});

// ----------------------------
// Chat Section
// ----------------------------

// Add list message element.
function addMessage(text) {
    var node = document.createElement("LI");
    var textnode = document.createTextNode(text);
    node.appendChild(textnode);
    document.getElementById("messages").appendChild(node);
}

// Creating a chat message.
$('form#gform').submit(function () {
    var $guessbox = $('.guessInput');
    
    if ($guessbox.val().charAt(0) == '/') {
        runCommand($guessbox.val().split(' '));
        $guessbox.val('');
    }
    else if ($guessbox.val() != '') {
        if ($guessbox.val().toLowerCase() === game.word.toLowerCase() && player.mode === 0) {
            socket.emit('correctguess', 0);
            $guessbox.val('');
        } else {
            addMessage(player.name + ': ' + $guessbox.val());
            socket.emit('message', $guessbox.val());
            $guessbox.val('');
        }
    }
    return false;
});

// Getting a chat message.
socket.on('message', function (data) {
    addMessage(data.name + ': ' + data.message);
});

// A user connected.
socket.on('user joined', function (name) {
    addMessage(name + ' has joined.');
    playernames.push(name);
});

// A user disconnected.
socket.on('user left', function (data) {
    addMessage(data.name + ' has left.');
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
    draw.setCanvasSize($drawing.width(), $drawing.height());
    
    // Resize font.
    $('body').css('font-size', FONTSIZE * docwidth / STDWIDTH);

}

