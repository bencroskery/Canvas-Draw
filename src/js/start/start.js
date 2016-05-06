import Draw from './draw'

var canvas = document.getElementById('draw'),
    draw = new Draw(canvas);

let landscape = true;

/**
 * Resize the game window, set the fontSize for CSS sizing, and ask the drawing to resize.
 */
function resize() {
    const ASPECT = 16 / 9, PX = "px";
    let width = window.innerWidth,
        height = window.innerHeight,
        gameBox = document.getElementById("game"),
        left = document.getElementById("left"),
        center = document.getElementById("center"),
        right = document.getElementById("right"),
        shortest;


    if (width >= height * 1.25 && !landscape) {
        console.log("switch landscape");
        gameBox.classList.remove("portrait");
        gameBox.classList.add("landscape");
        left.style.height = center.style.height = right.style.height = "";
        landscape = true;
    } else if (width < height * 1.25 && landscape) {
        console.log("switch portrait");
        gameBox.classList.remove("landscape");
        gameBox.classList.add("portrait");
        left.style.width = center.style.width = right.style.width = "";
        landscape = false;
    }

    if (landscape) {
        shortest = height;
        center.style.width = height * 1.25 + PX;
        let w = width - height * 1.25;
        left.style.width = w / 4 + PX;
        right.style.width = w * 3 / 4 + PX;
    } else {
        shortest = width;
        center.style.height = width * 0.8 + PX;
        let h = height - width * 0.8;
        left.style.height = right.style.height = h + PX;
    }

    draw.resize();

    // Set the font size based off size and scaling factor (16pt font / 1280px width).
    document.body.style.fontSize = shortest / 45 + PX;
}
resize();