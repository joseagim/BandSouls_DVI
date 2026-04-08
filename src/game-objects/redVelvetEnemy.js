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
        console.log("Red Velvet Deployed");
        
        this.scene.anims.create({
            key : 'redVelvet_walk',
            frames: this.anims.generateFrameNames('redVelvet_walk',{ prefix: 'redVelvetWalk', start: 1, end: 8 } ),
            frameRate: 8,
            repeat : -1
        });

        this.play('redVelvet_walk');
    }

}