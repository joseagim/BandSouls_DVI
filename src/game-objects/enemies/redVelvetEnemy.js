import Phaser from 'phaser'
import Enemy from './enemy'

export default class RedVelvetEnemy extends Enemy {
    constructor(scene, x, y, stats) {
        super(scene, x, y, 'redVelvet', stats);

        // Estadísticas propias del enemigo
        this.rangedAttackDamage = stats.rangedAttackDamage;
        this.meleeAttackDamage = stats.meleeAttackDamage;
        this.rangedAttackRange = stats.rangedAttackRange;
        this.meleeAttackRange = stats.meleeAttackRange;
        this.attackRadius = stats.attackRadius;
        this.rangedAttackCooldown = stats.rangedAttackCooldown;
        this.meleeAttackCooldown = stats.meleeAttackCooldown;
        this.canAttackRanged = stats.canAttackRanged;
        this.canAttackMelee = stats.canAttackMelee;
        this.hasDamaged = stats.hasDamaged;
        this.is_knockback = stats.is_knockback;
        this.isAttacking = false;
        this.thrustHit = false;
        this.states = {
            ATTACKING_RANGED: 0,
            ATTACKING_MELEE: 1,
            FLEEING: 2,
            MOVING: 3
        }
        this.state = this.states.MOVING;
        this.fleeX = 0;
        this.fleeY = 0;

        // Create melee hurtboxes once
        this.stabHurtboxes = [];
        const stabRadius = this.attackRadius * 0.5;
        for (let i = 0; i < 3; i++) {
            const circle = this.scene.add.circle(this.x, this.y, stabRadius, 0xff2244, 0.6);
            this.scene.physics.add.existing(circle);
            circle.body.allowGravity = false;
            circle.body.immovable = true;
            circle.setActive(false).setVisible(false);
            this.stabHurtboxes.push(circle);
            this.scene.physics.add.overlap(circle, this.scene.player, (c, player) => {
                if (this.thrustHit) return;
                this.thrustHit = true;
                player.getDamage(this.meleeAttackDamage * this.attackMod);
            });
        }

        this.scene.anims.create({
            key: 'redVelvet_walk',
            frames: this.anims.generateFrameNames('redVelvet_walk', { prefix: 'redVelvetWalk', start: 1, end: 8 }),
            frameRate: 8,
            repeat: -1
        });

        this.play('redVelvet_walk');

        // Collider scaling
        this.isDead = false;
        this.body.setSize(64, 64);
    }

    die() {
        super.die();
        this.visible = false;
    }

    enableMelee() {
         for (let i = 0; i < 3; i++) {
            this.stabHurtboxes[i].setActive(true).setVisible(true);;
        }
    }

    disableMelee() {
        for (let i = 0; i < 3; i++) {
            this.stabHurtboxes[i].setActive(false).setVisible(false);;
        }
    }

    updateState() {
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);

