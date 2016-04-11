function playSound(name, vol) {
    vol = vol || 1;
    new Howl({
        urls: ['sound/' + name + '.mp3'],
        volume: vol
    }).play();
}

var music;
function playMusic() {
    if (music == undefined) {
        music = new Howl({
            urls: ['sound/80s_vibe.mp3'],
            loop: true,
            volume: 0.15
        });
    }
    music.play();
}
function stopMusic() {
    music.stop();
}
