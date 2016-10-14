import {Howl} from '../../node_modules/howler/dist/howler.core.min.js'

/**
 *
 * @param {String} name
 * @param {Number} [vol]
 */
export function playSound(name, vol) {
    vol = vol || 1;
    new Howl({
        src: ['sound/' + name + '.mp3'],
        volume: vol
    }).play();
}

/**
 * The music loaded in.
 * @type Howl
 */
let music;

/**
 * Play some music!
 */
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

/**
 * Stop the music!
 */
export function stopMusic() {
    music.stop();
}
