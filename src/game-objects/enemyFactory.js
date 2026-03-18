import Phaser from 'phaser';
import Enemy from './enemy';

export default class EnemyFactory {
    constructor(scene, enemyStats) {
        this.scene = scene;
        this.enemyStats = enemyStats;
        this.factory = {}
    }

    createEnemy(type) {
        return this.factory[type](this.scene, 0, 0, this.enemyStats[type]);
    }
}