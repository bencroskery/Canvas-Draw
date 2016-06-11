import Draw from './draw'

var canvas = document.getElementById('draw'),
    draw = new Draw(canvas);

let landscape = true;

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
        right = document.getElementById("right"),
        shortest;
    
    if (width >= height * 1.30 && !landscape) {
        console.log("switch to landscape");
        // Switch classes.
        gameBox.classList.remove("portrait");
        gameBox.classList.add("landscape");
        landscape = true;

        gameBox.insertBefore(left, center);
        gameBox.appendChild(right);
        gameBox.removeChild(document.getElementById("bottom"));
    } else if (width < height * 1.30 && landscape) {
        console.log("switch to portrait");
        // Switch classes.
        gameBox.classList.remove("landscape");
        gameBox.classList.add("portrait");
        landscape = false;

        let bottom = document.createElement("div");
        bottom.id = "bottom";
        bottom.appendChild(left);
        bottom.appendChild(right);
        gameBox.appendChild(bottom);
    }

    if (landscape) {
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
    document.body.style.fontSize = shortest / 45 + PX;
}
resize();