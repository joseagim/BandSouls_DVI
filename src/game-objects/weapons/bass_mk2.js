import Bass from './bass.js';

export default class BassMK2 extends Bass {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, player, stats);
        this.setTexture('bassmk2-sprite');
        this.iconKey = 'bassmk2-icon';
        this.animSuffix = '-bass-mk2';
    }
}
