import Phaser from 'phaser';
import Arma from './arma'
import Guitar from './guitar';

/**
 * Clase que representa el jugador del juego. El jugador se mueve por el mundo usando los cursores.
 * También almacena la puntuación o número de estrellas que ha recogido hasta el momento.
 */
export default class Player extends Phaser.GameObjects.Sprite {

    /**
     * Constructor del jugador
     * @param {Phaser.Scene} scene Escena a la que pertenece el jugador
     * @param {number} x Coordenada X
     * @param {number} y Coordenada Y
     */

    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        this.score = 0;
        this.x = x;
        this.y = y;
                 
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        // Queremos que el jugador no se salga de los límites del mundo
        this.body.setCollideWorldBounds();

        // Velocidades
        this.speed = 300;
        this.dashSpeed = 2000;
        this.dashDuration = 25;
        this.dashCooldown = 300;

        // Estados
        this.isDashing = false;
        this.canDash = true;

        // Esta label es la UI en la que pondremos la puntuación del jugador
        this.label = this.scene.add.text(10, 10, "", {fontSize: 20});
        
        //Seccion de armas
        this.arma = new Guitar(this.scene);

        // this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyF = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.mouseClick = this.scene.input.on('pointerdown', (pointer) => {
            if(pointer.button == 2){    //segun documentación 2 es el botón derechp
                console.log("Presionando ratón");
                this.attack(this.x,this.y,this.getDirection(),this.scene.enemy);
            }
        });


        this.updateScore();
    }

    /**
     * El jugador ha recogido una estrella por lo que este método añade un punto y
     * actualiza la UI con la puntuación actual.
     */
    point() {
        this.score++;
        this.updateScore();
    }

    /**
     * Actualiza la UI con la puntuación actual
     */
    updateScore() {
        this.label.text = 'Score: ' + this.score;
    }

    /**
     * Métodos preUpdate de Phaser. En este caso solo se encarga del movimiento del jugador.
     * Como se puede ver, no se tratan las colisiones con las estrellas, ya que estas colisiones 
     * ya son gestionadas por la estrella (no gestionar las colisiones dos veces)
     * @override
     */
    preUpdate(t, dt) {
        super.preUpdate(t, dt);
        let isHorizontal = false;

        if (this.isDashing) return;
       
        this.body.setVelocity(0);
        
        if (this.keyA.isDown) {
            isHorizontal = true;
            this.body.setVelocityX(-this.speed);

        } else if (this.keyD.isDown) {
            isHorizontal = true;
            this.body.setVelocityX(this.speed);
        }

        
        if (this.keyW.isDown) {
            isHorizontal = false;
            this.body.setVelocityY(-this.speed);
        } else if (this.keyS.isDown) {
            isHorizontal = false;
            this.body.setVelocityY(this.speed);;
        }

        this.body.velocity.normalize().scale(this.speed);

        if (this.keySpace.isDown && this.canDash && this.body.velocity.length() > 0) {
            this.doDash();
        }
        
        if (this.keyF.isDown && this.scene.enemy !== null && this.canDash) {
            this.isDashing = true;
            this.canDash = false;
            this.scene.enemy.getDamage(10);
            this.scene.time.delayedCall(this.dashDuration, () => {
                this.isDashing = false;
            });
            this.scene.time.delayedCall(this.dashCooldown, () => {
                this.canDash = true;
            });
        }

    }
    
    doDash() {
        this.isDashing = true;
        this.canDash = false;
        
        this.body.velocity.normalize().scale(this.dashSpeed);

        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
        });

        // 2. Volvemos a permitir el dash después de un cooldown (ej. 1 segundo)
        this.scene.time.delayedCall(this.dashCooldown, () => {
            this.canDash = true;
        });
    }

    attack() {
        if(!this.arma.attacking){
            this.arma.attack();
        }
    }

    getDirection() {
    const direction = { x: 0, y: 0 };
    
    // Ejemplo con cursores (asumiendo que tienes cursores configurados)
    if (this.keyA.isDown) direction.x = -1;
    if (this.keyD.isDown) direction.x = 1;
    if (this.keyW.isDown) direction.y = -1;
    if (this.keyS.isDown) direction.y = 1;
    
    // Normalizar para diagonales (evitar velocidad extra)
    if (direction.x !== 0 && direction.y !== 0) {
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        direction.x /= length;
        direction.y /= length;
    }
    
    return direction;
}
    

}
