import Phaser from 'phaser';
import ShadowEnemy from './shadowEnemy';

export default class Pool {
    constructor(scene, poolsData, factory) {
        this.scene = scene;
        
        this.factory = factory;
        this.physicsGroup = this.scene.physics.add.group( {runChildUpdate: true })

        this.active = {};
        this.inactive = {};
        // we need to deepcopy to avoid shared references, ask me how I know
        for (const entry of poolsData) {
            const type = Object.keys(entry)[0];

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
        if (!Object.hasOwn(this.inactive, type)) return;

        let element;

        if (this.inactive[type].length == 0) {
            element = this.factory.createElement(type);
            this.physicsGroup.add(element);
        } 
        else {
            element = this.inactive[type].pop();
        }
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
        let elementidx = this.active[element.tag].findIndex(e => e === element);
        if (elementidx == -1) return;
        this.inactive[element.tag].push(this.active[element.tag].splice(elementidx, 1)[0]);
   }
}
