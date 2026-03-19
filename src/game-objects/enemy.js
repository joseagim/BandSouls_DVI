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
    constructor(scene, x, y, tag, stats) {
        super(scene, x, y, tag, stats);
    }

    spawn(x, y) {

    }

    die() {

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

    playHit(){
        if(this.life <= 0) return;
        this.play('enemy_hit',true);
    }

    knockback(){
        if(this.is_knockback || this.life <= 0) return;
        this.is_knockback = true;

        this.playHit();

        const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, this.x, this.y);
        const knockbackForce = 300;

       // console.log("La velocidad aqui es %d %d",Math.cos(angle) * knockbackForce,Math.sin(angle) * knockbackForce);
        this.body.setVelocityX(Math.cos(angle) * knockbackForce);
          
        this.body.setVelocityY(Math.sin(angle) * knockbackForce);
       // console.log("La velocidad aqui es %d",this.speed);

        this.scene.time.delayedCall(200, () => {
            if(this.active){
                this.is_knockback = false;
                console.log("KNOCKBACK ES FALSO");
                //this.move();
                }
        });
      //  console.log("La velocidad aqui es %d",this.speed);
        

    }

    move(dt){
        if (this.scene.easystar) {
            this._moveWithPathfinding(dt);
        } else {
            this.scene.physics.moveToObject(this, this.scene.player, this.speed);
            this.play('enemy_walk', true);
        }
    }

    _moveWithPathfinding(dt) {
        const tileSize = this.scene.pathfinderTileSize;
        const startX = Math.floor(this.body.center.x / tileSize);
        const startY = Math.floor(this.body.center.y / tileSize);
        const endX   = Math.floor(this.scene.player.body.center.x / tileSize);
        const endY   = Math.floor(this.scene.player.body.center.y / tileSize);

        // Detección de atasco: si el enemigo no se ha movido más de 4px en 600ms, resetea el path
        this._stuckTimer += dt;
        if (this._stuckTimer >= 600) {
            const moved = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, this._lastPos.x, this._lastPos.y);
            if (moved < 4) {
                this.currentPath = null;
                this.pathfindingCooldown = false;
            }
            this._lastPos = { x: this.body.center.x, y: this.body.center.y };
            this._stuckTimer = 0;
        }

        if (!this.pathfindingCooldown) {
            this.pathfindingCooldown = true;
            this.scene.easystar.findPath(startX, startY, endX, endY, (path) => {
                if (path && path.length > 1) {
                    this.currentPath = path;
                    this.pathIndex = 1;
                } else {
                    this.currentPath = null;
                }
            });
            this.scene.time.delayedCall(400, () => {
                if (this.active) this.pathfindingCooldown = false;
            });
        }

        if (this.currentPath && this.pathIndex < this.currentPath.length) {
            const node = this.currentPath[this.pathIndex];
            const targetX = node.x * tileSize + tileSize / 2;
            const targetY = node.y * tileSize + tileSize / 2;

            // Usar body.center para medir distancia al waypoint (el sprite origin tiene ~43px de offset)
            if (Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, targetX, targetY) < tileSize * 0.6) {
                this.pathIndex++;
            }

            if (this.pathIndex < this.currentPath.length) {
                const next = this.currentPath[this.pathIndex];
                const nextX = next.x * tileSize + tileSize / 2;
                const nextY = next.y * tileSize + tileSize / 2;

                let dx = nextX - this.body.center.x;
                let dy = nextY - this.body.center.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) { dx /= len; dy /= len; }

                // Si hay colisión física en un eje, deslizar por el otro (wall sliding)
                if ((this.body.blocked.left && dx < 0) || (this.body.blocked.right && dx > 0)) dx = 0;
                if ((this.body.blocked.up   && dy < 0) || (this.body.blocked.down  && dy > 0)) dy = 0;

                const newLen = Math.sqrt(dx * dx + dy * dy);
                if (newLen > 0) {
                    this.body.setVelocity(dx / newLen * this.speed, dy / newLen * this.speed);
                } else {
                    // Bloqueado en ambos ejes, forzar recalculo
                    this.currentPath = null;
                    this.pathfindingCooldown = false;
                }
            }
        } else {
            // Fallback: movimiento directo si no hay path disponible
            this.scene.physics.moveToObject(this, this.scene.player, this.speed);
        }

        this.play('enemy_walk', true);
    }

}
