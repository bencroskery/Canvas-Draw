// Setup express server.
var express = require('express')
  , app = express()
  , server = require('http').Server(app)
  , io = require('socket.io')(server)
  , port = process.env.PORT || 3000;

// Folder holding all client pages.
app.use(express.static(__dirname + '/public'));

// Listen on port 3000.
server.listen(port, function () {
    console.log('Server listening on port 3000');
});

// Users which are connected to the chat.
var userlist = [];
var playernames = [];

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('add user', function (name) {
        // Add the user.
        userlist.push(socket.id);
        playernames.push(name);
        socket.number = userlist.length - 1;
        socket.name = name;
        addedUser = true;

        console.log('User ' + name + ' has joined');
        // Tell everyone that this user has joined.
        socket.emit('setup', playernames);
        socket.broadcast.emit('user joined', socket.name);
    });
    
    socket.on('list users', function (d) {
        console.log('Number of users: ' + userlist.length);
        console.log(userlist);
        console.log(playernames);
    });

    socket.on('start game', function (d) {
        console.log('Game started!');
        io.sockets.emit('start game', 0);
        io.sockets.emit('turn-wait', 0);
    });
    
    socket.on('turn-wait', function (d) {
        var words = [wordlist[Math.floor(Math.random() * wordlist.length)], wordlist[Math.floor(Math.random() * wordlist.length)], wordlist[Math.floor(Math.random() * wordlist.length)]];
        console.log('Next turn');
        io.sockets.emit('turn-wait', 0);
    });
    
    socket.on('turn-choose', function (d) {
        console.log('Choosing word');
        io.sockets.emit('turn-choose', words);
    });
    
    socket.on('turn-draw', function (word) {
        console.log('Drawing');
        if (word === -1) {
            io.sockets.emit('turn-draw', wordlist[Math.floor(Math.random() * wordlist.length)]);
        }
        io.sockets.emit('turn-draw', 0);
    });

    socket.on('point', function (point) {
        console.log(point);
        io.emit('point', point);
    });

    socket.on('set color', function (c) {
        console.log('Color is now ' + c);
        socket.broadcast.emit('set color', c);
    });
    
    socket.on('set size', function (c) {
        console.log('Size is now ' + c);
        socket.broadcast.emit('set size', c);
    });

    socket.on('undo line', function (d) {
        console.log('UNDO!');
        socket.broadcast.emit('undo line', 0);
    });

    socket.on('clear canvas', function (d) {
        console.log('CLEAR!');
        socket.broadcast.emit('clear canvas', 0);
    });

    socket.on('message', function (msg) {
        console.log(socket.name + ' said ' + msg);
        // Send the message to everyone.
        socket.broadcast.emit('message', {
            name: socket.name,
            message: msg
        });
    });

    socket.on('disconnect', function () {
        // Remove the name from global userlist and playernames list.
        if (addedUser) {
            userlist.splice(socket.number, 1);
            playernames.splice(socket.number, 1);
            
            console.log('User ' + socket.name + ' has left');
            // Tell everyone that this user has left.
            socket.broadcast.emit('user left', {
                name: socket.name,
                number: socket.number
            });
        }
    });
});

