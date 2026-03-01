import Phaser from 'phaser';
import Platform from '../game-objects/platform.js';
import Player from '../game-objects/player.js';
import Enemy from '../game-objects/enemy.js';
import actor from  '../game-objects/actor.js';


/**
 * Escena principal del juego. La escena se compone de una serie de plataformas 
 * sobre las que se sitúan las bases en las podrán aparecer las estrellas. 
 * El juego comienza generando aleatoriamente una base sobre la que generar una estrella. 
 * @abstract Cada vez que el jugador recoge la estrella, aparece una nueva en otra base.
 * El juego termina cuando el jugador ha recogido 10 estrellas.
 * @extends Phaser.Scene
 */
export default class Level extends Phaser.Scene {
    /**
     * Constructor de la escena
     */
    constructor(key_nombre) {
        super({ key: key_nombre });
    }

    /**
     * Creación de los elementos de la escena principal de juego
     */
    create() {
        //this.stars = 10;
        this.bases = this.add.group();
        this.player = new Player(this, 400, 400);
        this.enemyGroup = this.physics.add.group({
            classType : actor,
            active : true,
            maxSize : -1
        });
        let enemy1 = new Enemy(this,450,400);
        this.enemyGroup.add(new Enemy(this, 450, 450));
        this.enemyGroup.add(enemy1);

        this.physics.add.overlap(this.player,this.enemyGroup,function(player,enemy){
            enemy.attack(player);
        },null,this);
    }

    setWeaponCollision(weapon) {
        for (let hurtbox in weapon.getHurtboxes()) {
            this.physics.add.overlap(hurtbox, this.enemyGroup, (hurtbox, enemy) => {
                this.player.attack(enemy);
            }, null, this);
        }
    }
}
