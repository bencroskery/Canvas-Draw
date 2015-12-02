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
    this.actions = [];                // List of actions.
    this.line = [];                   // A set of all the lines drawn.
    this.lindex = 0;                  // The index of lines after fills.
    this.size = 0;                    // The number of lines that have been drawn.
    this.color = 'rgb(0, 0, 0)';      // The current color to use on new lines.
    this.radius = 10;                 // The current radius to use on new lines.
    this.current = {x: 0, y: 0};      // The most recent point.
}

Draw.prototype.setRadius = function (r) {
    this.radius = r;
};
Draw.prototype.setColor = function (c) {
    this.color = c;
};
Draw.prototype.getWidth = function () {
    return this.width;
};
Draw.prototype.getHeight = function () {
    return this.height;
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
 */
Draw.prototype.down = function (x, y, scale) {
    this.actions.push(0);
    this.line.push({
        point: [],
        rgb: this.color,
        width: this.radius * 2 * this.width / scale
    });
    this.size++;
    this.current = null;
    this.drawPoint(x, y);
};

/**
 * Continue dragging out the line with a point.
 * @param x
 * @param y
 */
Draw.prototype.drag = function (x, y) {
    this.drawPoint(x, y);
};

/**
 * Undo last action.
 */
Draw.prototype.undo = function () {
    if (this.size === 0) {
        return;
    }
    var act = this.actions.pop();
    if (act === 0 && this.size > 0) {
        this.line.pop();
        this.size--;
        this.reDraw();
    } else if (act === 1) {
        this.line.splice(this.lindex - 1, 1);
        this.lindex--;
        this.size--;
        this.reDraw();
    } else {
        this.line[act.index].rgb = act.color;
        this.reDraw();
    }
};

/**
 * Reset and clear canvas.
 */
Draw.prototype.reset = function () {
    this.color = 'rgb(0, 0, 0)';
    this.radius = 10;
    this.clear();
};

/**
 * Clears all lines from the canvas.
 */
Draw.prototype.clear = function () {
    this.line = [];
    this.size = 0;
    this.ctx.clearRect(0, 0, this.width, this.height); // Clears the canvas
};

/**
 * Adds a point the current line and draws it.
 * @param px
 * @param py
 */
Draw.prototype.drawPoint = function (px, py) {
    var last = this.current || {x: px + 0.01, y: py};
    // Set the current point to the point given.
    this.current = {x: px, y: py};
    this.line[this.size - 1].point.push(this.current);

    // Draw the line between the points.
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = this.line[this.size - 1].rgb;
    this.ctx.lineWidth = this.line[this.size - 1].width;
    this.ctx.beginPath();
    this.ctx.moveTo(last.x, last.y);
    this.ctx.lineTo(this.current.x, this.current.y);
    this.ctx.closePath();
    this.ctx.stroke();
};

/**
 * Redraw all the lines.
 */
Draw.prototype.reDraw = function () {
    this.ctx.clearRect(0, 0, this.width, this.height); // Clears the canvas

    this.ctx.lineJoin = this.ctx.lineCap = "round";

    for (var i = 0; i < this.size; i++) {
        this.ctx.strokeStyle = this.line[i].rgb;
        this.ctx.lineWidth = Math.abs(this.line[i].width);

        if (this.line[i].width === 0) {
            this.ctx.fillStyle = this.line[i].rgb;
            this.ctx.beginPath();
            this.ctx.moveTo(this.line[i].point[0].x, this.line[i].point[0].y);
            for (var n = 1; n < this.line[i].point.length; n++) {
                this.ctx.lineTo(this.line[i].point[n].x, this.line[i].point[n].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
        } else if (this.line[i].point.length < 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.line[i].point[0].x - 0.1, this.line[i].point[0].y);
            this.ctx.lineTo(this.line[i].point[0].x, this.line[i].point[0].y);
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(this.line[i].point[0].x, this.line[i].point[0].y);
            for (var n = 1; n < this.line[i].point.length; n++) {
                this.ctx.lineTo(this.line[i].point[n].x, this.line[i].point[n].y);
            }
            if (this.line[i].width < 0) {
                this.ctx.closePath();
                this.ctx.fillStyle = this.line[i].rgb;
                this.ctx.fill();
            }
            this.ctx.stroke();
        }
    }
};

/**
 * Fill the current line.
 */
Draw.prototype.fill = function () {
    // Complete the loop of the current line.
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = this.line[this.size - 1].rgb;
    this.ctx.lineWidth = this.line[this.size - 1].width;
    this.ctx.beginPath();
    this.ctx.moveTo(this.current.x, this.current.y);
    this.ctx.lineTo(this.line[this.size - 1].point[0].x, this.line[this.size - 1].point[0].y);
    this.ctx.closePath();
    this.ctx.stroke();

    // Fill the area from the path of the line.
    this.ctx.beginPath();
    this.ctx.moveTo(this.line[this.size - 1].point[0].x, this.line[this.size - 1].point[0].y);
    for (var n = 1; n < this.line[this.size - 1].point.length; n++) {
        this.ctx.lineTo(this.line[this.size - 1].point[n].x, this.line[this.size - 1].point[n].y);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = this.line[this.size - 1].rgb;
    this.ctx.fill();

    this.line[this.size - 1].width *= -1;
};

/**
 * Bucket fill based on a point.
 * @param x
 * @param y
 */
Draw.prototype.bucket = function (x, y) {
    var imgCol = (this.ctx.getImageData(x, y, 1, 1).data);
    var pixCol = 'rgb(' + imgCol[0] + ', ' + imgCol[1] + ', ' + imgCol[2] + ')';
    console.log(pixCol);
    if (this.color === pixCol && imgCol[3] !== 0) {
        return;
    }
    // If the size is zero then just fill the background.
    if (this.size === 0 || imgCol[3] === 0) {
        this.actions.push(1);
        this.line.unshift({
            point: [{x: -5, y: -5}, {x: this.width, y: -5}, {
                x: this.width,
                y: this.height
            }, {x: 0, y: this.height}],
            rgb: this.color,
            width: -1
        });
        this.lindex++;
        this.size++;
        this.reDraw();
        return;
    }

    // Check elements for color replace.
    var found = [];
    for (var i = 0; i < this.size; i++) {
        console.log(this.line[i].rgb);
        if (this.line[i].rgb === pixCol) {
            found.push(i);
        }
    }
    console.log(found.length);

    if (found.length === 1) {  // Set the element color if there is 1.
        this.actions.push({index: found[0], color: this.line[found[0]].rgb});
        this.line[found[0]].rgb = this.color;
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
        this.line[found[best]].rgb = this.color;
    }
    else {  // Do something else...

    }
    console.log('done');
    this.reDraw();
};