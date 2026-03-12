import Phaser from 'phaser';
import Player from '../game-objects/player.js';
import SoundManager from '../game-objects/sound_manager.js';


/**
 * Escena principal del juego. La escena se compone de una serie de plataformas 
 * sobre las que se sitúan las bases en las podrán aparecer las estrellas. 
 * El juego comienza generando aleatoriamente una base sobre la que generar una estrella. 
 * @abstract 
 
 * @extends Phaser.Scene
 */
export default class Shop extends Phaser.Scene {
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
        this.add.rectangle(960, 736, 400, 300, 0xffffff);

        // MEJORA: Añadimos color negro al texto para que contraste y lo centramos
        this.add.text(400, 300, 'Shop', {
            fontSize: '20px',
            color: '#f20808ff'
        }).setOrigin(0.5);
    }

}

