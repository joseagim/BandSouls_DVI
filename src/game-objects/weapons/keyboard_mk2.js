import Keyboard from './keyboard.js';

export default class KeyboardMK2 extends Keyboard {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, player, stats);
        this._ensureAnim();
        for (const hb of this.hurtboxPool) {
            hb.sprite.setTexture('keyboardmk2_projectile');
        }
        this.iconKey = 'keyboardmk2-icon';
    }

    getAnimSuffix() {
        return '-keyboard-mk2';
    }

    weaponAttackAnimation(hurtbox, angle) {
        hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
        hurtbox.sprite.setRotation(angle + Math.PI / 2);
        hurtbox.sprite.visible = true;
        hurtbox.sprite.play('keyboard_mk2_projectile_anim', true);
    }

    _ensureAnim() {
        if (!this.scene.anims.exists('keyboard_mk2_projectile_anim')) {
            this.scene.anims.create({
                key: 'keyboard_mk2_projectile_anim',
                frames: this.scene.anims.generateFrameNames('keyboardmk2_projectile', {
                    prefix: 'projectile_',
                    start: 0,
                    end: 15
                }),
                frameRate: 20,
                repeat: -1
            });
        }
    }
}
