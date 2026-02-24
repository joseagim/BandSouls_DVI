import Phaser from 'phaser';

export default class Arma{
//ESTO ES UNA CLASE ABSTRACTA COMO BASE PARA CADA ARMA

    /*
    * @param {boolean} attacking: booleano de si está atacando o no
    *@param {number} atk: daño que hace por ataque
    * @param {number} atk_speed: segundos que tarde de ataque en ataque
    * @param {number} hitbox_x: elemento X para hitbox de la arma
    * @param {number} hitbox_y: elemento Y para hitbox de la arma
    */

    contructor(scene,attacking,atk,atk_speed){
        this.scene = scene;
        this.attacking = attacking;
        this.atk = atk;
        this.atk_speed = atk_speed;

        // bs escalado extraño para los colliders
        /*
        this.setScale(4);
        this.body.setSize(8, 16);
        this.body.setOffset(45, 42);
        this.hurtbox.body.setCircle(this.attackRadius);
        this.hurtbox.body.setCollideWorldBounds();
        */
    }

    attack(){
        console.error("ESTAS LLAMANDO A ATAQUE DE CLASE ABSTRACTA");
        
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