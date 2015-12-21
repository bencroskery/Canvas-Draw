// A set of tools used in the game.

/**
 * Fade an element out.
 * @param id
 */
function fadeOut(id) {
    var s = document.getElementById(id).style;
    var val = s.opacity = 1;
    (function fade() {
        s.opacity = (val -= .1).toFixed(1);
        val <= 0.1 ? s.display = "none" : setTimeout(fade, 40);
    })();
}

/**
 * Fade an element in.
 * @param id
 */
function fadeIn(id) {
    var s = document.getElementById(id).style;
    var val = s.opacity = 0;
    s.display = "inherit";
    (function fade() {
        s.opacity = (val += .1);
        val < 0.9 ? setTimeout(fade, 40) : 0;
    })();
}

/**
 * Open/Close the menu element.
 * @param el
 */
function openMenu(el) {
    var cName = el.className;
    if (cName.substring(cName.length - 4, cName.length) === "open") {
        el.className = cName.substring(0, cName.length - 5);
        fadeOut('settings');
    } else {
        el.className += " open";
        fadeIn('settings');
    }
}

/**
 * A nice random RGB value.
 * @returns {string} in RGB format.
 */
function randRGB() {
    var h, s, v, c, x, m, r, g, b;
    h = ((Math.random() + 0.618033988749895) % 1) * 6;
    s = 0.8;
    v = 0.9;
    c = v * s;
    x = c * Math.abs(h % 2 - 1);
    m = v - c;
    switch (Math.floor(h) % 6) { //@formatter:off
        case 0: r = c, g = x, b = 0; break;
        case 1: r = x, g = c, b = 0; break;
        case 2: r = 0, g = c, b = x; break;
        case 3: r = 0, g = x, b = c; break;
        case 4: r = x, g = 0, b = c; break;
        case 5: r = c, g = 0, b = x; break;
    } //@formatter:on
    return 'rgb(' + Math.round((r + m) * 255) + ',' + Math.round((g + m) * 255) + ',' + Math.round((b + m) * 255) + ')';
}