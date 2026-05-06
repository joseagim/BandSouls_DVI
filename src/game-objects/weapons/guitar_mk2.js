import Guitar from './guitar.js';

export default class GuitarMK2 extends Guitar {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, player, stats);
        this.setTexture('guitarmk2-sprite');
        this.iconKey = 'guitarmk2-icon';
    }

    getAnimSuffix() {
        return this.isAttacking ? '' : '-guitar-mk2';
    }
}
