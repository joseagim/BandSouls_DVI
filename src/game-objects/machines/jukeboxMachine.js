import Phaser from 'phaser';

const PRICE = 3500;
const NAME = 'Jukebox';
const SUBTITLE = 'Mejora tu arma al ritmo de la música';

export default class JukeboxMachine {
    constructor(scene, x, y) {
        this._scene = scene;

        this.sprite = scene.physics.add.staticSprite(x, y, 'jukebox', 'jukebox-0');
        this.sprite.setScale(2);
        this.sprite.setDepth(1);
        this.sprite.body.setSize(60, 60);
        this.sprite.refreshBody();

        if (!scene.anims.exists('jukebox_anim')) {
            scene.anims.create({
                key: 'jukebox_anim',
                frames: scene.anims.generateFrameNames('jukebox', { prefix: 'jukebox-', start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        this.sprite.play('jukebox_anim');

        this._fKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this._inRange = false;
    }

    addCollider(physicsTarget) {
        this._scene.physics.add.collider(physicsTarget, this.sprite);
    }

    update(player) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.sprite.x, this.sprite.y);
        const inRange = dist < 80;

        if (inRange !== this._inRange) {
            this._inRange = inRange;
            const score = this._scene.registry.get('score') || 0;
            if (inRange) {
                this._scene.game.events.emit('showMachinePanel', NAME, SUBTITLE, PRICE, score >= PRICE);
            } else {
                this._scene.game.events.emit('hideMachinePanel');
            }
        }

        if (this._inRange && Phaser.Input.Keyboard.JustDown(this._fKey)) {
            const score = this._scene.registry.get('score') || 0;
            if (score >= PRICE) {
                this._scene.registry.set('score', score - PRICE);
                // TODO: apply weapon upgrade logic
            }
        }
    }
}
