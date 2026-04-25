import Phaser from 'phaser';
import Arma from './arma.js'

export default class Guitar extends Arma {
    constructor(scene, x, y, player, stats) {
        super(scene, x, y, 'guitarSprite', { damage: stats.damage, cooldown: stats.cooldown, duration: stats.duration });

        this.player = player;
        this.setScale(-1.5, 1.5);
        this.visible = false;
        this.hurtbox = this.scene.add.circle(0, 0, 20, 0xff0000);
        this.hurtbox.visible = false;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this.hurtbox);
        this.deactivateWeapon();

        // Ultimate ability
        this.iconKey = 'guitar-icon';
        this.abilityDamage = stats.abilityDamage;
        this.abilityCooldown = stats.abilityCooldown;
        this.canUseAbility = true;

        // Riff hurtbox — circle that travels with the wave
        this.riffHurtbox = this.scene.add.circle(0, 0, 24, 0xff6600);
        this.riffHurtbox.visible = false;
        this.riffHurtbox.active = false;
        this.riffHurtbox.enemiesHit = new Set();
        this.riffHurtbox.damage = this.abilityDamage;
        this.scene.physics.add.existing(this.riffHurtbox);
        this.riffHurtbox.body.enable = false;

        // Animated wave sprite
        if (!this.scene.anims.exists('guitar_riff_anim')) {
            this.scene.anims.create({
                key: 'guitar_riff_anim',
                frames: this.scene.anims.generateFrameNames('guitar-riff', {
                    prefix: 'riff_',
                    start: 0,
                    end: 3
                }),
                frameRate: 12,
                repeat: -1
            });
        }

        this.riffSprite = this.scene.add.sprite(0, 0, 'guitar-riff');
        this.riffSprite.setScale(2);
        this.riffSprite.setVisible(false);
        this.riffSprite.setDepth(50);
    }

    getHurtboxes() {
        return [this.hurtbox, this.riffHurtbox];
    }

    getAnimSuffix() {
        return this.isAttacking ? '' : '-guitar';
    }

    weaponAttackAnimation() {
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        const startAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );
        const arcHalf = 0.5;
        this.swingAngle = startAngle - arcHalf;
        this.scene.tweens.add({
            targets: this,
            swingAngle: startAngle + arcHalf,
            duration: this.duration,
            ease: 'Back.easeInOut',
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
        const speed = 300;

        this.riffHurtbox.body.reset(this.player.x, this.player.y);
        this.riffHurtbox.body.enable = true;
        this.riffHurtbox.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.riffHurtbox.active = true;
        this.riffHurtbox.enemiesHit.clear();

        this.riffSprite.setPosition(this.player.x, this.player.y);
        this.riffSprite.setRotation(angle + Math.PI / 2);
        this.riffSprite.setVisible(true);
        this.riffSprite.play('guitar_riff_anim', true);

        this.scene.game.events.emit('ultiStart', { weaponKey: this.iconKey, cooldown: this.abilityCooldown });

        this.scene.time.delayedCall(1500, () => {
            this._deactivateRiff();
        });

        this.scene.time.delayedCall(this.abilityCooldown, () => {
            this.canUseAbility = true;
            this.player.showCooldownCue(0xff8800);
            this.scene.game.events.emit('ultiReady', { weaponKey: this.iconKey });
        });
    }

    _deactivateRiff() {
        this.riffHurtbox.body.enable = false;
        this.riffHurtbox.body.setVelocity(0, 0);
        this.riffHurtbox.active = false;
        this.riffSprite.setVisible(false);
        this.riffHurtbox.enemiesHit.clear();
    }

    preUpdate(t, dt) {
        this.x = this.player.x;
        this.y = this.player.y;

        if (this.isAttacking) {
            this.posicionarHitbox(this.swingAngle, 28);
        } else {
            const pointer = this.scene.input.activePointer;
            const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
            this.posicionarHitbox(angle, 20);
        }

        if (this.riffHurtbox.active) {
            this.riffSprite.setPosition(this.riffHurtbox.x, this.riffHurtbox.y);
        }
    }
}
