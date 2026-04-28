import Phaser from 'phaser';
import Arma from './arma.js'

export default class Bass extends Arma {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, 'bass-sprite', {
            damage: stats.damage,
            cooldown: stats.cooldown,
            duration: stats.duration
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

        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeTime = 0;
        this.maxChargeTime = stats.maxChargeTime;
        this.maxDamageMultiplier = stats.maxDamageMultiplier;

        this.attackAngle = 0;

        this.iconKey = 'bass-icon';
        this.abilityDamage = stats.abilityDamage;
        this.abilityCooldown = stats.abilityCooldown;
        this.abilityRange = stats.abilityRange;
        this.abilityExplosionRadius = stats.abilityExplosionRadius;
        this.canUseAbility = true;

        if (!this.scene.anims.exists('bass_note_anim')) {
            this.scene.anims.create({
                key: 'bass_note_anim',
                frames: this.scene.anims.generateFrameNames('bass-note-anim', {
                    prefix: 'notaultibajosprite ',
                    suffix: '.png',
                    start: 0,
                    end: 5
                }),
                frameRate: 10,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('bass_explosion_anim')) {
            this.scene.anims.create({
                key: 'bass_explosion_anim',
                frames: this.scene.anims.generateFrameNames('bass-explosion', {
                    prefix: 'explosion ',
                    suffix: '.png',
                    start: 0,
                    end: 22
                }),
                frameRate: 20,
                repeat: 0
            });
        }

        this.noteSprite = this.scene.add.sprite(0, 0, 'bass-note');
        this.noteSprite.setScale(2);
        this.noteSprite.setVisible(false);
        this.noteSprite.setDepth(50);

        this.explosionSprite = this.scene.add.sprite(0, 0, 'bass-explosion');
        this.explosionSprite.setScale(6);
        this.explosionSprite.setVisible(false);
        this.explosionSprite.setDepth(50);

        this.grenadeHurtbox = this.scene.add.circle(0, 0, 40, 0xff4400);
        this.grenadeHurtbox.visible = false;
        this.grenadeHurtbox.active = false;
        this.grenadeHurtbox.enemiesHit = new Set();
        this.grenadeHurtbox.damage = this.abilityDamage;
        this.scene.physics.add.existing(this.grenadeHurtbox);
        this.grenadeHurtbox.body.enable = false;

        this._explosionActive = false;
        this._explosionCenter = null;
    }

    getHurtboxes() {
        return [this.hurtbox, this.grenadeHurtbox];
    }

    getAnimSuffix() {
        return (this.isAttacking || this.isCharging) ? this.attackAnimSuffix : this.animSuffix;
    }

    startCharge() {
        this.isCharging = true;
        this.chargeStartTime = this.scene.time.now;
        this.chargeTime = 0;

        this.visible = true;

        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        this.attackAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );
    }

    releaseCharge() {
        if (!this.isCharging) return;

        this.isCharging = false;
        this.chargeTime = this.scene.time.now - this.chargeStartTime;
        console.log(`Bass charged for ${this.chargeTime} ms`);
        this.player.soundManager.setSFXVolume(1 + Math.min(this.chargeTime / this.maxChargeTime, 1) * 0.5);
        this.player.soundManager.playWithPitch('bajo_attk');
        this.player.soundManager.setSFXVolume(0.5);

        const chargeRatio = Math.min(this.chargeTime / this.maxChargeTime, 1);
        this.currentDamageMultiplier = 1 + chargeRatio * (this.maxDamageMultiplier - 1);

        this.finalChargeRatio = chargeRatio;

        this.hurtbox.body.enable = true;
        this.hurtbox.active = true;
        this.isAttacking = true;
        this.enemiesHit.clear();

        this.weaponAttackAnimation();

        this.scene.time.delayedCall(this.duration, () => {
            this.deactivateWeapon();
            this.currentDamageMultiplier = 1;
            this.finalChargeRatio = 0;
            this.setScale(-1.5, 1.5);
        });
    }

    attack(enemy, attackMod, hurtbox) {
        if (hurtbox === this.grenadeHurtbox) {
            if (hurtbox.enemiesHit.has(enemy)) return;
            enemy.getDamage(this.abilityDamage * attackMod, 300);
            hurtbox.enemiesHit.add(enemy);
            return;
        }

        if (this.enemiesHit.has(enemy)) return;
        const finalDamage = this.damage * attackMod * (this.currentDamageMultiplier || 1);
        enemy.getDamage(finalDamage, 300);
        this.enemiesHit.add(enemy);
    }

