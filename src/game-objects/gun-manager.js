import Phaser from 'phaser';

/**
 * Gestiona el arsenal del jugador: switching por teclado (1-4) o rueda del ratón,
 * y muestra un selector visual en pantalla con frames selected/unselected.
 *
 * @param {Phaser.Scene} scene
 * @param {object} player - Instancia del jugador (para comprobar isAttacking)
 * @param {Array<{weapon, iconKey}>} weaponDefs
 */
export default class GunManager {
    constructor(scene, player, weaponDefs) {
        this.scene = scene;
        this.player = player;
        this.weapons = weaponDefs.map(d => d.weapon);
        this.iconKeys = weaponDefs.map(d => d.iconKey);
        this.currentIndex = 0;

        this._setupInput();
        this._setupUI();
    }

    get currentWeapon() {
        return this.weapons[this.currentIndex];
    }

    switchTo(index) {
        if (index < 0 || index >= this.weapons.length) return;
        if (index === this.currentIndex) return;
        if (this.player.isAttacking) return;

        const current = this.currentWeapon;
        if (current.isCharging) {
            current.cancelCharge();
            this.player.isAttacking = false;
        }
        current.deactivateWeapon();

        this.currentIndex = index;
        this._updateUI();
    }

    switchNext() {
        this.switchTo((this.currentIndex + 1) % this.weapons.length);
    }

    switchPrev() {
        this.switchTo((this.currentIndex - 1 + this.weapons.length) % this.weapons.length);
    }

    _setupInput() {
        this.scene.input.keyboard.on('keydown-ONE',   () => this.switchTo(0));
        this.scene.input.keyboard.on('keydown-TWO',   () => this.switchTo(1));
        this.scene.input.keyboard.on('keydown-THREE', () => this.switchTo(2));
        this.scene.input.keyboard.on('keydown-FOUR',  () => this.switchTo(3));

        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (deltaY > 0) this.switchNext();
            else this.switchPrev();
        });
    }

    _setupUI() {
        const slotSpacing = 50;
        const startX = 450;
        const y = 44;

        this._slots = this.weapons.map((weapon, i) => {
            const x = startX + i * slotSpacing;
            const isSelected = i === this.currentIndex;

            const frame = this.scene.add.image(x, y, isSelected ? 'weapon-selected' : 'weapon-unselected')
                .setScrollFactor(0)
                .setDepth(100)
                .setScale(1.3);

            let icon = null;
            if (this.iconKeys[i]) {
                icon = this.scene.add.image(x, y, this.iconKeys[i])
                    .setScrollFactor(0)
                    .setDepth(101)
                    .setScale(1.3);
            }

            return { frame, icon };
        });
    }

    _updateUI() {
        this._slots.forEach((slot, i) => {
            slot.frame.setTexture(i === this.currentIndex ? 'weapon-selected' : 'weapon-unselected');
        });
    }
}
