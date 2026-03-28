import Phaser from 'phaser';
import Arma from './arma.js'

export default class Keyboard extends Arma {
    constructor(scene, x, y, player) {
        super(scene, x, y, 'drumSticks', {
            damage: 20,
            cooldown: 1000,
            duration: 2000
        });

        this.player = player;
        this.visible = false;

        this.chargeTime = 1000;
        this.chargeSpeedModifier = 0.20;

        const POOL_SIZE = 1;
        this.hurtboxPool = Array.from({ length: POOL_SIZE }, () => {
            const hb = this.scene.add.circle(0, 0, 6, 0x00ffff);
            hb.visible = false;
            hb.active = false;
            hb.enemiesHit = new Set();
            this.scene.physics.add.existing(hb);
            hb.body.enable = false;

            const sprite = this.scene.add.image(0, 0, 'drumSticks');
            sprite.visible = false;
            hb.sprite = sprite;

            return hb;
        });

        this.scene.add.existing(this);
        this.deactivateWeapon();
    }

    getAnimSuffix() {
        return '-keyboard';
    }

    getHurtboxes() {
        return this.hurtboxPool;
    }

    posicionarHitbox(hurtbox, angle) {
        hurtbox.body.reset(this.player.x, this.player.y);
        hurtbox.body.enable = true;
        hurtbox.body.setVelocity(Math.cos(angle) * 700, Math.sin(angle) * 700);
    }

    weaponAttackAnimation(hurtbox, angle) {
        hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
        hurtbox.sprite.setRotation(angle);
        hurtbox.sprite.visible = true;
    }

    attack(enemy, attackMod, hurtbox) {
        // para poder atravesar enemigos y que no se pare
        if (hurtbox.enemiesHit.has(enemy)) return;
        enemy.getDamage(this.damage * attackMod);
        enemy.knockback();
        hurtbox.enemiesHit.add(enemy);
    }

    _deactivateProjectile(hurtbox) {
        hurtbox.body.enable = false;
        hurtbox.body.setVelocity(0, 0);
        hurtbox.active = false;
        hurtbox.sprite.visible = false;
        if (!this.hurtboxPool.some(h => h.active)) this.isAttacking = false;
    }

    // "cargar" el ataque
    startCharge() {
        if (this.isCharging || !this.canAttack) return;
        this.isCharging = true;
        this.isAttacking = true;

        // bajar la velocidad del personaje cuando vaya a atacar
        this._normalSpeed = this.player.speed;
        this.player.speed *= this.chargeSpeedModifier;
        this.player.canDash = false;

        // atacar cuando pase el tiempo de carga
        this._chargeTimer = this.scene.time.delayedCall(this.chargeTime, () => {
            this._fireProjectile();
        });
    }

    // Cancela la carga sin disparar (llamado por GunManager al cambiar de arma)
    cancelCharge() {
        if (!this.isCharging) return;
        this._chargeTimer?.remove();
        this._chargeTimer = null;
        this.isCharging = false;
        this.isAttacking = false;
        this.player.speed = this._normalSpeed;
        this.player.canDash = true;
    }

    _fireProjectile() {
        this.isCharging = false;

        // le ponemos la velocidad que tenía antes
        this.player.speed = this._normalSpeed;
        this.player.canDash = true;

        const hurtbox = this.hurtboxPool.find(h => !h.active);
        if (!hurtbox) {
            this.isAttacking = false;
            return;
        }

        // lanza el proyectil
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );

        this.posicionarHitbox(hurtbox, angle);
        this.weaponAttackAnimation(hurtbox, angle);

        hurtbox.active = true;
        hurtbox.enemiesHit.clear();
        this.isAttacking = true;
        this.canAttack = false;

        this.scene.time.delayedCall(this.cooldown, () => {
            this.canAttack = true;
        });

        this.scene.time.delayedCall(this.duration, () => {
            this._deactivateProjectile(hurtbox);
        });
    }

    deactivateWeapon() {
        // si se interrumpe le dejamos como antes (usa cancelCharge para no duplicar lógica)
        this.cancelCharge();
        this.hurtboxPool?.forEach(h => {
            h.body?.enable && (h.body.enable = false);
            h.body?.setVelocity(0, 0);
            h.active = false;
            h.enemiesHit?.clear();
            if (h.sprite) h.sprite.visible = false;
        });
        this.isAttacking = false;
        this.canAttack = true;
    }

    preUpdate() {
        for (const hurtbox of this.hurtboxPool) {
            if (hurtbox.active) {
                hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
            }
        }
    }
}
