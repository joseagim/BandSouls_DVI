import Phaser from 'phaser';
import actor from './actor';

/**
 * Clase que representa el primer enemigo del juego. Es un enemigo de prueba que persigue al jugador.
 */
export default class Enemy extends actor {

    /**
     * Constructor del jugador
     * @param {Phaser.Scene} scene Escena a la que pertenece el jugador
     * @param {number} x Coordenada X
     * @param {number} y Coordenada Y
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy', {   life        : 50,
                                        speed       : 100,
                                        defenseMod  : 1, 
                                        attackMod   : 1   
        });	

        // Estadísticas propias del enemigo
        this.attackDamage = 10;
        this.attackRange = 80;
        this.attackRadius = 20;
        this.attackCooldown = 1000;
        this.canAttack = true;
        this.hasDamaged = false

        // Animaciones
        this.scene.anims.create({
            key : 'enemy_idle',
            frames: this.anims.generateFrameNames('enemy_idle',{ prefix: 'idle-', start: 1, end: 2 } ),
            frameRate: 5,
            repeat : -1
        });

        this.scene.anims.create({
            key : 'enemy_walk',
            frames: this.anims.generateFrameNames('enemy_walk',{ prefix: 'walk-', start: 0, end: 9 } ),
            frameRate: 4,
            repeat : -1
        });
        
        // bs escalado extraño para los colliders
        this.setScale(4);
        this.body.setSize(16, 16);
        this.body.setOffset(9, 15);
        this.play('enemy_idle',true);
        this.is_moving = false;
        this.label = this.scene.add.text(1080,10,"",{fontSize: 20});
        this.updateScore();
        
    }

    
    
    die() {
        this.scene.enemy = null;
        this.destroy();
    }

    attack(player) {
        if(this.canAttack){
            console.error("ENTRA A ATTACK");
            player.getDamage(this.attackDamage);
            this.canAttack = false;
            

            this.scene.time.delayedCall(this.attackCooldown,() => {
                this.canAttack = true;
            })
        }
    }

    /**
     * Métodos preUpdate de Phaser. En este caso solo se encarga del movimiento del jugador.
     * Como se puede ver, no se tratan las colisiones con las estrellas, ya que estas colisiones 
     * ya son gestionadas por la estrella (no gestionar las colisiones dos veces)saawd
     * @override
     */
    preUpdate(t, dt) {
        super.preUpdate(t, dt);
        if (this.scene.player.x <= this.x) {
            this.setFlip(true, false);
        }
        if (!this.scene.physics.overlap(this, this.scene.player)) {
            this.scene.physics.moveToObject(this,this.scene.player,this.speed);
            this.play('enemy_walk',true);
        } else {this.body.setVelocity(0);
            this.is_moving=false;
        }
    }

}
