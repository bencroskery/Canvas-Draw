# Canvas Draw
A Node.js HTML5 Canvas Drawing game to play with others!
Real-time connections between players, should work well on any modern desktop browser (mobile isn't a priority but works).

## Play the game

The game is available to play on a [Heroku server](http://canvas-draw-master.herokuapp.com)
or alternatively on an [Amazon EC2 instance](http://ec2-52-11-47-52.us-west-2.compute.amazonaws.com:3000).

When drawing you can use a few shortcuts:
- Right click to change the color of a line or the background
- Right click while dragging a line to close the line and fill the inside
- Use the number keys and '-' to switch between colors
- Roll the scroll wheel to change the drawing size
- Press '/' key to focus on the chat box when not already typing

## Run it yourself

Make sure you have [Node.js](https://nodejs.org/en/) installed, in the root folder run the following commands:
```
$ npm i
$ npm start
```

Point your browser to `http://localhost:3000`. Optionally, specify a different port by supplying the `PORT` env variable.

For help with commands type `/help` in the chat box.