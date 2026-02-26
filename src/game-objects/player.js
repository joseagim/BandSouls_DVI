import Phaser from 'phaser';
import Arma from './arma';
import actor from './actor';
import Guitar from './guitar';

/**
 * Clase que representa el jugador del juego. El jugador se mueve por el mundo usando los cursores.
 * También almacena la puntuación o número de estrellas que ha recogido hasta el momento.
 */
export default class Player extends actor {

    /**
     * Constructor del jugador
     * @param {Phaser.Scene} scene Escena a la que pertenece el jugador
     * @param {number} x Coordenada X
     * @param {number} y Coordenada Y
     */

    constructor(scene, x, y) {
        super(scene, x, y, 'player', {  life        : 100,
                                        speed       : 300,
                                        defenseMod  : 1, 
                                        attackMod   : 1});
        this.score = 0;
        this.x = x;
        this.y = y;
                 
        // Velocidades
        this.speed = 300;
        this.dashSpeed = 2000;
        this.dashDuration = 25;
        this.dashCooldown = 300;

        // Estados
        this.isDashing = false;
        this.canDash = true;
        this.lastDirection = 'down';

        // Sprites
        this.createAnimations();

        this.body.setSize(12, 24);
        this.body.setOffset(10, 8);
        this.setScale(4);
        this.play('idle-down', true);

        // Esta label es la UI en la que pondremos la puntuación del jugador
        this.label = this.scene.add.text(10, 10, "", {fontSize: 20});
        


        // this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        // this.keyF = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F); DEBUG FOR DAMAGE
        this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.mouseClick = this.scene.input.on('pointerdown', (pointer) => {
            if(pointer.button == 0){    //segun documentación 0 es el botón derechp
                //console.log("Presionando ratón");
                this.attack();
            }
        });

        // Seccion de armas
        this.arma = new Guitar(this.scene,this.x,this.y,this);

        this.enemigo = null;


        this.updateScore();
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
            this.lastDirection = 'left';
            this.body.setVelocityX(-this.speed);

        } else if (this.keyD.isDown) {
            isHorizontal = true;
            this.lastDirection = 'right';
            this.body.setVelocityX(this.speed);
        }

        
        if (this.keyW.isDown) {
            isHorizontal = false;
            this.lastDirection = 'up';
            this.body.setVelocityY(-this.speed);
        } else if (this.keyS.isDown) {
            isHorizontal = false;
            this.lastDirection = 'down';
            this.body.setVelocityY(this.speed);;
        }

        this.body.velocity.normalize().scale(this.speed);

        this.updateAnimation();

        if (this.keySpace.isDown && this.canDash && this.body.velocity.length() > 0) {
            this.doDash();
        }
        
        /* DEBUG ENEMY TAKING DAMAGE
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
        } */

    }
    
    doDash() {
        // el jugador hace dash
        this.isDashing = true;
        this.canDash = false;
        
        // velocidad en función del vector dirección del jugador
        this.body.velocity.normalize().scale(this.dashSpeed);
        
        // cuando termine el dash
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
        });

        // cuando termine el cooldown del dash
        this.scene.time.delayedCall(this.dashCooldown, () => {
            this.canDash = true;
        });
    }

    attack() {
        if(!this.arma.attacking){
            this.arma.attacking = true;

            this.arma.enemigoActual = this.enemigo;
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

    setEnemigo(enemigo){
        this.enemigo = enemigo;
    }

    updateAnimation() {
        // para evitar todo el rato this.body.velocity
        const vel = this.body.velocity;

        // si se está moviendo
        if (vel.length() > 0) {
            if (Math.abs(vel.x) > Math.abs(vel.y)) {
                this.flipX = (vel.x < 0);
                this.play('run-right', true);
            } else {
                this.flipX = false;
                if (vel.y < 0) this.play('run-up', true);
                else this.play('run-down', true);
            }
        } 
        // si está quieto
        else {
            // miramos la última dirección
            switch (this.lastDirection) {
                case 'left':
                    this.flipX = true;
                    this.play('idle-right', true);
                    break;
                case 'right':
                    this.flipX = false;
                    this.play('idle-right', true);
                    break;
                case 'up':
                    this.flipX = false;
                    this.play('idle-up', true);
                    break;
                case 'down':
                    this.flipX = false;
                    this.play('idle-down', true);
                    break;
            }
        }
    }

    createAnimations() {
        this.scene.anims.create({
            key: 'idle-down',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'idle_down_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-up',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'idle_up_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-right',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'idle_right_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-down',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'run_down_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-up',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'run_up_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-right',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'run_right_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
    }
    

}
