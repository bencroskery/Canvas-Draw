// A set of tools used in the game.
if (!(document.addEventListener || false))
    document.body.innerHTML = "<a href='https://browser-update.org/update.html'>Unfortunately your browser is not supported.</a>";

if (!("classList" in document.documentElement))
    addPolyfill("classList");

if (!Array.from)
    addPolyfill("Array.from");

const range = document.getElementById('sizeIn');
if (!(range.type !== 'text')) {
    range.disabled = true;
}

function addPolyfill(name) {
    let fill = document.createElement("script");
    fill.setAttribute("type", "text/javascript");
    fill.setAttribute("src", "polyfill/" + name + ".js");
    document.body.appendChild(fill);
    console.log("Loaded " + name + " polyfill.");
}


/**
 * Fade an element out.
 * @param {String} id
 * @param {Boolean} [keep]
 */
export function fadeOut(id, keep) {
    var s = document.getElementById(id).style;
    var val = s.opacity = 1;
    (function f() {
        s.opacity = (val -= .1).toFixed(1);
        val <= 0.1 ? s.display = keep ? "" : "none" : setTimeout(f, 40);
    })();
}

/**
 * Fade an element in.
 * @param {String} id
 */
export function fadeIn(id) {
    var s = document.getElementById(id).style;
    var val = s.opacity = 0;
    s.display = "";
    (function f() {
        s.opacity = (val += .1);
        val < 0.9 ? setTimeout(f, 40) : 0;
    })();
}

/**
 * Open/Close the menu element.
 * @param {Element} el
 */
export function openMenu(el) {
    if (el.classList.contains("open")) {
        el.classList.remove("open");
        fadeOut('settings');
    } else {
        el.classList.add("open");
        fadeIn('settings');
    }
}

/**
 * A nice random RGB value.
 * @returns {string} in RGB format.
 */
export function randRGB() {
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