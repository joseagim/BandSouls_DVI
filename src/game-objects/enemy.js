import Phaser from 'phaser';

/**
 * Clase que representa el primer enemigo del juego. Es un enemigo de prueba que persigue al jugador.
 */
export default class Enemy extends Phaser.GameObjects.Sprite {

    /**
     * Constructor del jugador
     * @param {Phaser.Scene} scene Escena a la que pertenece el jugador
     * @param {number} x Coordenada X
     * @param {number} y Coordenada Y
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');	
    
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        // Queremos que el enemigo no se salga de los límites del mundo
        this.body.setCollideWorldBounds();
        this.speed = 100;
        this.scene.anims.create({
            key : 'walk',
            frames: this.anims.generateFrameNames('enemy',{ prefix: 'orc-walk-', start: 1, end: 6 } ),
            frameRate: 10,
            repeat : -1
        });
        this.play('walk',true);
    }


    /**
     * Métodos preUpdate de Phaser. En este caso solo se encarga del movimiento del jugador.
     * Como se puede ver, no se tratan las colisiones con las estrellas, ya que estas colisiones 
     * ya son gestionadas por la estrella (no gestionar las colisiones dos veces)
     * @override
     */
    preUpdate(t, dt) {
        super.preUpdate(t, dt);
        this.scene.physics.moveToObject(this,this.scene.player,this.speed);
    }

}
