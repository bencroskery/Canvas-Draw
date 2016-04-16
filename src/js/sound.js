//import * from '../../node_modules/howler/howler'

import {Howl} from '../../node_modules/howler/howler.core.min.js'

export function playSound(name, vol) {
    vol = vol || 1;
    new Howl({
        src: ['sound/' + name + '.mp3'],
        volume: vol
    }).play();
}

let music;
export function playMusic() {
    if (music == undefined) {
        music = new Howl({
            src: ['sound/80s_vibe.mp3'],
            loop: true,
            volume: 0.15
        });
    }
    music.play();
}
export function stopMusic() {
    music.stop();
}
