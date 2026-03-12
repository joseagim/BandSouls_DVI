import Phaser from 'phaser';
import Arma from './arma.js'
import bajo from '../../assets/sprites/bajo.png'

export default class Bass extends Arma {
    constructor(scene, x, y, player) {
        super(scene, x, y, 'bajo', {
            damage: 8,
            cooldown: 1000,
            duration: 400
        });

        this.player = player;
        this.animSuffix = '-bass';
        this.attackAnimSuffix = '';
        this.setScale(-1.5, 1.5);
        this.visible = false;

        this.hurtbox = this.scene.add.circle(0, 0, 25, 0xff0000);
        this.hurtbox.visible = false;

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this.hurtbox);

        if (this.hurtbox.body) this.hurtbox.body.enable = false;

        this.deactivateWeapon();

        // Charge mechanic properties
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeTime = 0;
        this.maxChargeTime = 3000;   // 3 seconds for max charge
        this.maxDamageMultiplier = 3; // x3 damage at full charge

        // Store the attack angle when player clicks
        this.attackAngle = 0;
    }

    getHurtboxes() {
        return [this.hurtbox];
    }

    getAnimSuffix() {
        return (this.isAttacking || this.isCharging) ? this.attackAnimSuffix : this.animSuffix;
    }

    /**
     * Called when the player clicks — starts charging.
     * The bass becomes visible and positioned at the click direction,
     * but the hurtbox is NOT active yet (damage happens on release).
     */
    startCharge() {
        this.isCharging = true;
        this.chargeStartTime = this.scene.time.now;
        this.chargeTime = 0;

        // Make the bass visible to show charging
        this.visible = true;

        // Store the direction the player clicked
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        this.attackAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );
    }

    /**
     * Called when the player releases the mouse — performs the strike.
     * Calculates charge duration and applies damage multiplier.
     */
    releaseCharge() {
        if (!this.isCharging) return;

        this.isCharging = false;
        this.chargeTime = this.scene.time.now - this.chargeStartTime;

        // Calculate damage multiplier: linear interpolation from 1x to maxDamageMultiplier
        // over maxChargeTime ms, clamped at maxDamageMultiplier
        const chargeRatio = Math.min(this.chargeTime / this.maxChargeTime, 1);
        this.currentDamageMultiplier = 1 + chargeRatio * (this.maxDamageMultiplier - 1);

        // Now actually activate the hurtbox for the strike
        this.hurtbox.body.enable = true;
        this.hurtbox.active = true;
        this.isAttacking = true;
        this.enemiesHit.clear();

        // Play the strike animation (quick swing at the charged direction)
        this.weaponAttackAnimation();

        // Deactivate after the strike duration
        this.scene.time.delayedCall(this.duration, () => {
            this.deactivateWeapon();
            this.currentDamageMultiplier = 1;
        });
    }

    /**
     * Override attack to use the charge damage multiplier.
     */
    attack(enemy, attackMod) {
        if (this.enemiesHit.has(enemy)) return;
        const finalDamage = this.damage * attackMod * (this.currentDamageMultiplier || 1);
        enemy.getDamage(finalDamage);
        enemy.knockback();
        this.enemiesHit.add(enemy);
    }

    /**
     * Cancel the charge without attacking (e.g. if weapon is switched).
     */
    cancelCharge() {
        this.isCharging = false;
        this.chargeTime = 0;
        this.deactivateWeapon();
    }

    weaponAttackAnimation() {
        const arcHalf = 0.5;
        this.swingAngle = this.attackAngle - arcHalf;

        this.scene.tweens.add({
            targets: this,
            swingAngle: this.attackAngle + arcHalf,
            duration: this.duration,
            ease: 'Sine.easeInOut',
        });
    }

    posicionarHitbox(angle, dist) {
        const gx = this.player.x + Math.cos(angle) * dist;
        const gy = this.player.y + Math.sin(angle) * dist;
        this.setPosition(gx, gy);
        this.setRotation(angle);

        // Mover también la hurtbox
        this.hurtbox.setPosition(gx, gy);
        this.hurtbox.setRotation(angle);
    }

    preUpdate(t, dt) {
        this.x = this.player.x;
        this.y = this.player.y;

        if (this.isCharging) {
            // While charging, update the attack angle to follow the pointer
            const pointer = this.scene.input.activePointer;
            const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
            this.attackAngle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                worldPoint.x, worldPoint.y
            );

            // Show bass at the charge direction (but hurtbox is disabled)
            this.posicionarHitbox(this.attackAngle, 30);

            // Visual feedback: scale bass up slightly as charge grows
            const elapsed = this.scene.time.now - this.chargeStartTime;
            const chargeRatio = Math.min(elapsed / this.maxChargeTime, 1);
            const scaleBoost = 1 + chargeRatio * 0.5; // up to 1.5x visual size
            this.setScale(-1.5 * scaleBoost, 1.5 * scaleBoost);

        } else if (this.isAttacking) {
            this.posicionarHitbox(this.swingAngle, 30);
        } else {
            const pointer = this.scene.input.activePointer;
            const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
            this.posicionarHitbox(angle, 22);
            // Reset scale when idle
            this.setScale(-1.5, 1.5);
        }
    }

}