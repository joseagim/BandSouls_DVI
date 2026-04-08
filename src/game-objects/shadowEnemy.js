import Phaser from 'phaser';
import Enemy from './enemy';

/**
 * Clase que representa el primer enemigo del juego. Es un enemigo de prueba que persigue al jugador.
 */
export default class ShadowEnemy extends Enemy {

    /**
     * Constructor del jugador
     * @param {Phaser.Scene} scene Escena a la que pertenece el jugador
     * @param {number} x Coordenada X
     * @param {number} y Coordenada Y
     */
    constructor(scene, x, y, stats) {
        super(scene, x, y, 'shadow', stats);

        // Estadísticas propias del enemigo
        this.attackDamage = stats.attackDamage;
        this.attackRange = stats.attackRange;
        this.attackRadius = stats.attackRadius;
        this.attackCooldown = stats.attackCooldown;
        this.canAttack = stats.canAttack;
        this.hasDamaged = stats.hasDamaged;
        this.is_knockback = stats.is_knockback;

        // Animaciones
        this.scene.anims.create({
            key : 'enemy_idle',
            frames: this.anims.generateFrameNames('enemy_idle',{ prefix: 'idle-', start: 1, end: 2 } ),
            frameRate: 5,
            repeat : -1
        });

        this.scene.anims.create({
            key : 'enemy_walk',
            frames: this.anims.generateFrameNames('enemy_walk',{ prefix: 'walk-', start: 1, end: 9 } ),
            frameRate: 10,
            repeat : -1
        });

        this.scene.anims.create({
            key : 'enemy_hit',
            frames: this.anims.generateFrameNames('enemy_hit',{ prefix: 'hit-', start: 1, end: 3 } ),
            frameRate: 4,
            repeat : -1
        });
        
        this.scene.anims.create({
            key: 'enemy_die',
            frames: this.anims.generateFrameNames('enemy_die',{ prefix: 'die-', start: 1, end: 16 } ),
            frameRate: 20,
            repeat : 0
        })

        this.on('animationcomplete', (anim) =>{
            if(anim.key =='enemy_die'){
                this.setActive(false);
                this.setVisible(false);
                this.body.enable = false;
            }
        })

        // bs escalado extraño para los colliders
        this.setScale(1.5);
        this.isDead = false;
        this.body.setSize(16, 16);
        this.body.setOffset(9, 15);
        this.play('enemy_idle',true);
        this.is_moving = false;
        this.label = this.scene.add.text(1080,10,"",{fontSize: 20});
    }

    spawn(x, y) {
        super.spawn(x, y);
        this.setTexture('enemy_walk');
    }

    die() {
        super.die();
        this.setTexture('enemy_die');
        this.play('enemy_die');
        //this.body.enable = false;

        /*
        this.death_timer = this.scene.time.delayedCall(800,() => {
            this.setActive(false);
            this.setVisible(false);


            //this.play('enemy_idle');
        }) 
            */
 

    }

    attack(player) {

    }

    /**
     * Métodos preUpdate de Phaser. En este caso solo se encarga del movimiento del jugador.
     * Como se puede ver, no se tratan las colisiones con las estrellas, ya que estas colisiones 
     * ya son gestionadas por la estrella (no gestionar las colisiones dos veces)saawd
     * @override
     */
    preUpdate(t, dt) {
        super.preUpdate(t, dt);

        if (!this.active || this.life <= 0 || this.isDead) return;

        if (this.scene.player.x <= this.x) {
            this.setFlip(true, false);
        }
        if (!this.scene.physics.overlap(this, this.scene.player) && !this.is_knockback) {
            this.move(dt);
        }
        else {//this.body.setVelocity(0);
            this.is_moving=false;
        }
    }


}
