import Phaser from 'phaser';
import Arma from './arma.js'

export default class Drum extends Arma {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, 'drumSticks', { damage: stats.damage, cooldown: stats.cooldown, duration: stats.duration });
        this.stunDuration = stats.stunDuration;
        this.knockback = stats.knockback;

        this.player = player;
        this.visible = false;

        const POOL_SIZE = 2;
        this.hurtboxPool = Array.from({ length: POOL_SIZE }, () => {
            const hb = this.scene.add.circle(0, 0, 8, 0xff0000);
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

        // Ultimate ability
        this.iconKey = 'drum-icon';
        this.abilityDamage = stats.abilityDamage;
        this.abilityCooldown = stats.abilityCooldown;
        this.abilityKnockback = stats.abilityKnockback;
        this.abilityStunDuration = stats.abilityStunDuration;
        this.abilityRadius = stats.abilityRadius;
        this.canUseAbility = true;

        // Smash hurtbox — large circle centered on player
        this.smashHurtbox = this.scene.add.circle(0, 0, this.abilityRadius, 0xffaa00);
        this.smashHurtbox.visible = false;
        this.smashHurtbox.active = false;
        this.smashHurtbox.enemiesHit = new Set();
        this.smashHurtbox.damage = this.abilityDamage;
        this.scene.physics.add.existing(this.smashHurtbox);
        this.smashHurtbox.body.enable = false;

        // Smash animation sprite
        if (!this.scene.anims.exists('drum_smash_anim')) {
            this.scene.anims.create({
                key: 'drum_smash_anim',
                frames: this.scene.anims.generateFrameNames('drum-smash', {
                    prefix: 'smash_',
                    start: 0,
                    end: 5
                }),
                frameRate: 30,
                repeat: 0
            });
        }

        this.smashSprite = this.scene.add.sprite(0, 0, 'drum-smash');
        this.smashSprite.setScale(2.5);
        this.smashSprite.setVisible(false);
        this.smashSprite.setDepth(0);

        this.smashSprite.on('animationcomplete-drum_smash_anim', () => {
            this.smashSprite.setVisible(false);
        });
    }

    getAnimSuffix() {
        return '-drum';
    }

    getHurtboxes() {
        return [...this.hurtboxPool, this.smashHurtbox];
    }

    posicionarHitbox(hurtbox, angle) {
        hurtbox.body.reset(this.player.x, this.player.y);
        hurtbox.body.enable = true;
        hurtbox.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
    }

    weaponAttackAnimation(hurtbox, angle) {
        hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
        hurtbox.sprite.setRotation(angle);
        hurtbox.sprite.visible = true;
    }

    attack(enemy, attackMod, hurtbox) {
        if (hurtbox.enemiesHit.has(enemy)) return;
        if (hurtbox === this.smashHurtbox) {
            enemy.getDamage(this.abilityDamage * attackMod, this.abilityKnockback, this.abilityStunDuration);
            hurtbox.enemiesHit.add(enemy);
        } else {
            enemy.getDamage(this.damage * attackMod, this.knockback, this.stunDuration);
            this._deactivateProjectile(hurtbox);
        }
    }

    ability() {
        if (!this.canUseAbility) return;
        this.canUseAbility = false;

        const fx = this.player.x;
        const fy = this.player.y;

        this.smashHurtbox.setPosition(fx, fy);
        this.smashHurtbox.body.reset(fx, fy);
        this.smashHurtbox.body.enable = true;
        this.smashHurtbox.body.setImmovable(true);
        this.smashHurtbox.active = true;
        this.smashHurtbox.enemiesHit.clear();

        this.smashSprite.setPosition(fx, fy - 15);
        this.smashSprite.setAlpha(0.9);
        this.smashSprite.setVisible(true);
        this.smashSprite.play('drum_smash_anim', true);

        this.scene.game.events.emit('ultiStart', { weaponKey: this.iconKey, cooldown: this.abilityCooldown });

        // Deactivate hurtbox after animation (6 frames @ 30fps ≈ 200ms)
        this.scene.time.delayedCall(210, () => {
            this.smashHurtbox.body.enable = false;
            this.smashHurtbox.active = false;
            this.smashHurtbox.enemiesHit.clear();
        });

        this.scene.time.delayedCall(this.abilityCooldown, () => {
            this.canUseAbility = true;
            this.player.showCooldownCue(0xffaa00);
            this.scene.game.events.emit('ultiReady', { weaponKey: this.iconKey });
        });
    }

    _deactivateProjectile(hurtbox) {
        if (hurtbox.durationTimer) {
            hurtbox.durationTimer.remove();
            hurtbox.durationTimer = null;
        }
        hurtbox.body.enable = false;
        hurtbox.body.setVelocity(0, 0);
        hurtbox.active = false;
        hurtbox.sprite.visible = false;
        if (!this.hurtboxPool.some(h => h.active)) this.isAttacking = false;
    }

    startAttack() {
        const hurtbox = this.hurtboxPool.find(h => !h.active);
        if (!hurtbox) return;

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

        hurtbox.durationTimer = this.scene.time.delayedCall(this.duration, () => {
            this._deactivateProjectile(hurtbox);
        });
    }

    deactivateWeapon() {
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
                hurtbox.sprite.rotation += 0.2;
            }
        }
    }
}
