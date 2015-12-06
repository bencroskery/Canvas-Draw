"use strict";

/**
 *
 * @param canvas
 * @constructor
 */
function Draw(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    this.actions = [];          // List of actions.
    this.layer = [];            // List of layers.
    this.line = [];             // List of all the lines drawn.
    this.lindex = 0;            // The index of lines after fills.
}

Draw.prototype.setRadius = function (r, l) {
    this.checkLayer(l || 0);
    this.layer[l || 0].radius = r;
};
Draw.prototype.setColor = function (c, l) {
    this.checkLayer(l || 0);
    this.layer[l || 0].color = c;
};
Draw.prototype.getWidth = function () {
    return this.width;
};
Draw.prototype.getHeight = function () {
    return this.height;
};

Draw.prototype.checkLayer = function (l) {
    if (this.layer[l] === undefined) {
        this.layer[l] = {
            color: 'rgb(0, 0, 0)',
            radius: 10,
            line: null
        }
    } else if (this.layer[l].line !== null) {
        this.pushLine(l);
    }
};

Draw.prototype.spliceLayer = function (l) {
    this.layer.splice(l, 1);
};

/**
 * Resize the canvas width and height to the actual width and height.
 */
Draw.prototype.resized = function () {
    /*var scaling = canvas.clientWidth / width; Doesn't work on such small resize events.
     for (var i = 0; i < size; i++) {
     for (var j = 0; j < line[i].length; j++) {
     line[i].point[j].x = line[i].point[j].x * scaling;
     line[i].point[j].y = line[i].point[j].y * scaling;
     }
     }*/
    this.canvas.width = this.width = this.canvas.clientWidth;
    this.canvas.height = this.height = this.canvas.clientHeight;

    this.reDraw();
};

/**
 * Start a new line with a point.
 * @param x
 * @param y
 * @param scale
 * @param l
 */
Draw.prototype.down = function (x, y, scale, l) {
    l = l || 0;
    this.checkLayer(l);
    this.layer[l].line = {
        point: [],
        rgb: this.layer[l].color,
        width: this.layer[l].radius * 2 * this.width / scale
    };
    this.layer[l].current = null;
    this.drawPoint(x, y, l);
};

/**
 * Continue dragging out the line with a point.
 * @param x
 * @param y
 * @param l
 */
Draw.prototype.drag = function (x, y, l) {
    this.drawPoint(x, y, l || 0);
};

/**
 * Finished with current line.
 * @param l
 */
Draw.prototype.up = function (l) {
    this.pushLine(l || 0);
};

/**
 * Adds a point the current line and draws it.
 * @param px
 * @param py
 * @param l
 */
Draw.prototype.drawPoint = function (px, py, l) {
    var last = this.layer[l].current || {x: px + 0.01, y: py};
    // Set the current point to the point given.
    this.layer[l].current = {x: px, y: py};
    this.layer[l].line.point.push(this.layer[l].current);

    // Draw the line between the points.
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = this.layer[l].line.rgb;
    this.ctx.lineWidth = this.layer[l].line.width;
    this.ctx.beginPath();
    this.ctx.moveTo(last.x, last.y);
    this.ctx.lineTo(this.layer[l].current.x, this.layer[l].current.y);
    this.ctx.closePath();
    this.ctx.stroke();
};

/**
 * Push a layer onto the line stack.
 * @param l
 */
Draw.prototype.pushLine = function (l) {
    if (this.layer[l] !== undefined && this.layer[l].line !== null) {
        this.actions.push(0);
        this.line.push(this.layer[l].line);
        this.layer[l].line = null;
    }
};

/**
 * Undo last action.
 */
Draw.prototype.undo = function () {
    if (this.line.length === 0) {
        return;
    }
    var act = this.actions.pop();
    if (act === 0 && this.line.length > 0) {
        this.line.pop();
        this.reDraw();
    } else if (act === 1) {
        this.line.splice(this.lindex - 1, 1);
        this.lindex--;
        this.reDraw();
    } else {
        this.line[act.index].rgb = act.color;
        this.reDraw();
    }
};

/**
 * Clears all lines from the canvas.
 */
Draw.prototype.clear = function () {
    this.line = [];
    this.ctx.clearRect(0, 0, this.width, this.height); // Clears the canvas
};

/**
 * Redraw all the lines.
 */
Draw.prototype.reDraw = function () {
    this.ctx.clearRect(0, 0, this.width, this.height); // Clears the canvas

    this.ctx.lineJoin = this.ctx.lineCap = "round";

    var i, n;
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
        } else if (line.point.length < 2) {
            ctx.beginPath();
            ctx.moveTo(line.point[0].x - 0.1, line.point[0].y);
            ctx.lineTo(line.point[0].x, line.point[0].y);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(line.point[0].x, line.point[0].y);
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
};

/**
 * Fill the current line.
 */
Draw.prototype.fill = function (l) {
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
    for (var n = 1; n < this.layer[l].line.point.length; n++) {
        this.ctx.lineTo(this.layer[l].line.point[n].x, this.layer[l].line.point[n].y);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = this.layer[l].line.rgb;
    this.ctx.fill();

    this.layer[l].line.width *= -1;

};

/**
 * Bucket fill based on a point.
 * @param x
 * @param y
 * @param l
 */
Draw.prototype.bucket = function (x, y, l) {
    var imgCol = (this.ctx.getImageData(x, y, 1, 1).data);
    var pixCol = 'rgb(' + imgCol[0] + ', ' + imgCol[1] + ', ' + imgCol[2] + ')';
    console.log(pixCol);
    if (this.layer[l].color === pixCol && imgCol[3] !== 0) {
        return;
    }
    // If the size is zero then just fill the background.
    if (this.line.length === 0 || imgCol[3] === 0) {
        this.actions.push(1);
        this.line.unshift({
            point: [{x: -5, y: -5}, {x: this.width, y: -5}, {
                x: this.width,
                y: this.height
            }, {x: 0, y: this.height}],
            rgb: this.layer[l].color,
            width: -1
        });
        this.lindex++;
        this.reDraw();
        return;
    }

    // Check elements for color replace.
    var found = [];
    for (var n = 0; n < this.line.length; n++) {
        console.log(this.line[n].rgb);
        if (this.line[n].rgb === pixCol) {
            found.push(n);
        }
    }
    console.log(found.length);

    if (found.length === 1) {  // Set the element color if there is 1.
        this.actions.push({index: found[0], color: this.line[found[0]].rgb});
        this.line[found[0]].rgb = this.layer[l].color;
    }
    else if (found.length > 1) {  // Find the best and set it.
        var minDist = new Array(found.length);
        for (var i = 0; i < found.length; i++) {
            minDist[i] = -1;
            for (var j = 0; j < this.line[found[i]].point.length; j++) {
                var nextDist = Math.pow((this.line[found[i]].point[j].x - x), 2) + Math.pow((this.line[found[i]].point[j].y - y), 2);
                console.log(i + "-" + j + ': ' + nextDist);
                if (nextDist < minDist[i] || minDist[i] === -1) {
                    minDist[i] = nextDist;
                }
            }
        }
        var best = 0;
        for (var k = 1; k < minDist.length; k++) {
            if (minDist[k] < minDist[best]) {
                best = k;
            }
        }
        console.log(minDist);
        this.actions.push({index: found[best], color: this.line[found[best]].rgb});
        this.line[found[best]].rgb = this.layer[l].color;
    }
    else {  // Do something else...

    }
    console.log('done');
    this.reDraw();
};