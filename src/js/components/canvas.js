import * as d from "../data";
import {sockEmit} from "../sock";

// ----------------------------
// Draw Section
// ----------------------------

/**
 * Remember if down and already drawing.
 * @type {boolean}
 */
let mouseDown = false;

export function init() {
    // Drawing on the canvas.
    canvas.onmousedown = canvas.ontouchstart = onDown;
    canvas.onmousemove = canvas.ontouchmove = onMove;
    window.onmouseup = window.ontouchend = onUp;

    // Keys + clicks for swatches.
    document.onkeypress = keypress;
    Array.from(document.querySelectorAll("input[name=color]")).forEach((color) => {
        color.onchange = function () {
            setDrawColor(document.querySelector("label[for=" + this.id + "]").style.backgroundColor);
        }
    });

    // Scroll and input for size.
    canvas.addEventListener((/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel", function (e) {
        if (mouseDown) return;
        var inputSize = document.getElementById('sizeIn');
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        var val = parseInt(inputSize.value) + delta * 2;

        if (val === 0 || val === 42) return;
        inputSize.value = val;
        setDrawSize(val);
    }, false);
    document.getElementById("sizeIn").onchange = function () {
        setDrawSize(parseInt(this.value))
    };

    // More buttons.
    document.getElementById('undo').onclick = undo;
    document.getElementById('clear').onclick = clear;
}

export default {init}

/**
 * Mouse button was pressed.
 * @param {MouseEvent} e
 */
function onDown(e) {
    e.preventDefault();
    if (d.game.draw) {
        const mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        const mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        if (e.button === 2) {
            if (mouseDown) {
                draw.fill(d.game.myID);
                emitPoint(3, mouseX, mouseY);
            } else {
                draw.bucket(mouseX, mouseY, d.game.myID);
                emitPoint(4, mouseX, mouseY);
            }
            mouseDown = false;
        } else {
            emitPoint(0, mouseX, mouseY);
            draw.down(mouseX, mouseY, d.game.myID);
            mouseDown = true;
        }
    }
}

/**
 * Mouse was dragged.
 * @param {MouseEvent} e
 */
function onMove(e) {
    if (d.game.draw && mouseDown) {
        const mouseX = (e.pageX || e.targetTouches[0].pageX) - this.offsetLeft;
        const mouseY = (e.pageY || e.targetTouches[0].pageY) - this.offsetTop;
        emitPoint(1, mouseX, mouseY);
        draw.drag(mouseX, mouseY, d.game.myID);
    } else if (mouseDown) {
        onUp();
    }
}

/**
 * Mouse button was released.
 */
function onUp() {
    if (d.game.draw && mouseDown) {
        emitPoint(2, 0, 0);
        draw.up(d.game.myID);
        mouseDown = false;
    }
}

/**
 * Send a point to the server.
 * @param {Number} type
 * @param {Number} x
 * @param {Number} y
 */
function emitPoint(type, x, y) {
    sockEmit('p', {
        t: type,
        x: (x / draw.getWidth()).toFixed(8),
        y: (y / draw.getHeight()).toFixed(8),
        l: d.game.myID
    });
}

/**
 * Capture all key presses.
 * @param {KeyboardEvent} e
 */
function keypress(e) {
    var key = e.charCode || e.keyCode;
    // Check keys for colors.
    if (document.activeElement.type !== 'text' && document.activeElement.type !== 'number') {
        if ((key >= 48 && key <= 57 || key === 45) && d.game.draw) {
            document.getElementById("r" + String.fromCharCode(key)).checked = true;
            setDrawColor(document.querySelector("label[for=r" + String.fromCharCode(key) + "]").style.backgroundColor);
        } else if (key === 47) {
            document.getElementById("guessIn").focus();
            return false;
        }
    }
}

/**
 * Color changed.
 * @param {String} val : color to set
 */
function setDrawColor(val) {
    draw.setColor(val, d.game.myID);
    sockEmit('set color', {c: val, l: d.game.myID});
}

/**
 * Size changed.
 * @param {Number} val : number size to set
 */
function setDrawSize(val) {
    draw.setRadius(val, d.game.myID);
    sockEmit('set size', {r: val, l: d.game.myID});
}

/**
 * Undo button clicked.
 */
function undo() {
    draw.undo();
    sockEmit('undo line', 0);
}

/**
 * Clear button clicked.
 */
function clear() {
    draw.clear();
    sockEmit('clear canvas', 0);
}