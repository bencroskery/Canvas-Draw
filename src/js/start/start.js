import Draw from './draw'

let canvas = document.getElementById('draw'),
    draw = new Draw(canvas);

let mode = 2;

/**
 * Resize the game window, set the fontSize for CSS sizing, and ask the drawing to resize.
 */
function resize() {
    const PX = "px";
    let width = window.innerWidth,
        height = window.innerHeight - 36,
        gameBox = document.getElementById("game"),
        left = document.getElementById("left"),
        center = document.getElementById("center"),
        bottom = document.getElementById("bottom"),
        shortest;

    let asp = width/height;
    console.log(asp);

    if ((asp < 1.62 && mode === 2) || (asp > 1.30 && mode === 0)) {
        if (mode === 2) {
            // move left to bottom.
            gameBox.removeChild(left);
            bottom.appendChild(left);
        } else {
            // Switch classes.
            gameBox.classList.remove("portrait");
            gameBox.classList.add("landscape");
        }

        mode = 1;
        console.log("switch to " + mode);
    }
    if (asp > 1.62 && mode !== 2) {
        // move left to gamebox.
        bottom.removeChild(left);
        gameBox.appendChild(left);

        mode = 2;
        console.log("switch to " + mode);
    }
    if (asp < 1.30 && mode !== 0) {
        // Switch classes.
        gameBox.classList.remove("landscape");
        gameBox.classList.add("portrait");

        mode = 0;
        console.log("switch to " + mode);
    }

    if (mode != 0) {
        shortest = height;
        // Setting flex width in landscape.
        center.style.flexBasis = center.style.msFlexPreferredSize = height * 1.25 + PX;
    } else {
        shortest = width;
        // Setting flex height in portrait, subtract menu height.
        center.style.flexBasis = center.style.msFlexPreferredSize = width * 0.8 + PX;
    }

    draw.resize();

    // Set the font size based off size and scaling factor (16pt font / 1280px width).
    center.style.fontSize = shortest / 45 + PX;
}
resize();

// Loaded up, do a spin!
document.getElementById("logo").classList.add("spin");