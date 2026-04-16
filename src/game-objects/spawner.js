import Phaser from 'phaser';
import Pool from './pool.js';
import EnemyFactory from './enemy-factory.js';

export default class Spawner {
    constructor(scene, poolsData, enemyStats) {
        this.scene = scene;

        this.pool = new Pool(this.scene, poolsData, new EnemyFactory(this.scene, enemyStats));

        this.shadowStats = this.scene.cache.json.get('data').shadowBaseStats;
    }

    spawn(x, y, type, speedMult = 1, cooldownMult = 1) {
        const enemy = this.pool.spawnInactive(type);

        if (enemy) {
            enemy.spawn(x, y);
            if (speedMult !== 1)    enemy.speed *= speedMult;
            if (cooldownMult !== 1 && enemy.attackCooldown != null)
                enemy.attackCooldown *= cooldownMult;
            this._showSpawnEffect(x, y, enemy);
            return enemy;
        }

        return null;
    }

    _showSpawnEffect(x, y, enemy) {
        if (!this.scene.anims.exists('spawn_portal_anim')) {
            this.scene.anims.create({
                key: 'spawn_portal_anim',
                frames: this.scene.anims.generateFrameNumbers('spawn_portal', { start: 0, end: 6 }),
                frameRate: 14,
                repeat: 0
            });
        }

        const sprite = this.scene.add.sprite(x, y + 20, 'spawn_portal');
        sprite.setScale(1);
        sprite.play('spawn_portal_anim');
        this.scene.children.moveBelow(sprite, enemy);
        sprite.once('animationcomplete', () => sprite.destroy());
    }

    PhysicsGroup() {
        return this.pool.physicsGroup;
    }

    spawnMultiple(config, speedMult = 1, cooldownMult = 1) {
        for (let i = 1; i <= config.count; i++) {
            this.scene.time.addEvent({
                delay: config.spawnDelay * i,
                callback: () => {
                    const x = Phaser.Math.Between(50, 750);
                    const y = Phaser.Math.Between(50, 550);
                    this.spawn(x, y, config.type, speedMult, cooldownMult);
                }
            });
        }
    }
}