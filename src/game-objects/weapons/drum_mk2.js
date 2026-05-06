import Drum from './drum.js';

export default class DrumMK2 extends Drum {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, player, stats);
        this.setTexture('drummk2-sticks');
        for (const hb of this.hurtboxPool) {
            hb.sprite.setTexture('drummk2-sticks');
        }
        this.iconKey = 'drummk2-icon';
    }

    getAnimSuffix() {
        return '-drum-mk2';
    }
}
