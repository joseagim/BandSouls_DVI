import Phaser from 'phaser';
import actor from '../actor';

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
    constructor(scene, x, y, tag, stats) {
        super(scene, x, y, tag, stats);
        this.ContactDamage = 10;
        this.contacAttackCooldown = 1000;
        this.canContactAttack = true;
    }

    spawn(x, y) {
        this.isDead = false;
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(x, y);
        this.body.enable = true;

        if (this.body) {
            this.body.enable = true;
            this.body.checkCollision.none = false; 
        }

        this.life = this.maxHP;
        
        // Resetear pathfinding
        this.currentPath = null;
        this.pathIndex = 0;
        this.pathfindingCooldown = false;
        this._lastPos = { x: this.body.center.x, y: this.body.center.y };
        this._stuckTimer = 0;
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        if (this.body) {
            this.body.checkCollision.none = true;
            this.body.stop(); // Detenemos movimiento errático
        }

        const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, this.x, this.y);
        const knockbackForce = 100;

        // console.log("La velocidad aqui es %d %d",Math.cos(angle) * knockbackForce,Math.sin(angle) * knockbackForce);
        this.body.setVelocityX(Math.cos(angle) * knockbackForce);

        this.body.setVelocityY(Math.sin(angle) * knockbackForce);
        //this.body.stop();
        this.is_knockback = false;
        //this.body.enable = false;
        this.scene.enemyDies(this);
        /*
        this.death_timer = this.scene.time.delayedCall(800,() => {
            this.setActive(false);
            this.setVisible(false);


            //this.play('enemy_idle');
        }) 
            */
    }

    attackOnContact(player) {
        if (this.canContactAttack) {
            player.getDamage(this.ContactDamage * this.attackMod);
            this.canContactAttack = false;
            

            this.scene.time.delayedCall(this.contacAttackCooldown, () => {
                this.canContactAttack = true;
            })
        }
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
        const bounds = {
            x : 40,
            y : 40,
            right : this.scene.gridWidth * this.scene.pathfinderTileSize,
            bottom : this.scene.gridHeight * this.scene.pathfinderTileSize
        }

        if (this.x <= bounds.x) {
            this.body.setVelocityX(0);
        } else if (this.x >= bounds.right - 1) {
            this.body.setVelocityX(0);
        }
        
        if (this.y <= bounds.y) {
            this.body.setVelocityY(0);
        } else if (this.y >= bounds.bottom - 1) {
            this.body.setVelocityY(0);
        }
    }

    playHit() {}

    knockback(force = 300) {
        if (this.is_knockback || this.life <= 0) return;
        this.is_knockback = true;

        this.playHit();

        const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, this.x, this.y);
        const knockbackForce = force;

        // console.log("La velocidad aqui es %d %d",Math.cos(angle) * knockbackForce,Math.sin(angle) * knockbackForce);
        this.body.setVelocityX(Math.cos(angle) * knockbackForce);

        this.body.setVelocityY(Math.sin(angle) * knockbackForce);
        // console.log("La velocidad aqui es %d",this.speed);
        const bounds = {
            x : 40,
            y : 40,
            right : this.scene.gridWidth * this.scene.pathfinderTileSize,
            bottom : this.scene.gridHeight * this.scene.pathfinderTileSize
        }

        console.log(bounds)
        console.log ("x: " + this.x + " | y: " + this.y)
        if (this.x <= bounds.x + 1) {
            this.body.setVelocityX(0);
        } else if (this.x >= bounds.right - 1) {
            this.body.setVelocityX(0);
        }
        
        if (this.y <= bounds.y + 1) {
            this.body.setVelocityY(0);
        } else if (this.y >= bounds.bottom - 1) {
            this.body.setVelocityY(0);
        }

        this.scene.time.delayedCall(200, () => {
            if (this.active) {
                this.is_knockback = false;
                console.log("KNOCKBACK ES FALSO");
                //this.move();
            }
        });
        //  console.log("La velocidad aqui es %d",this.speed);


    }

    getDamage(dmg, knockbackForce = 300) {
        const wasAlive = this.life > 0;
        super.getDamage(dmg);
        if (this.life > 0 && wasAlive) {
            this.knockback(knockbackForce);
        }
    }

    move(_dt) {  
        const bounds = {
            x : 40,
            y : 40,
            right : this.scene.gridWidth * this.scene.pathfinderTileSize,
            bottom : this.scene.gridHeight * this.scene.pathfinderTileSize
        }      
        if (this.x < bounds.x) {
            this.setPosition(bounds.x + 1, this.y);
        } else if (this.x >= bounds.right) {
            this.setPosition(bounds.right - bounds.x - 1, this.y);
        }
        
        if (this.y < bounds.y) {
            this.setPosition(this.x, bounds.y + 1);
        } else if (this.y >= bounds.bottom) {
            this.setPosition(this.x, bounds.bottom - bounds.y - 1);
        }}

}