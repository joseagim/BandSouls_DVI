import Phaser from 'phaser';
import Arma from './arma.js'
import selectionPick from '../../assets/sprites/title-screen/selection-pick.png'
import Enemy from './enemy.js';

export default class Guitar extends Arma{
    constructor(scene,x,y,player){
        super(scene,x,y, 'selectionPick',  {   damage      : 10,
                                        cooldown    : 1000,
                                        duration    : 500});

        this.player = player;
        this.setScale(-0.35, 0.35);
        this.visible = false;
        this.hurtbox = this.scene.add.circle(0,0,20,0xff0000);
        this.hurtbox.visible = false;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this.hurtbox);
        this.deactivateWeapon()
    }

    getHurtboxes() {
        return [this.hurtbox];
    }

    weaponAttackAnimation() {
        this.scene.tweens.add({
            targets: this,
            rotation: {
                from: this.rotation - 1.5,
                to: this.rotation + 1.5
            },
            duration: this.duration,
            ease: 'Back.easeOut',
        });
    }

    

    preUpdate(t,dt){
        
        //posicionar el vhitbox (la funcion de abajo) : como sabe el juego donde se pinta la hurtbox si no extiende de Phaser.GameObject y no se le pasa ni x ni y????

        this.x = this.player.x;
        this.y = this.player.y;
        this.posicionarHitBox(this.scene.input.activePointer);
    }
}