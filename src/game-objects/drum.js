import Phaser from 'phaser';
import Arma from './arma.js'

export default class Drum extends Arma{
    constructor(scene,x,y,player){
        super(scene,x,y, 'drumSticks',  {   damage      : 5,
                                            cooldown    : 150,
                                            duration    : 1000});

        this.player = player;
        this.visible = false;

        const POOL_SIZE = 4;
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
    }

    getAnimSuffix() {
        return '-drum';
    }

    getHurtboxes() {
        return this.hurtboxPool;
    }

    // Posiciona el hurtbox en el centro del jugador y le da velocidad
    posicionarHitbox(hurtbox, angle) {
        hurtbox.body.reset(this.player.x, this.player.y);
        hurtbox.body.enable = true;
        hurtbox.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
    }

    // Inicializa el sprite del proyectil orientado hacia el ángulo de disparo
    weaponAttackAnimation(hurtbox, angle) {
        hurtbox.sprite.setPosition(hurtbox.x, hurtbox.y);
        hurtbox.sprite.setRotation(angle);
        hurtbox.sprite.visible = true;
    }

    attack(enemy, attackMod, hurtbox) {
        if (hurtbox.enemiesHit.has(enemy)) return;
        enemy.getDamage(this.damage * attackMod);
        enemy.knockback();
        hurtbox.enemiesHit.add(enemy);
        if (hurtbox.enemiesHit.size >= 3) this._deactivateProjectile(hurtbox);
    }

    _deactivateProjectile(hurtbox) {
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

        this.scene.time.delayedCall(this.duration, () => {
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
