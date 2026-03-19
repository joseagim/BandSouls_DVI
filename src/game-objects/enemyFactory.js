import Phaser from 'phaser';
import ShadowEnemy from './shadowEnemy';
import RedVelvetEnemy from './redVelvetEnemy';

export default class EnemyFactory {
    constructor(scene, enemyStats) {
        this.scene = scene;
        this.enemyStats = enemyStats;
        console.log("enemyStats:", enemyStats);
        this.factory = {
            'shadow': (stats) => {return new ShadowEnemy(this.scene, 0, 0, stats)},
            'redVelvet': (stats) => {return new RedVelvetEnemy(this.scene, 0, 0, stats)},
        };
    }

    createElement(type) {
        return this.factory[type](this.enemyStats[type]);
    }
}