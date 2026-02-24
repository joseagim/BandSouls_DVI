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

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        // Queremos que el enemigo no se salga de los límites del mundo
        this.body.setCollideWorldBounds();

        // Estadísticas propias del enemigo
        this.attackDamage = 10;
        this.attackRange = 80;
        this.attackRadius = 20;
        this.attackCooldown = 1000;
        this.canAttack = true;
        this.state;
        this.hurtbox = new Phaser.GameObjects.Sprite(scene, x, y, 'hurtbox');

        // Animaciones
        this.scene.anims.create({
            key : 'walk',
            frames: this.anims.generateFrameNames('enemy',{ prefix: 'orc-walk-', start: 1, end: 6 } ),
            frameRate: 10,
            repeat : -1
        });

        // Cosas para el ataque 
        this.hurtbox.setVisible(false);
        this.hurtbox.active = false;

        this.scene.add.existing(this.hurtbox);
        this.scene.physics.add.existing(this.hurtbox);
        // bs escalado extraño para los colliders
        this.setScale(4);
        this.body.setSize(8, 16);
        this.body.setOffset(45, 42);
        this.hurtbox.body.setCircle(this.attackRadius);
        this.hurtbox.body.setCollideWorldBounds();
        this.play('walk',true);
    }
    
    die() {
        this.scene.enemy = null;
        this.hurtbox.destroy();
        this.hurtbox = null;
        this.destroy();
    }

    attack(player) {
        this.hurtbox.setPosition(this.scene.player.x, this.scene.player.y);

        this.hurtbox.setVisible(true);
        this.hurtbox.active = true;

        this.scene.time.delayedCall(this.attackDuration, () => {if (this.hurtbox !== null) {this.hurtbox.active = false; this.hurtbox.setVisible(false);}});
        this.scene.time.delayedCall(this.attackCooldown, () => {if (this.hurtbox !== null) {this.hurtbox.active = false; this.hurtbox.setVisible(false); this.canAttack = true;}});
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
        } else {this.body.setVelocity(0);}
        
        
        if (this.canAttack && Phaser.Math.Distance.Between(this.x, this.y + 42, this.scene.player.x, this.scene.player.y) <= this.attackRange && this.hurtbox !== null) {
            this.canAttack = false;
            this.attack(this.scene.player);
        }
    }

}
