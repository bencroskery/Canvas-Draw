function Draw(canvasElement) {
    var canvas = canvasElement
      , ctx = canvas.getContext("2d")
      , width = canvas.clientWidth
      , height = canvas.clientHeight
      , actions = new Array()       // List of actions.
      , line = new Array()          // A set of all the lines drawn.
      , lindex = 0                  // The index of lines after fills.
      , size = 0                    // The number of lines that have been drawn.
      , color = 'rgb(0, 0, 0)'      // The current color to use on new lines.
      , radius = 10                 // The current radius to use on new lines.
      , current = { x : 0, y : 0 }  // The most recent point.
      , last = { x : 0, y : 0 }     // The second most recent point.
    
    this.setRadius = function (r) {
        radius = r;
    }
    
    this.setColor = function (c) {
        color = c;
    }
    
    this.getWidth = function () {
        return width;
    }
    
    this.getHeight = function () {
        return height;
    }
    
    this.resized = function () {
        /*var scaling = canvas.clientWidth / width; Doesn't work on such small resize events.
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < line[i].length; j++) {
                line[i].point[j].x = line[i].point[j].x * scaling;
                line[i].point[j].y = line[i].point[j].y * scaling;
            }
        }*/

        width = canvas.clientWidth;
        height = canvas.clientHeight;
        ctx.canvas.width = width;
        ctx.canvas.height = height;
        
        this.reDraw();
    }
    
    // Start a line when the mouse goes down.
    this.down = function (x, y) {
        actions.push(0);
        line.push({
            point : new Array(),
            rgb : color,
            width : radius * 2 * width / STDWIDTH
        });
        size++;
        last = null;
        this.drawPoint(x, y);
    }
    
    // Continue a line as the mouse is dragging.
    this.drag = function (x, y) {
        this.drawPoint(x, y);
    }
    
    // Undo last action.
    this.undo = function () {
        if (size === 0) {
            return;
        }
        var act = actions.pop();
        if (act === 0 && size > 0) {
            line.pop();
            size--;
            this.reDraw();
        } else if (act === 1) {
            line.splice(lindex - 1, 1);
            lindex--;
            size--;
            this.reDraw();
        } else {
            line[act.index].rgb = act.color;
            this.reDraw();
        }
    }
    
    // Reset and clear canvas.
    this.reset = function () {
        color = 'rgb(0, 0, 0)';
        radius = 10;
        current = { x : 0, y : 0 };
        last = { x : 0, y : 0 };
        this.clear();
    }
    
    // Clears all lines from the canvas.
    this.clear = function () {
        line = new Array();
        size = 0;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
    }
    
    // Adds a point the current line and draws it.
    this.drawPoint = function (px, py) {
        // Set last to previous current point.
        if (last === null) {
            last = { x : px + 0.01, y : py };
        } else {
            last = current;
        }
        // Set the current point to the point given.
        current = { x : px, y : py };
        line[size - 1].point.push(current);
        
        // Draw the line between the points.
        ctx.lineJoin = "round";
        ctx.strokeStyle = line[size - 1].rgb;
        ctx.lineWidth = line[size - 1].width;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(current.x, current.y);
        ctx.closePath();
        ctx.stroke();
    }
    
    // Redraws all the lines.
    this.reDraw = function () {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
        
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        
        for (var i = 0; i < size; i++) {
            ctx.strokeStyle = line[i].rgb;
            ctx.lineWidth = Math.abs(line[i].width);
            
            if (line[i].width === 0) {
                ctx.fillStyle = line[i].rgb;
                ctx.beginPath();
                ctx.moveTo(line[i].point[0].x, line[i].point[0].y);
                for (var n = 1; n < line[i].point.length; n++) {
                    ctx.lineTo(line[i].point[n].x, line[i].point[n].y);
                }
                ctx.closePath();
                ctx.fill();
            } else if (line[i].point.length < 2) {
                ctx.beginPath();
                ctx.moveTo(line[i].point[0].x - 0.1, line[i].point[0].y);
                ctx.lineTo(line[i].point[0].x, line[i].point[0].y);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(line[i].point[0].x, line[i].point[0].y);
                for (var n = 1; n < line[i].point.length; n++) {
                    ctx.lineTo(line[i].point[n].x, line[i].point[n].y);
                }
                if (line[i].width < 0) {
                    ctx.closePath();
                    ctx.fillStyle = line[i].rgb;
                    ctx.fill();
                }
                ctx.stroke();
            }
        }
    }
    
    this.fill = function () {
        // Draw the line between the points.
        ctx.lineJoin = "round";
        ctx.strokeStyle = line[size - 1].rgb;
        ctx.lineWidth = line[size - 1].width;
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(line[size - 1].point[0].x, line[size - 1].point[0].y);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(line[size - 1].point[0].x, line[size - 1].point[0].y);
        for (var n = 1; n < line[size - 1].point.length; n++) {
            ctx.lineTo(line[size - 1].point[n].x, line[size - 1].point[n].y);
        }
        ctx.closePath();
        ctx.fillStyle = line[size - 1].rgb;
        ctx.fill();
        
        line[size - 1].width = -line[size - 1].width;
    }
    
    this.bucket = function (x, y) {
        var imgCol = (ctx.getImageData(x, y, 1, 1).data);
        var pixCol = 'rgb(' + imgCol[0] + ', ' + imgCol[1] + ', ' + imgCol[2] + ')'
        if (color === pixCol) {
            return;
        }
        console.log(pixCol);
        // If the size is zero then just fill the background.
        if (size === 0 || imgCol[3] === 0) {
            actions.push(1);
            line.unshift({
                point : [{ x : -5, y : -5 }, { x : ctx.canvas.width, y : -5 }, { x : ctx.canvas.width, y : ctx.canvas.height }, { x : 0, y : ctx.canvas.height }],
                rgb : color,
                width : -1
            });
            lindex++;
            size++;
            this.reDraw();
            return;
        }
        
        // Check elements for color replace.
        var found = [];
        for (var i = 0; i < size; i++) {
            console.log(line[i].rgb);
            if (line[i].rgb === pixCol) {
                found.push(i);
            }
        }
        console.log(found.length);
        
        if (found.length === 1) {  // Set the element color if there is 1.
            actions.push({ index : found[0], color : line[found[0]].rgb });
            line[found[0]].rgb = color;
        }
        else if (found.length > 1) {  // Find the best and set it.
            var minDist = new Array(found.length);
            for (var i = 0; i < found.length; i++) {
                minDist[i] = -1;
                for (var j = 0; j < line[found[i]].point.length; j++) {
                    var nextDist = Math.pow((line[found[i]].point[j].x - x), 2) + Math.pow((line[found[i]].point[j].y - y), 2);
                    console.log(i + ': ' + nextDist);
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
            actions.push({ index : found[best], color : line[found[best]].rgb });
            line[found[best]].rgb = color;
        }
        else {  // Do something else...

        }
        console.log('done');
        this.reDraw();
    }
}