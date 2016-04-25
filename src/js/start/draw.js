/**
 * Used to apply a color to the line at an index.
 */
class ColorIndex {
    constructor(i, c) {
        this.index = i;
        this.color = c;
    }
}

// Fallback for missing devicePixelRatio (IE10 or lower).
if (!window.devicePixelRatio)
    window.devicePixelRatio = (window.screen.deviceXDPI / window.screen.logicalXDPI) || 1;

/**
 * Initialize the Draw object connected to the canvas parameter.
 *
 * @param canvas
 * @constructor
 */
class Draw {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.clientWidth * window.devicePixelRatio;
        this.height = canvas.clientHeight * window.devicePixelRatio;
        this.actions = [];          // List of actions.
        this.layer = [];            // List of layers.
        this.line = [];             // List of all the lines drawn.
        this.fillLength = 0;        // The index of lines after fills.
    }

    setRadius(r, l) {
        this.checkLayer(l || 0);
        this.layer[l || 0].radius = r;
    }

    setColor(c, l) {
        this.checkLayer(l || 0);
        this.layer[l || 0].color = c;
    }

    getWidth() {
        return this.canvas.clientWidth;
    }

    getHeight() {
        return this.canvas.clientHeight;
    }

    /**
     * Initialize a layer if it does not exist yet.
     * @param l
     */
    checkLayer(l) {
        if (this.layer[l] === undefined) {
            this.layer[l] = {
                color: 'rgb(0, 0, 0)',
                radius: 10,
                line: null,
                current: null
            }
        }
    }

    /**
     * Cut out the layer at the index.
     * @param l
     */
    spliceLayer(l) {
        this.layer.splice(l, 1);
    }

    /**
     * Resize the canvas width and height to the actual width and height.
     * @param reScale Properly size all lines.
     */
    resize(reScale) {
        let newWidth = this.canvas.clientWidth * window.devicePixelRatio;
        let newHeight = this.canvas.clientHeight * window.devicePixelRatio;

        // Resize all the lines based off the change in scale.
        if (reScale) {
            let i, j, scaling = newWidth / this.width;
            for (i = 0; i < this.line.length; i++) {
                this.line[i].width *= scaling;
                for (j = 0; j < this.line[i].point.length; j++) {
                    this.line[i].point[j].x *= scaling;
                    this.line[i].point[j].y *= scaling;
                }
            }
            for (i = 0; i < this.layer.length; i++) {
                if (this.layer[i] !== undefined && this.layer[i].line !== null) {
                    this.layer[i].line.width *= scaling;
                    for (j = 0; j < this.layer[i].line.point.length; j++) {
                        this.layer[i].line.point[j].x *= scaling;
                        this.layer[i].line.point[j].y *= scaling;
                    }
                }
            }
        }

        this.canvas.width = this.width = newWidth;
        this.canvas.height = this.height = newHeight;

        this.reDraw();
    }

    /**
     * Start a new line with a point.
     * @param x
     * @param y
     * @param l
     */
    down(x, y, l) {
        l = l || 0;

        // Get the layer and line ready if needed.
        this.checkLayer(l);
        if (this.layer[l].line !== null) this.pushLine(l);

        // Setup a new line and draw the point.
        this.layer[l].line = {
            point: [],
            rgb: this.layer[l].color,
            width: this.layer[l].radius * 2 * this.width / 1280
        };
        this.layer[l].current = null;
        this.drawPoint(x, y, l);
    }

    /**
     * Continue dragging out the line with a point.
     * @param x
     * @param y
     * @param l
     */
    drag(x, y, l) {
        this.drawPoint(x, y, l || 0);
    }

    /**
     * Finished with current line.
     * @param l
     */
    up(l) {
        this.pushLine(l || 0);
    }

    /**
     * Adds a point the current line and draws it.
     * @param x
     * @param y
     * @param l
     */
    drawPoint(x, y, l) {
        x *= window.devicePixelRatio;
        y *= window.devicePixelRatio;

        let last = this.layer[l].current || {x: x + 0.01, y: y}; // Fix for single points.

        // Set the current point to the point given.
        this.layer[l].current = {x: x, y: y};
        this.layer[l].line.point[this.layer[l].line.point.length] = this.layer[l].current;

        // Draw the line between the points.
        this.ctx.lineJoin = "round";
        this.ctx.strokeStyle = this.layer[l].line.rgb;
        this.ctx.lineWidth = this.layer[l].line.width;
        this.ctx.beginPath();
        this.ctx.moveTo(last.x, last.y);
        this.ctx.lineTo(this.layer[l].current.x, this.layer[l].current.y);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    /**
     * Push a layer onto the line stack.
     * @param l
     */
    pushLine(l) {
        // Make sure the layer line is available to push.
        if (this.layer[l] !== undefined && this.layer[l].line !== null) {
            this.actions[this.actions.length] = 0;
            this.line[this.line.length] = this.layer[l].line;
            this.layer[l].line = null;
        }
    }

    /**
     * Undo last action.
     */
    undo() {
        if (this.line.length === 0) return;

        let act = this.actions.pop();
        switch (act) {
            case 0:
                this.line.pop();
                break;
            case 1:
                this.line.splice((--this.fillLength), 1);
                break;
            default:
                if (act instanceof ColorIndex)
                    this.line[act.index].rgb = act.color;
        }

        this.reDraw();
    }

    /**
     * Clears the canvas.
     */
    clear() {
        this.dump();
        this.ctx.clearRect(0, 0, this.width, this.height); // Clears the canvas
    }

    /**
     * Dumps all lines out to be forgotten.
     */
    dump() {
        this.line.length = 0;
    }

    /**
     * Redraw all the lines.
     */
    reDraw() {
        this.ctx.clearRect(0, 0, this.width, this.height); // Clears the canvas

        this.ctx.lineJoin = this.ctx.lineCap = "round";

        let i, n;
        // Redraw saved lines.
        for (i = 0; i < this.line.length; i++) {
            reLine(this.line[i], this.ctx);
        }
        // Redraw layer lines.
        for (i = 0; i < this.layer.length; i++) {
            if (this.layer[i] !== undefined && this.layer[i].line !== null) {
                reLine(this.layer[i].line, this.ctx);
            }
        }

        function reLine(line, ctx) {
            ctx.strokeStyle = line.rgb;
            ctx.lineWidth = Math.abs(line.width);

            if (line.width === 0) {
                ctx.fillStyle = line.rgb;
                ctx.beginPath();
                ctx.moveTo(line.point[0].x, line.point[0].y);
                for (n = 1; n < line.point.length; n++) {
                    ctx.lineTo(line.point[n].x, line.point[n].y);
                }
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(line.point[0].x, line.point[0].y);
                ctx.lineTo(line.point[0].x + 0.01, line.point[0].y); // Fix for single points.
                for (n = 1; n < line.point.length; n++) {
                    ctx.lineTo(line.point[n].x, line.point[n].y);
                }
                if (line.width < 0) {
                    ctx.closePath();
                    ctx.fillStyle = line.rgb;
                    ctx.fill();
                }
                ctx.stroke();
            }
        }
    }

    /**
     * Fill the current line.
     */
    fill(l) {
        l = l || 0;
        // Complete the loop of the current line.
        this.ctx.lineJoin = "round";
        this.ctx.strokeStyle = this.layer[l].line.rgb;
        this.ctx.lineWidth = this.layer[l].line.width;
        this.ctx.beginPath();
        this.ctx.moveTo(this.layer[l].current.x, this.layer[l].current.y);
        this.ctx.lineTo(this.layer[l].line.point[0].x, this.layer[l].line.point[0].y);
        this.ctx.closePath();
        this.ctx.stroke();

        // Fill the area from the path of the line.
        this.ctx.beginPath();
        this.ctx.moveTo(this.layer[l].line.point[0].x, this.layer[l].line.point[0].y);
        for (let n = 1; n < this.layer[l].line.point.length; n++) {
            this.ctx.lineTo(this.layer[l].line.point[n].x, this.layer[l].line.point[n].y);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = this.layer[l].line.rgb;
        this.ctx.fill();

        this.layer[l].line.width *= -1;
        this.pushLine(l);
    }

    /**
     * Bucket fill based on a point.
     * @param x
     * @param y
     * @param l
     */
    bucket(x, y, l) {
        x *= window.devicePixelRatio;
        y *= window.devicePixelRatio;

        let imgCol = (this.ctx.getImageData(x, y, 1, 1).data);
        let pixCol = 'rgb(' + imgCol[0] + ', ' + imgCol[1] + ', ' + imgCol[2] + ')';
        this.checkLayer(l);
        if (this.layer[l].color === pixCol && imgCol[3] !== 0) {
            return;
        }
        // If the size is zero then just fill the background.
        if (this.line.length === 0 || imgCol[3] === 0) {
            this.actions[this.actions.length] = 1;
            this.line = [{
                point: [{x: -5, y: -5}, // 4 point square background.
                    {x: this.width, y: -5},
                    {x: this.width, y: this.height},
                    {x: 0, y: this.height}],
                rgb: this.layer[l].color,
                width: -1
            }].concat(this.line);
            this.fillLength++;
            this.reDraw();
            return;
        }

        // Check elements for color replace.
        let found = [];
        for (let n = 0; n < this.line.length; n++) {
            if (this.line[n].rgb === pixCol) {
                found[found.length] = n;
            }
        }

        // Set the element color if there is 1.
        if (found.length === 1) {
            this.actions[this.actions.length] = new ColorIndex(found[0], this.line[found[0]].rgb);
            this.line[found[0]].rgb = this.layer[l].color;
        }
        // Find the best and set it.
        else if (found.length > 1) {
            let minDist = new Array(found.length);
            // Get the distance from each line (closest point).
            for (let i = 0; i < found.length; i++) {
                minDist[i] = 0;
                for (let j = 0; j < this.line[found[i]].point.length; j++) {
                    let currPoint = this.line[found[i]].point[j];
                    let nextDist = Math.pow(currPoint.x - x, 2) + Math.pow(currPoint.y - y, 2);
                    if (nextDist < minDist[i] || j === 0) {
                        minDist[i] = nextDist;
                    }
                }
            }
            // Choose to the closest line to change.
            let best = 0;
            for (let k = 1; k < minDist.length; k++) {
                if (minDist[k] < minDist[best]) {
                    best = k;
                }
            }
            this.actions[this.actions.length] = new ColorIndex(found[best], this.line[found[best]].rgb);
            this.line[found[best]].rgb = this.layer[l].color;
        }
        // Do something else...
        else {

        }
        this.reDraw();
    }

    /**
     * Export the lines to an SVG.
     * @param speed Optional parameter to draw the lines out.
     * @returns {String}
     */
    exportSVG(speed) {
        let lx, ly, output = "<svg class='draw' xmlns='http://www.w3.org/2000/svg' " +
            "stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 " + this.width + " " + this.height + "'>";

        // Create path for each line.
        for (let i = 0; i < this.line.length; i++) {
            lx = Math.round(this.line[i].point[0].x);
            ly = Math.round(this.line[i].point[0].y);

            output += "<path stroke='" + this.line[i].rgb
                + "' stroke-width='" + Math.round(Math.abs(this.line[i].width))
                + "' fill='" + (this.line[i].width >= 0 ? "none" : this.line[i].rgb)
                + "' d='M" + lx + " " + ly + "L";

            let k, rad = Math.abs(this.line[i].width / 2);
            for (k = 1; k < this.line[i].point.length - 1; k++) {
                // Draw another point if there is a length of at least the line radius (width/2).
                if (Math.abs(this.line[i].point[k].x - lx) + Math.abs(this.line[i].point[k].y - ly) > rad) {
                    lx = Math.round(this.line[i].point[k].x);
                    ly = Math.round(this.line[i].point[k].y);
                    output += lx + " " + ly + " ";
                }
            }
            // Always add last point.
            lx = Math.round(this.line[i].point[k].x);
            ly = Math.round(this.line[i].point[k].y);
            output += lx + " " + ly + " ";

            output += (this.line[i].width >= 0 ? "'>" : "Z'>") + "</path>";
        }
        output += "</svg>";

        if (speed) {
            output += '<script>function e(){if(t<n.length){var f=l++/(o[t]||1)*i;f?1>f?n[t].style.strokeDashoffset=o[t]*(1-f):f<1+r/(o[t]+1)?n[t].style.strokeDashoffset=0:("none"!=a&&(n[t].style.fill=a),l=0,t++):(a=n[t].style.fill,"none"!=a&&(n[t].style.fill="rgba(0,0,0,0)",n[t].style.transition="fill '
                + (10.0 / speed).toFixed(2) + 's ease-out"),n[t].style.display="initial"),s=window.requestAnimationFrame(e)}else window.cancelAnimationFrame(s)}var t,l,s,a,n=document.querySelectorAll(".draw path"),o=[],i='
                + speed + ',r=1e3/i;for(t=0;t<n.length;){var f=o[t]=n[t].getTotalLength();n[t].style.display="none",n[t].style.strokeDasharray=f+" "+f,n[t++].style.strokeDashoffset=Math.floor(f)}t=l=0,e()</script>';
        }

        return output;
    }
}

export default Draw;