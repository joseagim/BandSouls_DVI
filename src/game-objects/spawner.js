import Phaser from 'phaser';
import Enemy from './enemy.js';

export default class Spawner {
    constructor(scene) {
        this.scene = scene;

        this.pool = this.scene.physics.add.group({
            classType: Enemy,
            maxSize: -1,
            runChildUpdate: true
        })

        this.shadowStats = this.cache.json.get('shadowBaseStats');
    }

    spawn(x, y) {
        const enemy = this.pool.get(x, y);

        if (enemy) {
            enemy.spawn(x, y);
            return enemy;
        }

        return null;
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