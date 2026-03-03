import Phaser from 'phaser';
import Platform from '../game-objects/platform.js';
import Player from '../game-objects/player.js';
import Enemy from '../game-objects/enemy.js'
import Level from './level.js';
import EasyStar from 'easystarjs';


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

        // Pathfinding
        this.easystar = new EasyStar.js();
        this._setupPathfinding(map, [layer_edif, layer_deco, layer_obj]);
        
        // Configurar cámara
        this.cameras.main.setBounds(0, 0, 1280, 720);
        this.cameras.main.setZoom(3); // Ventana de visualización
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        // Opcional: agregar bordes para visualizar la cámara
        this.cameras.main.setBackgroundColor(0x000000);

    }

    _setupPathfinding(map, collisionLayers) {
    const tileW = map.tileWidth;
    const tileH = map.tileHeight;
    const cols  = map.width;
    const rows  = map.height;

    // Grid base
    const grid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            let blocked = false;
            for (const layer of collisionLayers) {
                const tile = layer.getTileAt(c, r);
                if (tile && tile.collides) { blocked = true; break; }
            }
            row.push(blocked ? 1 : 0);
        }
        grid.push(row);
    }

    // IMPORTANTE: engordar obstáculos 1 tile en todas direcciones
    // para que el enemigo no intente pasar por huecos de 1 tile
    const inflated = grid.map(row => [...row]);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                            inflated[nr][nc] = 1;
                        }
                    }
                }
            }
        }
    }

    this.easystar.setGrid(inflated);
    this.easystar.setAcceptableTiles([0]);
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();

    this.tileW = tileW;
    this.tileH = tileH;
}

     // Método público para que el enemigo pida un camino
    findPath(fromX, fromY, toX, toY, callback) {
        const sc = Math.floor(fromX / this.tileW);
        const sr = Math.floor(fromY / this.tileH);
        const ec = Math.floor(toX   / this.tileW);
        const er = Math.floor(toY   / this.tileH);

        this.easystar.findPath(sc, sr, ec, er, (path) => {
            if (!path) { callback([]); return; }

            // Convertir tiles a coordenadas mundo (centro del tile)
            callback(path.map(p => ({
                x: p.x * this.tileW + this.tileW / 2,
                y: p.y * this.tileH + this.tileH / 2
            })));
        });

        this.easystar.calculate(); // importante: dispara el cálculo
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
