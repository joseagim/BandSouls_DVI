import Phaser from 'phaser';
import Arma from './arma.js'

export default class Guitar extends Arma{
    constructor(scene){
        //ataque = 10
        //velocidad ataque = 10
        //hitbox_x = 16
        //hitbox_y = 16
        super(scene,false,10,10,16,16);
        this.hurtbox = this.scene.add.rectangle(0,0,50,40,0xff0000,0);
        this.hurtbox.visible = false;
        this.scene.physics.add.existing(this.hurtbox, false);
        this.hurtbox.body.enable = false;
    }

    attack(playerX,playerY,direction,enemy){
        this.attacking = true;
        console.log("Ataque desde guitarra");
        
        //posicionar el vhitbox (la funcion de abajo) : como sabe el juego donde se pinta la hurtbox si no extiende de Phaser.GameObject y no se le pasa ni x ni y????

        this.hurtbox.visible = true;
        this.hurtbox.body.enable = true;

        //Hacer overlap de phaser para si hay varios enemigos (leer documentacion)
        this.scene.time.delayedCall(this.atk_speed, () => {this.hurtbox.active = false; this.hurtbox.setVisible(false), this.attacking=false;});
    }

    posicionarHitBox(playX,playerY,direction){
        const offset = 50;
        this.hurtbox.x = playerX + direction.x * offset;
        this.hurtbox.y = playerY + direction.y * offset;
    }
}