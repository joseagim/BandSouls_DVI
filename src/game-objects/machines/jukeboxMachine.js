import Phaser from 'phaser';

const PRICE = 3500;
const NAME = 'Potenciadora';
const SUBTITLE = 'Para ser aún más notas';
const HITBOX_SIZE = 40;

export default class JukeboxMachine {
    constructor(scene, x, y) {
        this._scene = scene;

        // Sprite puramente visual, sin física
        this.sprite = scene.add.sprite(x, y, 'jukebox', 'jukebox-0');
        this.sprite.setScale(2);
        this.sprite.setDepth(0);

        // Hitbox física independiente, tamaño controlable
        this.hitbox = scene.add.rectangle(x, y, HITBOX_SIZE, HITBOX_SIZE);
        scene.physics.add.existing(this.hitbox, true); // true = static

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
        this._lastStateKey = null;
    }

    addCollider(physicsTarget) {
        this._scene.physics.add.collider(physicsTarget, this.hitbox);
    }

    update(player) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.sprite.x, this.sprite.y);
        const inRange = dist < 80;
        const score = this._scene.registry.get('score') || 0;
        const isAlreadyMK2 = player.arma.iconKey?.includes('mk2') ?? false;
        const canAfford = score >= PRICE;
        const stateKey = `${inRange}|${canAfford}|${isAlreadyMK2}|${player.arma.iconKey}`;

        if (stateKey !== this._lastStateKey) {
            this._lastStateKey = stateKey;
            if (inRange) {
                this._scene.game.events.emit('showMachinePanel', NAME, SUBTITLE, PRICE, canAfford && !isAlreadyMK2, isAlreadyMK2 ? 'Ya mejorada' : false);
            } else {
                this._scene.game.events.emit('hideMachinePanel');
            }
        }

        // Y-sort: máquina por delante si el jugador está por encima, por detrás si está por debajo
        this.sprite.setDepth(player.y < this.sprite.y ? 2 : 0);

        if (inRange && !isAlreadyMK2 && Phaser.Input.Keyboard.JustDown(this._fKey)) {
            if (canAfford) {
                this._scene.registry.set('score', score - PRICE);
                this._scene.soundManager.play('buy');
                player.upgradeCurrentWeapon();
                this._lastStateKey = null;
            }
        }
    }
}
