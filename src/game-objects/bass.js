import Phaser from 'phaser';
import Arma from './arma.js'
import bajo from '../../assets/sprites/bajo.png'

export default class Bass extends Arma {
    constructor(scene, x, y, player) {
        super(scene, x, y, 'bajo', {
            damage: 20,
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
        this.chargeTime = 0;
    }

    getHurtboxes() {
        return [this.hurtbox];
    }

    weaponAttackAnimation() {
        const pointer = this.scene.input.activePointer;
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);

        const targetAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );

        const startAngle = targetAngle - Math.PI;
        this.swingAngle = startAngle;

        let damageMultiplier = 1 + Math.min(this.chargeTime / 1000, 2);
        this.damage = 20 * damageMultiplier;

        this.scene.tweens.add({
            targets: this,
            swingAngle: targetAngle,
            duration: this.duration,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.chargeTime = 0;
            }
        });
    }

    posicionarHitbox(angle, dist) {
        const gx = this.player.x + Math.cos(angle) * dist;
        const gy = this.player.y + Math.sin(angle) * dist;
        this.setPosition(gx, gy);
        this.setRotation(angle);

        // Mover también la hurtbox (sin esto se queda en (0,0))
        this.hurtbox.setPosition(gx, gy);
        this.hurtbox.setRotation(angle);
    }

    preUpdate(t, dt) {
        this.x = this.player.x;
        this.y = this.player.y;

        if (this.isAttacking) {
            this.posicionarHitbox(this.swingAngle, 30);
        } else {
            const pointer = this.scene.input.activePointer;
            const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
            this.posicionarHitbox(angle, 22);
        }
    }

}