        if (distanceToPlayer < this.meleeAttackRange && this.canAttackMelee) {
            this.state = this.states.ATTACKING_MELEE;
        } else if (distanceToPlayer < this.rangedAttackRange && this.canAttackRanged) {
            this.state = this.states.ATTACKING_RANGED;
        } else if (!this.canAttackMelee && !this.isAttacking) {
            this.state = this.states.FLEEING;
        } else {
            this.state = this.states.MOVING;
        }
    }

    rangedAttack() {
        if (!this.canAttackRanged) return;
        this.canAttackRanged = false;
        this.isAttacking = true;

        const beamLength = this.rangedAttackRange;
        const beamThickness = 40;
        const warningDuration = 600;
        const beamDuration = 400;
        const circleRadius = 12;
        const numCircles = Math.ceil(beamLength / (circleRadius * 2));

        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);

        const warningGfx = this.scene.add.rectangle(
            this.x + Math.cos(angle) * beamLength / 2,
            this.y + Math.sin(angle) * beamLength / 2,
            beamLength,
            beamThickness,
            0xff2222,
            0.35
        );
        warningGfx.setRotation(angle);
        warningGfx.setDepth(5);

        this.scene.tweens.add({
            targets: warningGfx,
            alpha: { from: 0.15, to: 0.55 },
            duration: 180,
            yoyo: true,
            repeat: Math.floor(warningDuration / 360)
        });

        this.scene.time.delayedCall(warningDuration, () => {
            warningGfx.destroy();
            if (!this.active) return;

            const fireAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);

            const beamGfx = this.scene.add.rectangle(
                this.x + Math.cos(fireAngle) * beamLength / 2,
                this.y + Math.sin(fireAngle) * beamLength / 2,
                beamLength,
                beamThickness,
                0xff4444,
                0.9
            );
            beamGfx.setRotation(fireAngle);
            beamGfx.setDepth(5);

            let beamHit = false;
            const beamHurtboxes = [];
            for (let i = 0; i < numCircles; i++) {
                const offset = (i + 0.5) * (beamLength / numCircles);
                const spawnX = this.x + Math.cos(fireAngle) * offset;
                const spawnY = this.y + Math.sin(fireAngle) * offset;

                const circle = this.scene.add.circle(spawnX, spawnY, circleRadius, 0xff4444, 0);
                this.scene.physics.add.existing(circle);
                circle.body.allowGravity = false;
                circle.body.immovable = true;
                beamHurtboxes.push(circle);

                this.scene.physics.add.overlap(circle, this.scene.player, (c, player) => {
                    if (beamHit) return;
                    beamHit = true;
                    player.getDamage(this.rangedAttackDamage * this.attackMod);
                });
            }

            this.scene.time.delayedCall(beamDuration, () => {
                beamGfx.destroy();
                beamHurtboxes.forEach(c => c.destroy());
                this.isAttacking = false;
            });

            this.scene.time.delayedCall(this.rangedAttackCooldown, () => {
                this.canAttackRanged = true;
            });
        });
    }

    meleeAttack() {
        if (!this.canAttackMelee) return;

        this.isAttacking = true;
        this.canAttackMelee = false;

        const stabRadius = this.attackRadius * 0.5;
        const bladeLength = stabRadius * 2.2;
        const thrusts = 3;
        const thrustDelay = 180;
        const stabDuration = 100;
        const dashSpeed = 420;
        const dashDuration = 100;

        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);

        this.enableMelee();
        for (let t = 0; t < thrusts; t++) {
            this.scene.time.delayedCall(thrustDelay * t, () => {
                if (!this.active) return;

                this.thrustHit = false;

                this.body.setVelocity(
                    Math.cos(baseAngle) * dashSpeed,
                    Math.sin(baseAngle) * dashSpeed
                );

                this.scene.time.delayedCall(dashDuration, () => {
                    if (this.active) this.body.setVelocity(0);
                });

                this.stabHurtboxes.forEach((circle, i) => {
                    const offset = bladeLength * (i + 1);
                    const spawnX = this.x + Math.cos(baseAngle) * offset;
                    const spawnY = this.y + Math.sin(baseAngle) * offset;

                    circle.setPosition(spawnX, spawnY);
                    circle.setActive(true).setVisible(true);
                    circle.body.reset(spawnX, spawnY);

                });

                this.scene.time.delayedCall(stabDuration, () => {
                    this.stabHurtboxes.forEach(c => c.setActive(false).setVisible(false));
                });
            });
        }

        this.scene.time.delayedCall(thrustDelay * thrusts, () => {
            this.isAttacking = false;
            this.disableMelee();
        });

        this.scene.time.delayedCall(this.meleeAttackCooldown, () => {
            this.canAttackMelee = true;
            this.hasDamaged = false;
        });
    }

    flee(dt) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.fleeX, this.fleeY);
        if (dist < 10) {
            this.body.setVelocity(0);
            return;
        }
        this.scene.physics.moveTo(this, this.fleeX, this.fleeY, this.speed);
    }

    preUpdate(t, dt) {
        super.preUpdate(t, dt);

        if (!this.active || this.life <= 0 || this.isDead || this.isAttacking) return;

        if (this.scene.player.x <= this.x) this.setFlip(true, false);

        this.updateState();

        if (!this.is_knockback && this.state !== this.states.MOVING) this.body.setVelocity(0);

        if (this.state === this.states.ATTACKING_RANGED) this.rangedAttack();
        else if (this.state === this.states.ATTACKING_MELEE) this.meleeAttack();
        else if (this.state === this.states.FLEEING && !this.is_knockback) this.flee(dt);
        else if (!this.scene.physics.overlap(this, this.scene.player) && !this.is_knockback) this.move(dt);
    }

    move(dt) {
        if (this.scene.easystar) this._moveWithPathfinding(dt);
        else {
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
                } else this.currentPath = null;
            });
            this.scene.time.delayedCall(400, () => { if (this.active) this.pathfindingCooldown = false; });
        }

        if (this.currentPath && this.pathIndex < this.currentPath.length) {
            const node = this.currentPath[this.pathIndex];
            const targetX = node.x * tileSize + tileSize / 2;
            const targetY = node.y * tileSize + tileSize / 2;

            if (Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, targetX, targetY) < tileSize * 0.6) this.pathIndex++;

            if (this.pathIndex < this.currentPath.length) {
                const next = this.currentPath[this.pathIndex];
                let dx = next.x * tileSize + tileSize / 2 - this.body.center.x;
                let dy = next.y * tileSize + tileSize / 2 - this.body.center.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) { dx /= len; dy /= len; }

                if ((this.body.blocked.left && dx < 0) || (this.body.blocked.right && dx > 0)) dx = 0;
                if ((this.body.blocked.up && dy < 0) || (this.body.blocked.down && dy > 0)) dy = 0;

                const newLen = Math.sqrt(dx * dx + dy * dy);
                if (newLen > 0) this.body.setVelocity(dx / newLen * this.speed, dy / newLen * this.speed);
                else {
                    this.currentPath = null;
                    this.pathfindingCooldown = false;
                }
            }
        } else this.scene.physics.moveToObject(this, this.scene.player, this.speed);
    }
}