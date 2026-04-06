
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
        this.scene.input.keyboard.on('keydown-ONE', () => this.switchTo(0));
        this.scene.input.keyboard.on('keydown-TWO', () => this.switchTo(1));
        this.scene.input.keyboard.on('keydown-THREE', () => this.switchTo(2));
        this.scene.input.keyboard.on('keydown-FOUR', () => this.switchTo(3));

        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (deltaY > 0) this.switchNext();
            else this.switchPrev();
        });
    }

    _setupUI() {
        this.scene.registry.set('weaponSelectorData', {
            iconKeys: this.iconKeys,
            currentIndex: this.currentIndex
        });
        this.scene.events.emit('weaponSelectorInit');
    }

    _updateUI() {
        this.scene.registry.set('weaponSelectorIndex', this.currentIndex);
        this.scene.events.emit('weaponChanged', this.currentIndex);
    }
}
