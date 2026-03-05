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
        super(scene, x, y, 'enemy', {   life        : 20,
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
        this.is_knockback = false;

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
            frameRate: 4,
            repeat : -1
        });

        this.scene.anims.create({
            key : 'enemy_hit',
            frames: this.anims.generateFrameNames('enemy_hit',{ prefix: 'hit-', start: 1, end: 3 } ),
            frameRate: 4,
            repeat : -1
        });
        
        // bs escalado extraño para los colliders
        this.setScale(1.5);
        this.body.setSize(16, 16);
        this.body.setOffset(9, 15);
        this.play('enemy_idle',true);
        this.is_moving = false;
        this.label = this.scene.add.text(1080,10,"",{fontSize: 20});     
    }

    spawn(x, y) {
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(x, y);
        this.body.enable = true;
        this.life = this.maxHP;
    }
    
    die() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.is_knockback = false;
    }

    attack(player) {
        if (this.canAttack) {
            player.getDamage(this.attackDamage * this.attackMod);
            this.canAttack = false;
            

            this.scene.time.delayedCall(this.attackCooldown, () => {
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

        if (!this.active) return;

        if (this.scene.player.x <= this.x) {
            this.setFlip(true, false);
        }
        if (!this.scene.physics.overlap(this, this.scene.player) && !this.is_knockback) {
            this.move();
        }
        else {//this.body.setVelocity(0);
            this.is_moving=false;
        }
    }

    playHit(){
        this.play('enemy_hit',true);
    }

    knockback(){
        if(this.is_knockback) return;
        this.is_knockback = true;

        this.playHit();

        const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, this.x, this.y);
        const knockbackForce = 300;

       // console.log("La velocidad aqui es %d %d",Math.cos(angle) * knockbackForce,Math.sin(angle) * knockbackForce);
        this.body.setVelocityX(Math.cos(angle) * knockbackForce);
          
        this.body.setVelocityY(Math.sin(angle) * knockbackForce);
       // console.log("La velocidad aqui es %d",this.speed);

        this.scene.time.delayedCall(200, () => {
                this.is_knockback = false;
                console.log("KNOCKBACK ES FALSO");
                //this.move();
        });
      //  console.log("La velocidad aqui es %d",this.speed);
        

    }

    move(){
        this.scene.physics.moveToObject(this,this.scene.player,this.speed);
        this.play('enemy_walk',true);
    }

}
