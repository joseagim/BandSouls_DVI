import Phaser from 'phaser';
import Arma from './arma.js'

export default class Keyboard extends Arma {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, 'keyboard_projectile', {
            damage: stats.damage,
            cooldown: stats.cooldown,
            duration: stats.duration
        });

        this.player = player;
        this.visible = false;

        this.chargeTime = stats.chargeTime;
        this.chargeSpeedModifier = stats.chargeSpeedModifier;

        // crea la animación del proyectil
        if (!this.scene.anims.exists('keyboard_projectile_anim')) {
            this.scene.anims.create({
                key: 'keyboard_projectile_anim',
                frames: this.scene.anims.generateFrameNames('keyboard_projectile', {
                    prefix: 'projectile_',
                    start: 0,
                    end: 15
                }),
                frameRate: 20,
                repeat: -1
            });
        }

        const POOL_SIZE = 1;
        this.hurtboxPool = Array.from({ length: POOL_SIZE }, () => {
            const hb = this.scene.add.circle(0, 0, 14, 0x00ffff);
            hb.visible = false;
            hb.active = false;
            hb.enemiesHit = new Set();
            this.scene.physics.add.existing(hb);
            hb.body.enable = false;

            const sprite = this.scene.add.sprite(0, 0, 'keyboard_projectile');
            sprite.setScale(4);
            sprite.visible = false;
            hb.sprite = sprite;

            return hb;
        });

        this.scene.add.existing(this);
        this.deactivateWeapon();

        // inicializar valores de la ulti
        this.iconKey = 'keyboard-icon';
        this.abilityDamage = stats.abilityDamage;
        this.abilityCooldown = stats.abilityCooldown;
        this.abilityChargeTime = stats.abilityChargeTime;
        this.abilityChargeSpeedModifier = stats.abilityChargeSpeedModifier;
        this.abilityKBmodifier = stats.abilityKBmodifier;
        this.abilityNumAttacks = stats.abilityNumAttacks;
        this.abilityFireRate = stats.abilityFireRate;
        this.canUseAbility = true;
        this._abilityTimer = null;
        this._isUltiCharging = false;
        this._ultiChargeTimer = null;

        // pool de proyectiles de la ulti (necesitamos uno por disparo simultáneo posible)
        const ULTI_POOL_SIZE = this.abilityNumAttacks;
        this.ultiHurtboxPool = Array.from({ length: ULTI_POOL_SIZE }, () => {
            const hb = this.scene.add.rectangle(0, 0, 4, 11, 0xffffff);
            hb.visible = false;
            hb.active = false;
            hb.enemiesHit = new Set();
            this.scene.physics.add.existing(hb);
            hb.body.enable = false;
            hb.body.setSize(4, 11);

            // sprite de los proyectiles, cada vez coge un color aleatorio (entre 1 y 4)
            const colorIdx = Phaser.Math.Between(1, 4);
            const sprite = this.scene.add.image(0, 0, 'keyboard-ulti-projectile', `ulti_color_${colorIdx}`);
            sprite.setScale(3);
            sprite.visible = false;
            hb.sprite = sprite;

            return hb;
        });
    }

    getAnimSuffix() {
        return '-keyboard';
    }

    getHurtboxes() {
        return [...this.hurtboxPool, ...this.ultiHurtboxPool];
    }

    posicionarHitbox(hurtbox, angle) {
        hurtbox.body.reset(this.player.x, this.player.y);
        hurtbox.body.enable = true;
        hurtbox.body.setVelocity(Math.cos(angle) * 700, Math.sin(angle) * 700);
    }

    weaponAttackAnimation(hurtbox, angle) {
        hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
        hurtbox.sprite.setRotation(angle + Math.PI / 2);
        hurtbox.sprite.visible = true;
        hurtbox.sprite.play('keyboard_projectile_anim', true);
    }

    attack(enemy, attackMod, hurtbox) {
        if (hurtbox.enemiesHit.has(enemy)) return;

        // Los proyectiles de la ulti usan abilityDamage
        const dmg = this.ultiHurtboxPool.includes(hurtbox)
            ? this.abilityDamage * attackMod
            : this.damage * attackMod;

        const kbForce = 300 * this.abilityKBmodifier;
        enemy.getDamage(dmg, kbForce);
        hurtbox.enemiesHit.add(enemy);
        // No se desactiva → atraviesa enemigos
    }

    _deactivateProjectile(hurtbox) {
        hurtbox.body.enable = false;
        hurtbox.body.setVelocity(0, 0);
        hurtbox.active = false;
        hurtbox.sprite.visible = false;
        if (!this.hurtboxPool.some(h => h.active)) this.isAttacking = false;
    }

    _deactivateUltiProjectile(hurtbox) {
        hurtbox.body.enable = false;
        hurtbox.body.setVelocity(0, 0);
        hurtbox.active = false;
        hurtbox.sprite.visible = false;
    }

    // "cargar" el ataque
    startCharge() {
        if (this.isCharging || !this.canAttack) return;
        this.isCharging = true;
        this.isAttacking = true;

        // fijar la dirección del sprite según hacia dónde apunta el mouse
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        const deg = Phaser.Math.RadToDeg(angle);
        if (deg > -45 && deg <= 45) this.player.lastDirection = 'right';
        else if (deg > 45 && deg <= 135) this.player.lastDirection = 'down';
        else if (deg > 135 || deg <= -135) this.player.lastDirection = 'left';
        else this.player.lastDirection = 'up';

        // bajar la velocidad del personaje cuando vaya a atacar
        this._normalSpeed = this.player.speed;
        this.player.speed *= this.chargeSpeedModifier;
        this.player.canDash = false;

        // atacar cuando pase el tiempo de carga
        this._chargeTimer = this.scene.time.delayedCall(this.chargeTime, () => {
            this._fireProjectile();
        });
    }

    // cancela la carga del básico y no dispara
    cancelCharge() {
        if (!this.isCharging) return;
        this._chargeTimer?.remove();
        this._chargeTimer = null;
        this.isCharging = false;
        this.isAttacking = false;
        this.player.speed = this._normalSpeed;
        this.player.canDash = true;
    }

    // ataque de la ulti
    ability() {
        if (!this.canUseAbility || this._isUltiCharging) return;
        this._isUltiCharging = true;
        this.canUseAbility = false;

        // bloquear al jugador durante toda la ulti (carga + ráfaga)
        this._ultiNormalSpeed = this.player.speed;
        this.player.speed *= this.abilityChargeSpeedModifier;
        this.player.isAttacking = true;   // bloquea cambio de arma
        this.player.canDash = false;       // bloquea dash
        this.canAttack = false;            // bloquea ataque básico

        // carga previa antes de la ráfaga
        this._ultiChargeTimer = this.scene.time.delayedCall(this.abilityChargeTime, () => {
            this._isUltiCharging = false;
            this._startUltiBurst();
        });

        this.scene.game.events.emit('ultiStart', { weaponKey: this.iconKey, cooldown: this.abilityCooldown });
    }

    _startUltiBurst() {
        // restaurar velocidad al empezar la ráfaga
        this.player.speed = this._ultiNormalSpeed;
        this._ultiNormalSpeed = null;

        let shotsFired = 0;

        const fireNext = () => {
            if (shotsFired >= this.abilityNumAttacks) {
                // todos los disparos lanzados → desbloquear jugador y arrancar cooldown
                this.player.isAttacking = false;
                this.player.canDash = true;
                this.canAttack = true;

                this._abilityTimer = this.scene.time.delayedCall(this.abilityCooldown, () => {
                    this.canUseAbility = true;
                    this._abilityTimer = null;
                    this.player.showCooldownCue(0x00ffff);
                    this.scene.game.events.emit('ultiReady', { weaponKey: this.iconKey });
                });
                return;
            }
            this._fireUltiProjectile();
            shotsFired++;
            this.scene.time.delayedCall(this.abilityFireRate, fireNext);
        };

        fireNext();
    }

    // lanzar el proyectil de la ulti
    _fireUltiProjectile() {
        const hurtbox = this.ultiHurtboxPool.find(h => !h.active);
        if (!hurtbox) return;

        // asignar color aleatorio en cada disparo
        const colorIdx = Phaser.Math.Between(1, 4);
        hurtbox.sprite.setFrame(`ulti_color_${colorIdx}`);

        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);

        // pequeña dispersión para efecto minigun
        const baseAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );
        const spread = Phaser.Math.FloatBetween(-0.12, 0.12);
        const angle = baseAngle + spread;

        hurtbox.body.reset(this.player.x, this.player.y);
        hurtbox.body.enable = true;
        hurtbox.body.setVelocity(Math.cos(angle) * 700, Math.sin(angle) * 700);

        hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
        hurtbox.sprite.setRotation(angle + Math.PI / 2);
        hurtbox.sprite.visible = true;

        hurtbox.active = true;
        hurtbox.enemiesHit.clear();

        // duración del proyectil de ulti (mismo que el básico)
        this.scene.time.delayedCall(this.duration, () => {
            this._deactivateUltiProjectile(hurtbox);
        });
    }

    _fireProjectile() {
        this.isCharging = false;

        this.scene.soundManager.playWithPitch('teclado_attk');
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
        // solo cancela la carga del básico (la ulti no se puede interrumpir)
        this.cancelCharge();
        this.hurtboxPool?.forEach(h => {
            h.body?.enable && (h.body.enable = false);
            h.body?.setVelocity(0, 0);
            h.active = false;
            h.enemiesHit?.clear();
            if (h.sprite) h.sprite.visible = false;
        });
        this.ultiHurtboxPool?.forEach(h => {
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
        for (const hurtbox of this.ultiHurtboxPool) {
            if (hurtbox.active) {
                hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
            }
        }
    }
}
