import Phaser from 'phaser';
import Platform from '../game-objects/platform.js';
import Player from '../game-objects/player.js';
import Enemy from '../game-objects/enemy.js'
import Level from './level.js';


/**
 * Escena principal del juego. La escena se compone de una serie de plataformas 
 * sobre las que se sitúan las bases en las podrán aparecer las estrellas. 
 * El juego comienza generando aleatoriamente una base sobre la que generar una estrella. 
 * @abstract Cada vez que el jugador recoge la estrella, aparece una nueva en otra base.
 * El juego termina cuando el jugador ha recogido 10 estrellas.
 * @extends Phaser.Scene
 */
export default class Level_Fondo extends Level {
    /**
     * Constructor de la escena
     */
    constructor() {
        super('level_fondo');
    }

    /**
     * Creación de los elementos de la escena principal de juego
     */
    create() {
        //this.stars = 10;
        var map = this.make.tilemap({ key: 'map' });
        var tiles = map.addTilesetImage('tileset-ciudad','city_tiles');
        var layer_suelo = map.createLayer('suelo',tiles,0,0);
        var layer_edif = map.createLayer('edificios',tiles,0,0);
        var layer_deco = map.createLayer('decorado',tiles,0,0);
        var layer_obj = map.createLayer('objetos',tiles,0,0);
        layer_edif.setCollisionByExclusion([-1],true);
        layer_deco.setCollisionByExclusion([-1],true);
        layer_obj.setCollisionByExclusion([-1],true);
        
        
        this.bases = this.add.group();
        
        super.create();
        
        // Configurar cámara
        this.cameras.main.setBounds(0, 0, 1280, 720);
        this.cameras.main.setZoom(3); // Ventana de visualización
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        // Opcional: agregar bordes para visualizar la cámara
        this.cameras.main.setBackgroundColor(0x000000);



    }

    /**
     * Genera una estrella en una de las bases del escenario
     * @param {Array<Base>} from Lista de bases sobre las que se puede crear una estrella
     * Si es null, entonces se crea aleatoriamente sobre cualquiera de las bases existentes
     */

    /**
     * Método que se ejecuta al coger una estrella. Se pasa la base
     * sobre la que estaba la estrella cogida para evitar repeticiones
     * @param {Base} base La base sobre la que estaba la estrella que se ha cogido
     */

    /*
    starPickt(base) {
        this.player.point();
        if (this.player.score == this.stars) {
            this.scene.start('end');
        }
        else {
            let s = this.bases.children.entries;
            this.spawn(s.filter(o => o !== base));

        }
    }
        */
}
