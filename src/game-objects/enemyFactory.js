import Phaser from 'phaser';
import EnemyShadow from './enemyShadow';
import EnemyThief from './enemyThief';
import EnemyBeethoven from './enemyBeethoven';

export default class EnemyFactory {
    constructor(scene, enemyStats) {
        this.scene = scene;
        this.enemyStats = enemyStats;
        console.log("enemyStats:", enemyStats);
        this.factory = {
            'shadow':    (stats) => { return new EnemyShadow(this.scene, 0, 0, stats) },
            'thief':     (stats) => { return new EnemyThief(this.scene, 0, 0, stats) },
            'beethoven': (stats) => { return new EnemyBeethoven(this.scene, 0, 0, stats) },
        };
    }

    createElement(type) {
        return this.factory[type](this.enemyStats[type]);
    }
}