"use strict";

// Socket for connections.
let io = require('socket.io-client');
let n = parseInt(process.argv[2]);

// Create new sockets on a timer.
console.log("Adding " + n + " users to the game.");
for(let k = 1; k <= n; k++) {
    setTimeout(function() {newSocket(k)}, 100*k);
}

/**
 * Make a new socket connection and user then save it to the sockets list.
 */
function newSocket(i) {
    let socket = io.connect('http://localhost:3000', {'force new connection': true});

    // Player info.
    let players = {
        name: 'Tester' + i,
        color: 'rgb('+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+')',
        score: 0
    };

    // Add a new player.
    console.log('Add Tester' + i);
    socket.emit('add user', players);
}

setTimeout(function() {console.log("All done.")}, 100*n);