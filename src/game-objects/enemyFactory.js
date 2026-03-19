import Phaser from 'phaser';
import Enemy from './shadowEnemy';

export default class EnemyFactory {
    constructor(scene, enemyStats) {
        this.scene = scene;
        this.enemyStats = enemyStats;
        this.factory = {'shadow': (scene, stats) => {new Enemy(scene, 0, 0, stats)}}
    }

    createEnemy(type) {
        return this.factory[type](this.scene, this.enemyStats[type]);
    }
}