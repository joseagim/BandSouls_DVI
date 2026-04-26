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
        super(scene, x, y, 'kamikaze', stats);

        // Estadísticas propias del enemigo
        this.attackDamage = stats.attackDamage;
        this.attackRange = stats.attackRange;
        this.attackRadius = stats.attackRadius;
        this.attackCooldown = stats.attackCooldown;
        this.canAttack = stats.canAttack;
        this.hasDamaged = stats.hasDamaged;
        this.is_knockback = stats.is_knockback;
        this.life = 1; // Vida muy baja para que muera al primer golpe

        // bs escalado extraño para los colliders
        this.setScale(1.5);
        this.isDead = false;
        this.exploded = false;
        this._explodedEnemies = new Set();
        this.body.setSize(32, 32);  // Aumentar el collider para mejor detección de contacto
        this.body.setOffset(4, 7.5);
        this.is_moving = false;
        this.label = this.scene.add.text(1080, 10, "", { fontSize: 20 });

        this.scene.anims.create({
            key: 'kamikaze_walk',
            frames: this.anims.generateFrameNames('kamikaze_walk', { prefix: 'kamikaze_walk-', start: 1, end: 4 }),
            frameRate: 5,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'kamikaze_die',
            frames: this.anims.generateFrameNames('kamikaze_die', { prefix: 'kamikaze_die-', start: 1, end: 10 }),
            frameRate: 60,  // Más rápido para que la explosión sea casi inmediata
            repeat: 0
        });
    }

    spawn(x, y) {
        super.spawn(x, y);
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.canAttack = false;
        this.body.setVelocity(0, 0);
        this.body.enable = false;
        this.explode();
        this.scene.soundManager.stop('fuse_kamikaze');
        this.scene.soundManager.stop('movement');
        // No llamar super.die() para evitar knockback
    }

    attack(player) {
        if (this.isDead || this.exploded) return;
        if (this.canAttack) {
            player.getDamage(this.attackDamage * this.attackMod);
            this.die();
        }
    }

    attackOnContact(player) {
        // El kamikaze maneja su ataque de manera personalizada en preUpdate
        // No usar el attackOnContact del padre para evitar daño duplicado
    }

    preUpdate(t, dt) {
        super.preUpdate(t, dt);

        if (!this.active || this.life <= 0 || this.isDead) return;

        if (this.scene.player.x <= this.x) {
            this.setFlip(true, false);
        } else {
            this.setFlip(false, false);
        }

        if (this.is_knockback) return;

        const dist = Phaser.Math.Distance.Between(
            this.body.center.x, this.body.center.y,
            this.scene.player.body.center.x, this.scene.player.body.center.y
        );
        const contactThreshold = (this.body.width + this.scene.player.body.width) / 2;

        if (dist <= contactThreshold) {
            this.is_moving = false;
            this.body.setVelocity(0, 0);
            this.attack(this.scene.player);
        } else {
            this.move(dt);
        }
    }


    move(dt) {
        super.move(dt)
        if (this.scene.easystar) {
            this._moveWithPathfinding(dt);
        } else {
            this.scene.physics.moveToObject(this, this.scene.player, this.speed);
            this.play('kamikaze_walk', true);
        }
        if (!this.is_moving) {
            this.is_moving = true;
            this.scene.soundManager.play('fuse_kamikaze', { volume: 0.5 });
            this.scene.soundManager.play('movement', { volume: 0.5 });
        }

    }

    _moveWithPathfinding(dt) {
        const tileSize = this.scene.pathfinderTileSize;
        const startX = Math.floor(this.body.center.x / tileSize);
        const startY = Math.floor(this.body.center.y / tileSize);
        const endX = Math.floor(this.scene.player.body.center.x / tileSize);
        const endY = Math.floor(this.scene.player.body.center.y / tileSize);

        // Clamp coordinates to grid bounds
        const clampedStartX = Phaser.Math.Clamp(startX, 0, this.scene.gridWidth - 1);
        const clampedStartY = Phaser.Math.Clamp(startY, 0, this.scene.gridHeight - 1);
        const clampedEndX = Phaser.Math.Clamp(endX, 0, this.scene.gridWidth - 1);
        const clampedEndY = Phaser.Math.Clamp(endY, 0, this.scene.gridHeight - 1);

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
            this.scene.easystar.findPath(clampedStartX, clampedStartY, clampedEndX, clampedEndY, (path) => {
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

                if ((this.body.blocked.left && dx < 0) || (this.body.blocked.right && dx > 0)) dx = 0;
                if ((this.body.blocked.up && dy < 0) || (this.body.blocked.down && dy > 0)) dy = 0;

                const newLen = Math.sqrt(dx * dx + dy * dy);
                if (newLen > 0) {
                    this.body.setVelocity(dx / newLen * this.speed, dy / newLen * this.speed);
                } else {
                    this.currentPath = null;
                    this.pathfindingCooldown = false;
                }
            }
        } else {
            this.scene.physics.moveToObject(this, this.scene.player, this.speed);
        }

        this.play('kamikaze_walk', true);
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;
        this._explodedEnemies.clear();

        // Detener cualquier movimiento y colisiones
        this.body.setVelocity(0, 0);
        this.body.enable = false;
        this.canAttack = false;
        this.scene.enemyDies(this);
        this.scene.soundManager.play('explosion_kamikaze');

        // Reproducir animación de explosión rápida y ocultar al terminar
        this.play('kamikaze_die').on('animationcomplete', () => {
            this.setActive(false);
            this.setVisible(false);
        });

        const allEnemies = this.scene.spawner.pool.physicsGroup.getChildren();
        const explosionDamage = this.attackDamage * 3;

        allEnemies.forEach(enemy => {
            if (enemy === this) return;
            if (this._explodedEnemies.has(enemy)) return;

            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                enemy.x, enemy.y
            );

            if (distance <= this.attackRadius) {
                enemy.getDamage(explosionDamage);
                this._explodedEnemies.add(enemy);
            }
        });
    }
}
