import Phaser from 'phaser';
import Enemy from './enemy.js';
import Pool from './pool.js';
import EnemyFactory from './enemyFactory.js';

export default class Spawner {
    constructor(scene, poolsData, enemyStats) {
        this.scene = scene;

        this.pool = new Pool(this.scene, poolsData, new EnemyFactory(this.scene, enemyStats));

        this.shadowStats = this.scene.cache.json.get('data').shadowBaseStats;
    }

    spawn(x, y) {
        const enemy = this.pool.spawnInactive('shadow');

        if (enemy) {
            enemy.spawn(x, y);
            return enemy;
        }

        return null;
    }

    PhysicsGroup() {
        return this.pool.physicsGroup;
    }

    spawnMultiple(config) {
        for (let i = 1; i <= config.count; i++) {
            this.scene.time.addEvent({
                delay: config.spawnDelay * i,
                callback: () => {
                    const x = Phaser.Math.Between(50, 750);
                    const y = Phaser.Math.Between(50, 550);
                    
                    this.spawn(x, y);
                }
            })
        }
    }
}