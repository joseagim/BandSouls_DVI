import Phaser from 'phaser';
import Enemy from './shadowEnemy';

export default class Pool {
    constructor(scene, poolsData, factory) {
        this.scene = scene;
        
        this.factory = factory;
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
        let element;

        if (this.inactive[type].length == 0) {
            element = this.factory.createelement(type);
            this.physicsGroup.add(element);
        } 
        else {
            element = this.inactive[type].pop();
        }
        let sa = [];
        element.spawn();
        this.active[type].push(element);

        return element;
    }

    /*
    * This method receives an element and removes it from the active pool to 
    * insert it in the inactive pool. If the element is not in the active
    * pool this method does nothing
    */
   deactivate(element) {
        let elementidx = this.active[element.tag].findIndex(element);
        this.inactive[element.tag].push(this.active[element.tag].splice(elementidx, 1)[0]);
   }
}
