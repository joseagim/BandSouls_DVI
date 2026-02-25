import Phaser from 'phaser';
import Arma from './arma.js'

export default class Guitar extends Phaser.GameObjects.Sprite{
    constructor(scene,x,y,player){
        super(scene,x,y);

        this.player = player;

        this.scene = scene;
        this.hurtbox = this.scene.add.rectangle(0,0,40,100,0xff0000,0);
        this.hurtbox.visible = true;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this.hurtbox, false);
        this.hurtbox.body.enable = false;
        this.attk = 10;
        this.attk_speed = 10000000;

        this.enemigoActual = null;
    }

    preUpdate(t,dt){
        
        //posicionar el vhitbox (la funcion de abajo) : como sabe el juego donde se pinta la hurtbox si no extiende de Phaser.GameObject y no se le pasa ni x ni y????
        this.x = this.player.x;
        this.y = this.player.y;
        this.playerDir = this.player.getDirection();
        this.posicionarHitBox(this.playerDir);

        if(this.attacking){
            this.hurtbox.visible = true;
            this.hurtbox.body.enable = true;

            //this.comprobarGolpe();

            
            if(this.scene.physics.overlap(this.hurtbox,this.enemigoActual)){
                this.hacerDaño(this.enemigoActual);
            }
            

            //Hacer overlap de phaser para si hay varios enemigos (leer documentacion)
            if(!this.attk_timer){
                this.attk_timer = this.scene.time.delayedCall(this.atk_speed, () => {
                    this.hurtbox.active = true; //poner a falase
                    this.hurtbox.visible = true, //poner a falase
                    this.attacking=false,
                    this.hurtbox.body.enable=true, //poner a falase
                    this.attk_timer = null;});
                    
                }
        }
    }

    posicionarHitBox(direction){
        const offset = 50; // Distancia desde el personaje
        
        // Normalizar dirección por si acaso
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length === 0) return;
        
        const normX = direction.x / length;
        const normY = direction.y / length;
        
        // Posicionar el hurtbox
        // La mitad del largo (100/2 = 50) más el offset
        const distance = offset + 50; // 50 (offset) + 50 (mitad del largo)
        
        this.hurtbox.x = this.x + normX * distance;
        this.hurtbox.y = this.y + normY * distance;
        
        // Rotar el hurtbox para que apunte en la dirección del movimiento
        this.hurtbox.rotation = Math.atan2(normY, normX);
        
        console.log("Dirección:", direction, "Rotación:", this.hurtbox.rotation); // Debug
    }

    /*
    comprobarGolpe(){
        if(this.enemigoActual && this.scene.physics.overlap(this.hurtbox,this.enemigoActual)){
            this.hacerDaño(this.enemigoActual);
        }
    }
    */

    hacerDaño(enemigo){
        if(enemigo && enemigo.active){
            enemigo.getDamage(this.attk);
            this.scene.cameras.main.shake(50,0.01);
        }
    }
}