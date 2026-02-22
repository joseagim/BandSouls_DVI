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

        // Estadísticas
        this.life = 50;
        this.speed = 100;
        this.attackSpeed = 1;
        this.defenseMod = 1;
        this.attackDamage = 10;
        this.attackRange = 20000;
        this.state;

        // Animaciones
        this.scene.anims.create({
            key : 'walk',
            frames: this.anims.generateFrameNames('enemy',{ prefix: 'orc-walk-', start: 1, end: 6 } ),
            frameRate: 10,
            repeat : -1
        });

        // bs escalado extraño para los colliders
        this.setScale(4);
        this.body.setSize(8, 16);
        this.body.setOffset(45, 42);

        this.play('walk',true);
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
        this.scene.physics.moveToObject(this,this.scene.player,this.speed);
        if (Phaser.Math.Distance.Squared(this.x, this.y, this.scene.player.x, this.scene.player.y) <= this.attackRange) {
            console.log("FUNCIONA");
        }
    }

}
