import Draw from './draw'

let canvas = document.getElementById('draw'),
    draw = new Draw(canvas),
    resize;

(function () {
    let mode = 0;

    /**
     * Resize the game window, set the fontSize for CSS sizing, and ask the drawing to resize.
     */
    resize = function () {
        const PX = "px";
        let width = window.innerWidth,
            height = window.innerHeight,
            gameBox = document.getElementById("game"),
            left = document.getElementById("left"),
            center = document.getElementById("center"),
            bottom = document.getElementById("bottom"),
            shortest;

        let aspect = width / height;

        /*

         0  +     Desktop
         1  1.62  Squished
         2  1.48  Scale desktop
         3  1.00  Scale mobile
         4  -     Mobile

         */
        const DESKTOP = 1.7;
        const MID     = 1.5;
        const MOBILE  = 1.0;
        console.log(aspect);

        // Desktop -> Squished
        if (aspect < DESKTOP && mode === 0) {
            // move left to bottom.
            gameBox.removeChild(left);
            bottom.appendChild(left);

            mode = 1;
        }
        // Squished -> Scale desktop
        if (aspect < MID && mode === 1) {
            gameBox.classList.add("scaled");

            mode = 2;
        }
        // Scale desktop -> Mobile
        if (aspect < MOBILE && (mode === 2 || mode === 3)) {
            // Switch classes.
            gameBox.classList.add("mobile");
            gameBox.classList.remove("scaled", "desktop");

            mode = 4;
        }

        // Mobile -> Scale mobile
        if (aspect > MOBILE && mode === 4) {
            gameBox.classList.add("scaled");

            mode = 3;
        }
        // Scale mobile -> Squished
        if (aspect > MID && (mode === 3 || mode === 2)) {
            // Switch classes.
            gameBox.classList.add("desktop");
            gameBox.classList.remove("scaled", "mobile");

            mode = 1;
        }
        // Squished -> Desktop
        if (aspect > DESKTOP && mode === 1) {
            // move left to gamebox.
            bottom.removeChild(left);
            gameBox.appendChild(left);

            mode = 0;
        }

        // Fixes for scaled sizes.
        if (mode === 2) {
            height = width / 1.48;
        }
        if (mode === 3) {
            width = height;
        }

        if (mode < 3) {
            // Flex width in desktop.
            center.style.flexBasis = center.style.msFlexPreferredSize = height * 1.25 + PX;
            shortest = height;
        } else {
            // Flex height in mobile.
            center.style.flexBasis = center.style.msFlexPreferredSize = width * 0.8 + PX;
            shortest = width;
        }

        draw.resize();

        // Set the font size based off size and scaling factor (16pt font / 1280px width).
        center.style.fontSize = shortest / 45 + PX;
    };
    resize();

    setTimeout(resize, 50);

    // Loaded up, do a spin!
    document.getElementById("logo").classList.add("spin");
})();
