import Phaser from 'phaser';
import Enemy from './enemy';

export default class EnemyThief extends Enemy {

    constructor(scene, x, y, stats) {
        super(scene, x, y, 'thief', stats);

        this.attackDamage = stats.attackDamage;
        this.attackRange = stats.attackRange;
        this.attackRadius = stats.attackRadius;
        this.attackCooldown = stats.attackCooldown;
        this.canAttack = stats.canAttack;
        this.hasDamaged = stats.hasDamaged;
        this.is_knockback = stats.is_knockback;

        // Animaciones
        this.scene.anims.create({
            key: 'thief_idle',
            frames: this.anims.generateFrameNames('thief_idle', { prefix: 'idle-', start: 1, end: 5 }),
            frameRate: 5,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'thief_move',
            frames: this.anims.generateFrameNames('thief_move', { prefix: 'move-', start: 1, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'thief_hit',
            frames: this.anims.generateFrameNames('thief_hit', { prefix: 'hit-', start: 1, end: 3 }),
            frameRate: 4,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'thief_die',
            frames: this.anims.generateFrameNames('thief_die', { prefix: 'die-', start: 1, end: 8 }),
            frameRate: 20,
            repeat: 0
        });

        this.on('animationcomplete', (anim) => {
            if (anim.key === 'thief_die') {
                this.setActive(false);
                this.setVisible(false);
                this.body.enable = false;
            }
        });

        this.setScale(1.5);
        this.isDead = false;
        this.body.setSize(16, 16);
        this.body.setOffset(9, 15);
        this.play('thief_idle', true);
        this.is_moving = false;
        this.hasStolen = false;
        this.label = this.scene.add.text(1080, 10, '', { fontSize: 20 });
    }

    spawn(x, y) {
        super.spawn(x, y);
        this.hasStolen = false;
        this.setTexture('thief_move');
    }

    die() {
        super.die();
        this.setTexture('thief_die');
        this.play('thief_die');
    }

    attackOnContact(player) {
        this.attack(player);
    }

    attack(player) {
        if (this.canAttack) {
            if (!this.hasStolen && player.trinket.length > 0) {
                const idx = Math.floor(Math.random() * player.trinket.length);
                player.removeTrinket(player.trinket[idx]);
                this.hasStolen = true;
            }

            player.getDamage(this.attackDamage * this.attackMod);
            this.canAttack = false;
            this.scene.time.delayedCall(this.attackCooldown, () => {
                this.canAttack = true;
            });
        }
    }

    playHit() {
        if (this.life <= 0) return;
        this.play('thief_hit', true);
    }

    preUpdate(t, dt) {
        super.preUpdate(t, dt);

        if (!this.active || this.life <= 0 || this.isDead) return;

        if (this.scene.player.x <= this.x) {
            this.setFlip(true, false);
        } else {
            this.setFlip(false, false);
        }
        if (!this.scene.physics.overlap(this, this.scene.player) && !this.is_knockback) {
            this.move(dt);
        }
        else {//this.body.setVelocity(0);
            this.is_moving = false;
        }
    }


    move(dt) {
        super.move(dt)
        if (this.scene.easystar) {
            this._moveWithPathfinding(dt);
        } else {
            this.scene.physics.moveToObject(this, this.scene.player, this.speed);
            this.play('thief_move', true);
        }
    }

    _moveWithPathfinding(dt) {
        const tileSize = this.scene.pathfinderTileSize;
        const startX = Math.floor(this.body.center.x / tileSize);
        const startY = Math.floor(this.body.center.y / tileSize);
        const endX = Math.floor(this.scene.player.body.center.x / tileSize);
        const endY = Math.floor(this.scene.player.body.center.y / tileSize);

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

        this.play('thief_move', true);
    }
}
