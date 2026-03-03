import Phaser from 'phaser';

export default class Arma extends Phaser.GameObjects.Sprite {
//ESTO ES UNA CLASE ABSTRACTA COMO BASE PARA CADA ARMA

    /*
    * @param {boolean} attacking: booleano de si está atacando o no
    *@param {number} atk: daño que hace por ataque
    * @param {number} atk_speed: segundos que tarde de ataque en ataque
    * @param {number} hitbox_x: elemento X para hitbox de la arma
    * @param {number} hitbox_y: elemento Y para hitbox de la arma
    */

    constructor(scene, x, y, tag, stats){
        super(scene,x,y, tag);
        this.scene = scene;
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.duration = stats.duration;
        this.enemiesHit = new Set();

        this.scene.physics.add.existing(this);

        // bs escalado extraño para los colliders
        /*
        this.setScale(4);
        this.body.setSize(8, 16);
        this.body.setOffset(45, 42);
        this.hurtbox.body.setCircle(this.attackRadius);
        this.hurtbox.body.setCollideWorldBounds();
        */
    }

    activateWeapon() {
        this.hurtbox.visible = true;
        this.hurtbox.body.enable = true;
        this.hurtbox.active = true;
        this.enemiesHit.clear();
    }

    deactivateWeapon() {
        this.hurtbox.visible = false;
        this.hurtbox.body.enable = false;
        this.hurtbox.active = false;
        this.enemiesHit.clear();
    }

    attack(enemy, attackMod){
        if (this.enemiesHit.has(enemy)) return; 
        enemy.getDamage(this.damage * attackMod);
        this.enemiesHit.add(enemy);
    }

    ability(){
        console.error("ESTAS LLAMANDO A HABILIDAD DE CLASE ABSTRACTA");
    }

    getAtk(){
        return this.atk;
    }

    getAtkSpeed(){
        return this.atk_speed;
    }

    getHitBox_X(){
        return this.hitbox_x;
    }

    getHitBox_Y(){
        return this.hitbox_y;
    }
}