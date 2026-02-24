import Phaser from 'phaser';
import Arma from './arma.js'

export default class Guitar extends Arma{
    constructor(scene){
        super(scene,false,10,10,16,16);
        this.hurtbox = this.scene.add.rectangle(0,0,50,40,0xff0000,0);
        this.hurtbox.visible = false;
        this.scene.physics.add.existing(this.hurtbox, false);
        this.hurtbox.body.enable = false;

        this.enemigoActual = null;
    }

    attack(playerX,playerY,direction,enemy){
        this.attacking = true;
        console.log("Ataque desde guitarra");
        
        //posicionar el vhitbox (la funcion de abajo) : como sabe el juego donde se pinta la hurtbox si no extiende de Phaser.GameObject y no se le pasa ni x ni y????
        this.posicionarHitBox(playerX,playerY,direction);

        this.hurtbox.visible = true;
        this.hurtbox.body.enable = true;

        this.comprobarGolpe();

        //Hacer overlap de phaser para si hay varios enemigos (leer documentacion)
        this.scene.time.delayedCall(this.atk_speed, () => {this.hurtbox.active = false; this.hurtbox.visible = false, this.attacking=false,this.hurtbox.body.enable=false;});
    }

    posicionarHitBox(playerX,playerY,direction){
        const offset = 50;
        this.hurtbox.x = playerX + direction.x * offset;
        this.hurtbox.y = playerY + direction.y * offset;
    }

    comprobarGolpe(){
        if(this.enemigoActual && this.scene.physics.overlap(this.hurtbox,this.enemigoActual)){
            this.hacerDaño(this.enemigoActual);
        }
    }

    hacerDaño(enemigo){
        enemigo.getDamage(this.getAtk());
        this.scene.cameras.main.shake(50,0.01);
    }
}