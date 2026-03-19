import Phaser from 'phaser';
import Enemy from './shadowEnemy';

export default class EnemyFactory {
    constructor(scene, enemyStats) {
        this.scene = scene;
        this.enemyStats = enemyStats;
        console.log("enemyStats:", enemyStats);
        this.factory = {
            'shadow': (stats) => {return new Enemy(this.scene, 0, 0, stats)}
        };
    }

    createElement(type) {
        return this.factory[type](this.enemyStats[type]);
    }
}