var words;
var wordlist = [
    "rolling pin",
    "hammock",
    "anchor",
    "skunk",
    "desk chair",
    "Van Gogh�s ear",
    "sandwich",
    "string quartet",
    "ottoman",
    "bottle opener",
    "fire escape",
    "Luminescent plankton",
    "cabin",
    "Mushrooms",
    "Shrubbery",
    "Bob Marley",
    "full house",
    "Bubbles",
    "Fangs",
    "pickle",
    "ironing board",
    "dolphin",
    "paper clip",
    "trumpet",
    "burrito",
    "Tube socks",
    "crayon",
    "robot",
    "roller coaster",
    "mosquito",
    "Fruit cocktail",
    "peg leg",
    "spigot",
    "balloon",
    "Head in the clouds",
    "Milky Way",
    "knot",
    "old key",
    "submarine",
    "tulip",
    "gold medal",
    "Synchronized swimmers",
    "Pom-poms",
    "juice box",
    "jar full of pennies",
    "bag of hammers",
    "Jelly beans",
    "sundial",
    "crystal ball",
    "synthesizer",
    "paper airplane",
    "water tower",
    "surfboard",
    "New Jersey",
    "Fiji",
    "layer cake",
    "panda",
    "mime",
    "Charlie Chaplin",
    "penguin",
    "seagull",
    "David Bowie",
    "sensitive cowboy",
    "leopard",
    "anatomy chart",
    "tree limb",
    "ship in a bottle",
    "mouth",
    "Brass knuckles",
    "ear of corn",
    "Costume jewelry",
    "mirage",
    "Smoke",
    "Mold",
    "rainbow",
    "dollar bill",
    "bone",
    "glass of milk",
    "teapot",
    "Weeds",
    "Dance steps",
    "turkey leg",
    "pencil",
    "picket fence",
    "Tiffany lamp",
    "Empire State Building",
    "stalagmite",
    "stalactite",
    "kiss",
    "ladybug",
    "helmet",
    "paw print",
    "Martian",
    "T-shirt",
    "cinder block",
    "Swim fins",
    "ripe banana",
    "barbell",
    "tennis racket",
    "Japan",
    "spiral staircase",
    "ponytail",
    "campfire",
    "squirrel",
    "thumb",
    "book",
    "Girlish laughter",
    "Tangled ribbons",
    "Noodles",
    "Best friends",
    "Worst enemies",
    "lock",
    "accordion",
    "log",
    "melting candle",
    "phone booth",
    "geode",
    "Dice",
    "Ointment",
    "bucket",
    "digital watch",
    "bicycle",
    "cassette tape",
    "library card",
    "corn dog with mustard",
    "Mittens",
    "pocket",
    "bunch of grapes",
    "vending machine",
    "typewriter",
    "flamingo",
    "kebab",
    "Shelves",
    "necklace",
    "dirty rag",
    "scallion pancake",
    "time machine",
    "Tyrannosaurus Rex",
    "music box",
    "candelabra",
    "quarter",
    "bulldog",
    "fairy",
    "ball of yarn",
    "haircut",
    "electric guitar",
    "Confetti",
    "pair of scissors",
    "bandage",
    "watermelon",
    "Bacon",
    "newsboy cap",
    "seed pod",
    "board game",
    "Daffodils",
    "onion",
    "slinky",
    "keychain",
    "sand castle",
    "Leftovers",
    "ghost",
    "vampire",
    "football",
    "lightbulb",
    "horseshoe",
    "pug",
    "Sunday paper",
    "helicopter",
    "warthog",
    "basket",
    "skateboard",
    "Sea spray",
    "Seaweed",
    "Hills and valleys",
    "umbrella",
    "Christmas tree",
    "hamburger",
    "Sunglasses",
    "seal",
    "Twenty thousand leagues under the sea",
    "shooting star",
    "Handprints",
    "rotary phone",
    "top hat",
    "turtle",
    "baseball",
    "Flags",
    "airplane",
    "microphone",
    "county fair",
    "saxophone",
    "ice cream cone",
    "marble",
    "weathervane",
    "lunchbox",
    "pound",
    "trolley car",
    "Cat whiskers",
    "cleaver",
    "Electricity",
    "Quonset hut",
    "treasure chest",
    "Binoculars",
    "pumpkin",
    "chalkboard",
    "Stiletto heels",
    "crowd",
    "pile of tires",
    "zombie",
    "French fries",
    "butterfly",
    "watering can",
    "cactus",
    "Coral",
    "Playing cars",
    "celebration",
    "constellation",
    "northern lights",
    "Bonbons",
    "wink",
    "inchworm",
    "knife",
    "kite",
    "Olympics",
    "box of tissues",
    "balloon animal",
    "spiral-bound notebook",
    "salt shaker",
    "bearded lady",
    "wrinkle",
    "box of kittens",
    "slug",
    "shadow",
    "winter hat",
    "puzzle",
    "diving board",
    "spoon",
    "cuttlefish",
    "Rain",
    "Eyelashes",
    "unicorn",
    "diaper",
    "bottle cap",
    "Queen Victoria",
    "bottle cap",
    "bird feeder",
    "baguette",
    "ladder",
    "parade",
    "Running shoes",
    "Bowling shoes",
    "apple tree",
    "storm",
    "fan",
    "princess crown",
    "Broccoli",
    "sarcophagus",
    "stick of butter",
    "sled",
    "flattop",
    "tattoo",
    "bonnet",
    "baseball glove",
    "Elvis",
    "rubber duck",
    "milk carton",
    "diamond ring",
    "Feelings",
    "Mom",
    "Dad",
    "drunken sailor",
    "police officer",
    "Snowshoes",
    "necktie",
    "bowler hat",
    "unicycle",
    "frog",
    "paper coffee cup",
    "circuit board",
    "waterslide",
    "Spilled milk",
    "Molten lava",
    "spaceship",
    "sound wave",
    "Clogs",
    "open/closed sign",
    "view from an airplane window",
    "Knitting needles",
    "Little Prince",
    "box of cereal",
    "Toes",
    "Chips and dip",
    "newt",
    "moustache",
    "Cheese",
    "face full of character",
    "ugly duckling",
    "laser",
    "Leaning Tower of Pisa",
    "Scrambled eggs",
    "caribou",
    "eyeball",
    "chimney",
    "drum kit",
    "battleship",
    "Whirling dervishes",
    "Building blocks",
    "fashion model",
    "Fancy pants",
    "Hot springs",
    "Steak and potatoes",
    "spool of thread",
    "wild blue yonder",
    "rabbit",
    "boom box",
    "bird�s nest",
    "power tool",
    "butterfly",
    "Toast",
    "computer",
    "eye patch",
    "crab apple",
    "golf ball",
    "Cutlery",
    "Q-tip",
    "Chocolate truffles",
    "office park",
    "sock monkey",
    "clock tower",
    "snorkel",
    "scorpion",
    "sardine tin",
    "secret door",
    "compound fracture",
    "bookstore",
    "Dumplings",
    "prom dress",
    "bowl of pudding",
    "director�s chair",
    "beetle",
    "water jug",
    "Your least favorite food",
    "turntable",
    "wheel of fortune",
    "fainting goat",
    "dumpster",
    "parasite",
    "Lipstick",
    "oasis",
    "frying pan",
    "Potato salad",
    "Buttons",
    "lumberjack",
    "artichoke",
    "flower",
    "teacup",
    "map",
    "moose",
    "palm tree",
    "bear family",
    "Black forest",
    "periodic table",
    "keyboard",
    "anteater",
    "comet",
    "globe",
    "Noah�s ark",
    "Popcorn",
    "Mac and cheese",
    "moon",
    "apron",
    "antelope",
    "Petroleum jelly",
    "uneventful street",
    "Bricks",
    "wormhole",
    "black hole",
    "Perfume",
    "giraffe",
    "chainsaw",
    "Cotton candy",
    "sidewalk",
    "sailboat",
    "fjord",
    "brain",
    "Saturn",
    "ticket",
    "barrel of monkeys",
    "real estate agent",
    "Tears",
    "First love",
    "Middle school",
    "lock",
    "tongue",
    "Puget Sound",
    "Peanut butter",
    "cranky old man",
    "Roller skates",
    "pillow",
    "gnome",
    "bully",
    "puppet",
    "opera singer",
    "Alphabet soup",
    "lollipop",
    "Contrails",
    "hanger",
    "motel",
    "string of DNA",
    "squid",
    "stick of gum",
    "ballpoint pen",
    "cornucopia",
    "gravestone",
    "Teeth",
    "Icicles",
    "snout",
    "cabbage patch",
    "inner tube",
    "elephant",
    "Egyptian pyramid",
    "narwhal",
    "swimming pool",
    "Fresh air",
    "iceberg",
    "cello",
    "stoplight",
    "Mistakes",
    "dream",
    "nightmare",
    "fire truck",
    "tea bag",
    "Tiny ballerinas",
    "electrical outlet",
    "game-show host",
    "technological diagram",
    "Footprints",
    "stain",
    "Unmentionables",
    "porcupine",
    "Alfred Hitchcock",
    "Bugs",
    "thumbtack",
    "cupcake",
    "steak",
    "pirate flag",
    "bowling pin",
    "loading crane",
    "reflection",
    "jungle",
    "toothpaste",
    "turnip",
    "trailer",
    "orb",
    "record",
    "centaur",
    "Mount Rushmore",
    "labyrinth",
    "Your pinky finger",
    "wooly mammoth",
    "boss",
    "ashtray",
    "walnut",
    "burlap sack",
    "earrings",
    "Freckles",
    "swimsuit",
    "chessboard",
    "tetherball",
    "Root beer",
    "Dimples",
    "poodle",
    "box car",
    "Donuts",
    "church",
    "architect",
    "Nails",
    "cowbell",
    "bus stop",
    "Leisure Wear",
    "huge gold frame",
    "whisper",
    "scream",
    "jellyfish",
    "skeleton",
    "toaster",
    "hummingbird",
    "condiment",
    "safety pin",
    "garden",
    "Lucky charms",
    "partner in crime",
    "man in the moon",
    "Platform shoes",
    "quilt",
    "doily",
    "Vitamins",
    "belt buckle",
    "container ship",
    "scoundrel",
    "Crutches",
    "dandy",
    "waterfall",
    "circus",
    "troll",
    "deserted island",
    "owl",
    "beaker",
    "jumper",
    "pearl",
    "broken toy",
    "seashell",
    "feathered hat",
    "amoeba",
    "Tie-Dye",
    "bobsledder",
    "houseboat",
    "gourd",
    "saint",
    "playsuit",
    "orphan",
    "bow and arrow",
    "pinecone",
    "Curtains",
    "chorus line",
    "wallet",
    "messenger bag",
    "Shrimp cocktail",
    "eggbeater",
    "sheep",
    "blackberry bush",
    "Spats",
    "Dignity",
    "carrot top",
    "freezer",
    "Scottie dog",
    "pineapple upside-down cake",
    "telescope",
    "mystery box",
    "bird in the hand",
    "horse and carriage",
    "Skee ball",
    "razor blade",
    "goldfish",
    "recycling bin",
    "palm reading",
    "road",
    "Windows",
    "egg",
    "birdhouse",
    "sweatband",
    "strawberry",
    "Sushi",
    "hippo",
    "prism",
    "sense of humor",
    "dragonfly",
    "tractor",
    "propaganda poster",
    "Behind the scenes",
    "2 x 4s",
    "lava lamp",
    "harmonica",
    "ruler",
    "Virginia Woolf",
    "windmill",
    "Plateaus",
    "crash-test dummy",
    "starfish",
    "Rain boots",
    "shoulder shrug",
    "pomegranate",
    "certificate",
    "Beatles song",
    "hobo",
    "portal",
    "wheelbarrow",
    "three-toed sloth",
    "box of fried chicken",
    "Wise babies",
    "Abominable Snow Man",
    "Cookies",
    "Prescription medication",
    "Capes",
    "tarantula",
    "can of beans",
    "sand dollar",
    "bee",
    "parasol",
    "ink pot",
    "sippy cup",
    "Maple syrup",
    "video game",
    "Tectonic plates",
    "beach",
    "wedding dress",
    "spelunker",
    "calculator",
    " A baby monster",
    "transportation system",
    "swamp",
    "invitation",
    "oven",
    "train",
    "Bermuda Triangle",
    "heart",
    "movie star",
    "spiderweb",
    "igloo",
    "Presidential pets",
    "Paisley",
    "grandma",
    "Lightning",
    "Wind",
    "Run-D.M.C.",
    "tuxedo",
    "mayonnaise jar",
    "lemon meringue pie",
    "sea urchin",
    "canyon",
    "cave",
    "concert",
    "viper",
    "phonograph",
    "bow",
    "convertible",
    "Ski slopes",
    "mummy",
    "Broken glass",
    "bed",
    "bar of music",
    "Polka dots",
    "Woodgrain",
    "Plaid",
    "Zigzag",
    "tacky rug",
    "plastic bag",
    "muffin tin",
    "sweater",
    "tuba"
]