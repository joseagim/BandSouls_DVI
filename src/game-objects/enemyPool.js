import Phaser from 'phaser';
import Enemy from './enemy';

export default class EnemyPool {
    constructor(scene, poolsData, enemyFactory) {
        this.scene = scene;
        
        this.enemyFactory = enemyFactory;
        this.physicsGroup = this.scene.physics.add.group(
        {
            classType: Enemy,
            runChildUpdate: true
        })

        this.active = {};
        this.inactive = {};
        // we need to deepcopy to avoid shared references, ask me how I know
        for (const type in poolsData) {
            this.active[type] = [];
            this.inactive[type] = [];
        }

        //todo -> create the factory
    }

    /* 
    * This method returns the first available inactive element in the pool
    * or, in case there are none, creates one and returns it
    */
    spawnInactive(type) {
        let enemy;

        if (this.inactive[type].length == 0) {
            enemy = this.enemyFactory.createEnemy(type);
            this.physicsGroup.add(enemy);
        } 
        else {
            enemy = this.inactive[type].pop();
        }

        enemy.spawn();
        this.active[type].push(enemy);

        return enemy;
    }
}
