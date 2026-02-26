import Phaser from 'phaser';
import Platform from '../game-objects/platform.js';
import Player from '../game-objects/player.js';
import Enemy from '../game-objects/enemy.js';
import actor from  '../game-objects/actor.js';
import Level from './level.js';


/**
 * Escena principal del juego. La escena se compone de una serie de plataformas 
 * sobre las que se sitúan las bases en las podrán aparecer las estrellas. 
 * El juego comienza generando aleatoriamente una base sobre la que generar una estrella. 
 * @abstract Cada vez que el jugador recoge la estrella, aparece una nueva en otra base.
 * El juego termina cuando el jugador ha recogido 10 estrellas.
 * @extends Phaser.Scene
 */
export default class Level_Ciudad extends Level {
    /**
     * Constructor de la escena
     */
    constructor() {
        super('level_ciudad');
    }

    /**
     * Creación de los elementos de la escena principal de juego
     */
    create() {
        //this.stars = 10;
        this.bases = this.add.group();

        super.create();

        new Platform(this, this.player,this.enemy, this.bases, 150, 350);
        new Platform(this, this.player,this.enemy, this.bases, 850, 350);
        new Platform(this, this.player,this.enemy, this.bases, 500, 200);
        new Platform(this, this.player,this.enemy, this.bases, 150, 100);
        new Platform(this, this.player,this.enemy, this.bases, 850, 100);

    }
}
