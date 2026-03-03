import Phaser from 'phaser';
import Arma from './arma.js'
import Enemy from './enemy.js';

export default class Guitar extends Arma{
    constructor(scene,x,y,player){
        super(scene,x,y, 'guitar',  {   damage      : 10,
                                        cooldown    : 1000,
                                        duration    : 500});

        this.player = player;
        this.visible = false;
        this.scene = scene;
        this.hurtbox = this.scene.add.circle(0,0,20,0xff0000);
        this.hurtbox.visible = true;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this.hurtbox);
        this.deactivateWeapon()
    }

    getHurtboxes() {
        return [this.hurtbox];
    }

    preUpdate(t,dt){
        
        //posicionar el vhitbox (la funcion de abajo) : como sabe el juego donde se pinta la hurtbox si no extiende de Phaser.GameObject y no se le pasa ni x ni y????

        this.x = this.player.x;
        this.y = this.player.y;
        this.playerDir = this.player.getDirection();
        this.posicionarHitBox(this.playerDir);
    }

    posicionarHitBox(direction){
        const offset = -5; // Distancia desde el personaje
        
        // Normalizar dirección por si acaso
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length === 0) return;
        
        const normX = direction.x / length;
        const normY = direction.y / length;
        
        // Posicionar el hurtbox
        // La mitad del largo (100/2 = 50) más el offset
        const distance = offset + 50; 
        
        this.hurtbox.body.reset(this.x + normX * distance, this.y + normY * distance);
        this.hurtbox.x = this.x + normX * distance;
        this.hurtbox.y = this.y + normY * distance;
        
        // Rotar el hurtbox para que apunte en la dirección del movimiento
        this.hurtbox.rotation = Math.atan2(normY, normX);
        
        //console.log("Dirección:", direction, "Rotación:", this.hurtbox.rotation); // Debug
    }

    hacerDaño(enemigo){
        if(enemigo && enemigo.active){
            enemigo.getDamage(this.attk);
            this.scene.cameras.main.shake(50,0.01);
        }
    }
}