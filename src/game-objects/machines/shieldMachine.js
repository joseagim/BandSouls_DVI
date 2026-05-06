import Phaser from 'phaser';

const PRICE = 2000;
const NAME = 'Escudo de pinchos';
const SUBTITLE = 'Cúbrete las espaldas con estilo';

export default class ShieldMachine {
    constructor(scene, x, y) {
        this._scene = scene;

        this.sprite = scene.physics.add.staticSprite(x, y, 'shieldhouse');
        this.sprite.setScale(2).setDepth(1);
        this.sprite.body.setSize(60, 60).setOffset(10, 10);
        this.sprite.refreshBody();

        if (!scene.anims.exists('shieldhouse-anim')) {
            scene.anims.create({
                key: 'shieldhouse-anim',
                frames: scene.anims.generateFrameNames('shieldhouse', {
                    prefix: 'shieldhouse-',
                    start: 0,
                    end: 3
                }),
                frameRate: 6,
                repeat: -1
            });
        }
        this.sprite.play('shieldhouse-anim');

        this._interactionRange = 60;
        this._lastStateKey = null;
        this._keyF = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }

    addCollider(physicsTarget) {
        this._scene.physics.add.collider(physicsTarget, this.sprite);
    }

    update(player) {
        const dist = Phaser.Math.Distance.Between(
            player.x, player.y,
            this.sprite.x, this.sprite.y
        );
        const near = dist < this._interactionRange;
        const score = this._scene.registry.get('score') || 0;
        const canAfford = score >= PRICE;
        const stateKey = `${near}|${canAfford}|${player.hasShield}`;

        if (stateKey !== this._lastStateKey) {
            this._lastStateKey = stateKey;
            if (near) {
                this._scene.game.events.emit('showMachinePanel', NAME, SUBTITLE, PRICE, canAfford, player.hasShield);
            } else {
                this._scene.game.events.emit('hideMachinePanel');
            }
        }

        if (near && Phaser.Input.Keyboard.JustDown(this._keyF)) {
            if (canAfford && !player.hasShield) {
                this._scene.registry.set('score', score - PRICE);
                this._scene.soundManager.play('buy');
                player.activateShield();
                this._lastStateKey = null;
            }
        }
    }
}
