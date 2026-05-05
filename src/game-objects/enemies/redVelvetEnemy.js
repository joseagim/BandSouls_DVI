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
                player.getDamage(this.meleeAttackDamage, this.x, this.y);
            });
        }
        this.meleeSprite = this.scene.add.image(this.x, this.y, 'velvetMelee');
        this.meleeSprite.setDepth(6);
        this.meleeSprite.setVisible(false);

        this.scene.anims.create({
            key: 'redVelvet_walk',
            frames: this.anims.generateFrameNames('redVelvet_walk', { prefix: 'redVelvetWalk', start: 1, end: 8 }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'redVelvet_hit',
            frames: this.anims.generateFrameNames('redVelvet_hit', { prefix: 'hit ', start: 1, end: 4}),
            frameRate: 8,
            repeat: 0
        });

        this.scene.anims.create({
            key: 'redVelvet_die',
            frames: this.anims.generateFrameNames('redVelvet_die',{ prefix: 'die ', start: 1, end: 14 } ),
            frameRate: 20,
            repeat : 0
        })

        this.on('animationcomplete', (anim) =>{
            if(anim.key =='redVelvet_die'){
                this.setActive(false);
                this.setVisible(false);
                this.body.enable = false;
            }
        })

        // Collider scaling
        this.isDead = false;
        this.body.setSize(64, 64);
    }

    spawn(x, y) {
        super.spawn(x, y);
        this.setTexture('redVelvet_walk');
    }

    die() {
        super.die();
        this.setTexture('redVelvetDie');
        this.play('redVelvet_die');
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

            const beamSprite = this.scene.add.sprite(
                this.x,
                this.y,
                'velvetBeam'
            );

            beamSprite.setOrigin(0, 0.5); // start from enemy position
            beamSprite.setRotation(fireAngle);
            beamSprite.setDepth(5);

            // Scale to match your logical beam size
            const textureWidth = beamSprite.width;
            const textureHeight = beamSprite.height;

            beamSprite.setDisplaySize(beamLength, beamThickness * 2);

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
                    player.getDamage(this.rangedAttackDamage, this.x, this.y);
                });
            }

            this.scene.time.delayedCall(beamDuration, () => {
                beamSprite.destroy();
                beamHurtboxes.forEach(c => c.destroy());
                this.isAttacking = false;
            });

            this.scene.time.delayedCall(this.rangedAttackCooldown, () => {
                this.canAttackRanged = true;
            });
        });
    }

    playHit() {
        if (this.life <= 0) return;
        this.setTexture('redVelvet_hit');
        this.play('redVelvet_hit', true);
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

                const midOffset = bladeLength * 2; // center of the 3 hitboxes

                const centerX = this.x + Math.cos(baseAngle) * midOffset;
                const centerY = this.y + Math.sin(baseAngle) * midOffset;

                // Position the big slash sprite
                this.meleeSprite.setScale(0.8, 1);

                this.scene.tweens.add({
                    targets: this.meleeSprite,
                    scaleX: 1,
                    duration: stabDuration,
                    ease: 'Quad.out'
                });
                this.meleeSprite.setPosition(centerX, centerY);
                this.meleeSprite.setRotation(baseAngle);
                this.meleeSprite.setDisplaySize(bladeLength * 3, stabRadius * 2); // spans all 3 hitboxes
                this.meleeSprite.setVisible(true);

                this.scene.time.delayedCall(stabDuration, () => {
                    this.stabHurtboxes.forEach(c => c.setActive(false).setVisible(false));
                    this.meleeSprite.setVisible(false);
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
        super.move(dt);
        if (this.scene.easystar) this._moveWithPathfinding(dt);
        else {
            this.scene.physics.moveToObject(this, this.scene.player, this.speed);
            this.play('redVelvet_walk', true);
        }
    }

    _moveWithPathfinding(dt) {
        const tileSize = this.scene.pathfinderTileSize;
        const maxX = this.scene.gridWidth - 1;
        const maxY = this.scene.gridHeight - 1;
        const startX = Phaser.Math.Clamp(Math.floor(this.body.center.x / tileSize), 0, maxX);
        const startY = Phaser.Math.Clamp(Math.floor(this.body.center.y / tileSize), 0, maxY);
        const endX = Phaser.Math.Clamp(Math.floor(this.scene.player.body.center.x / tileSize), 0, maxX);
        const endY = Phaser.Math.Clamp(Math.floor(this.scene.player.body.center.y / tileSize), 0, maxY);

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

        this.play('redVelvet_walk', true);
    }
}