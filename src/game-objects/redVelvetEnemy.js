import Phaser from 'phaser'
import Enemy from './enemy'

export default class RedVelvetEnemy extends Enemy {
    constructor(scene, x, y, stats) {
        super(scene, x, y, 'redVelvet', stats);
    
        // Estadísticas propias del enemigo
        this.attackDamage = stats.attackDamage;
        this.attackRange = stats.attackRange;
        this.attackRadius = stats.attackRadius;
        this.attackCooldown = stats.attackCooldown;
        this.canAttack = stats.canAttack;
        this.hasDamaged = stats.hasDamaged;
        this.is_knockback = stats.is_knockback;
        
        this.states = {
            ATTACKING_RANGED: 0,
            ATTACKING_MELEE: 1,
            FLEEING: 2,
            MOVING: 3
        }
        this.state = this.states.MOVING;
        
        this.scene.anims.create({
            key : 'redVelvet_walk',
            frames: this.anims.generateFrameNames('redVelvet_walk',{ prefix: 'redVelvetWalk', start: 1, end: 8 } ),
            frameRate: 8,
            repeat : -1
        });

        this.play('redVelvet_walk');
    }

    die() {
        super.die();
        this.visible = false;
    }
    updateState() {

    }

    preUpdate(t, dt) {
        super.preUpdate(t, dt);

        if (!this.active || this.life <= 0 || this.isDead) return;
        
        if (this.scene.player.x <= this.x) {
            this.setFlip(true, false);
        }

        // uptade state
        this.updateState();

        // si estoy lejos y puedo hacer ataque a distancia => ataque a distancia
        if (this.state == this.states.ATTACKING_RANGED) {
            this.rangedAttack();
        }

        // si estoy cerca y puedo hacer ataque melee => ataque a melee
        else if (this.state == this.states.ATTACKING_RANGED) {
            this.rangedAttack();
        }

        // si estoy cerca y no puedo hacer ataque a melee => huir
        else if (this.state == this.states.ATTACKING_RANGED) {
            this.rangedAttack();
        }
        // otherwise => acercarse al personaje
        else {
            this.move(dt);
        }

    }

}