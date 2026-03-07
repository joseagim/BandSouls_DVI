import Phaser from 'phaser';
import Arma from './arma.js'
import Enemy from './enemy.js';

export default class Guitar extends Arma{
    constructor(scene,x,y,player){
        super(scene,x,y, 'guitarSprite',  {   damage      : 10,
                                        cooldown    : 700,
                                        duration    : 250});

        this.player = player;
        this.setScale(-1.5, 1.5);
        this.visible = false;
        this.hurtbox = this.scene.add.circle(0,0,20,0xff0000);
        this.hurtbox.visible = false;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this.hurtbox);
        this.deactivateWeapon()
    }

    getHurtboxes() {
        return [this.hurtbox];
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
        // guitarra
        const gx = this.player.x + Math.cos(angle) * dist;
        const gy = this.player.y + Math.sin(angle) * dist;
        this.setPosition(gx, gy);
        this.setRotation(angle);

        // hitbox
        this.hurtbox.setPosition(gx, gy);
        this.hurtbox.setRotation(angle);
    }

    preUpdate(t, dt){
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
    }
}