    cancelCharge() {
        this.isCharging = false;
        this.chargeTime = 0;
        this.deactivateWeapon();
    }

    weaponAttackAnimation() {
        const arcHalf = Math.PI / 2;
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

        this.hurtbox.setPosition(gx, gy);
        this.hurtbox.setRotation(angle);
    }

    ability() {
        if (!this.canUseAbility) return;
        this.canUseAbility = false;

        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );

        const targetX = this.player.x + Math.cos(angle) * this.abilityRange;
        const targetY = this.player.y + Math.sin(angle) * this.abilityRange;

        this.noteSprite.setPosition(this.player.x, this.player.y);
        this.noteSprite.setTexture('bass-note');
        this.noteSprite.setRotation(angle + Math.PI);
        this.noteSprite.setVisible(true);

        this.scene.game.events.emit('ultiStart', { weaponKey: this.iconKey, cooldown: this.abilityCooldown });

        this.scene.tweens.add({
            targets: this.noteSprite,
            x: targetX,
            y: targetY,
            duration: 400,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.noteSprite.play('bass_note_anim', true);

                this.noteSprite.once('animationcomplete-bass_note_anim', () => {
                    this.noteSprite.setVisible(false);
                    this._startExplosion(targetX, targetY);
                });
            }
        });

        this.scene.time.delayedCall(this.abilityCooldown, () => {
            this.canUseAbility = true;
            this.player.showCooldownCue(0xff4400);
            this.scene.game.events.emit('ultiReady', { weaponKey: this.iconKey });
        });
    }


    _startExplosion(x, y) {
        this._explosionCenter = { x, y };
        this._explosionActive = true;
        this.explosionSprite.setPosition(x, y);
        this.explosionSprite.setVisible(true);
        this.explosionSprite.play('bass_explosion_anim', true);
        this.grenadeHurtbox.setPosition(x, y);
        this.grenadeHurtbox.setRadius(this.abilityExplosionRadius);
        this.grenadeHurtbox.body.setCircle(this.abilityExplosionRadius);
        this.grenadeHurtbox.body.reset(x, y);
        this.grenadeHurtbox.body.enable = true;
        this.grenadeHurtbox.body.setImmovable(true);
        this.grenadeHurtbox.active = true;
        this.grenadeHurtbox.enemiesHit.clear();
        this.grenadeHurtbox.visible = false;
        this.explosionSprite.once('animationcomplete-bass_explosion_anim', () => {
            this._deactivateGrenade();
        });
    }


    _deactivateGrenade() {
        this.explosionSprite.setVisible(false);
        this.noteSprite.setVisible(false);
        this.grenadeHurtbox.body.enable = false;
        this.grenadeHurtbox.active = false;
        this.grenadeHurtbox.visible = false;
        this.grenadeHurtbox.enemiesHit.clear();
        this._explosionActive = false;
        this._explosionCenter = null;
    }

    preUpdate(t, dt) {
        this.x = this.player.x;
        this.y = this.player.y;

        if (this.isCharging) {
            const pointer = this.scene.input.activePointer;
            const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
            this.attackAngle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                worldPoint.x, worldPoint.y
            );


            const elapsed = this.scene.time.now - this.chargeStartTime;
            const chargeRatio = Math.min(elapsed / this.maxChargeTime, 1);
            const chargeDist = 30 + chargeRatio * 15;
            this.posicionarHitbox(this.attackAngle, chargeDist);


            const scaleBoost = 1 + chargeRatio * 1.0;
            this.setScale(-1.5 * scaleBoost, 1.5 * scaleBoost);
            this.hurtbox.setRadius(25 + chargeRatio * 12);

        } else if (this.isAttacking) {
            const ratio = this.finalChargeRatio || 0;
            const attackDist = 30 + ratio * 15;
            this.posicionarHitbox(this.swingAngle, attackDist);
        } else {
            const pointer = this.scene.input.activePointer;
            const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
            this.posicionarHitbox(angle, 22);
            this.setScale(-1.5, 1.5);
            this.hurtbox.setRadius(25);
        }
    }

}