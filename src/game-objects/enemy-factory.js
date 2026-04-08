import Phaser from 'phaser';
import EnemyShadow from './enemies/enemyShadow';
import EnemyThief from './enemies/enemyThief';
import KamikazeEnemy from './enemies/enemyKamikaze';
import EnemyBeethoven from './enemies/bossBeethoven';

export default class EnemyFactory {
    constructor(scene, enemyStats) {
        this.scene = scene;
        this.enemyStats = enemyStats;
        console.log("enemyStats:", enemyStats);
        this.factory = {
            'shadow': (stats) => { return new EnemyShadow(this.scene, 0, 0, stats) },
            'thief': (stats) => { return new EnemyThief(this.scene, 0, 0, stats) },
            'kamikaze': (stats) => { return new KamikazeEnemy(this.scene, 0, 0, stats) },
            'beethoven': (stats) => { return new EnemyBeethoven(this.scene, 0, 0, stats) },
        };
    }

    createElement(type) {
        return this.factory[type](this.enemyStats[type]);
    }
}