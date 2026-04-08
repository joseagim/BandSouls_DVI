import Phaser from 'phaser';
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
        var tiles = map.addTilesetImage('city_tileset', 'city_tiles');

        var layer_suelo = map.createLayer('suelo', tiles, 0, 0);
        var layer_edif = map.createLayer('edificios', tiles, 0, 0);
        var layer_deco = map.createLayer('decorado', tiles, 0, 0);
        var layer_deco_sin = map.createLayer('decoradoSin', tiles, 0, 0);
        var layer_obj = map.createLayer('objetos', tiles, 0, 0);

        layer_edif.setCollisionByExclusion([-1], true);
        layer_deco.setCollisionByExclusion([-1], true);
        layer_obj.setCollisionByExclusion([-1], true);


        this.bases = this.add.group();

        super.create();

        this.soundManager.play('level1_music');

        this.physics.add.collider(this.player, layer_edif);
        this.physics.add.collider(this.player, layer_deco);
        this.physics.add.collider(this.player, layer_obj);

        this.physics.add.collider(this.spawner.pool, layer_edif);
        this.physics.add.collider(this.spawner.pool, layer_deco);
        this.physics.add.collider(this.spawner.pool, layer_obj);

        // Inicializar pathfinding A* con el grid del tilemap
        const gridWidth = map.width;
        const gridHeight = map.height;
        const grid = [];
        for (let y = 0; y < gridHeight; y++) {
            const row = [];
            for (let x = 0; x < gridWidth; x++) {
                const tileEdif = layer_edif.getTileAt(x, y);
                const tileDeco = layer_deco.getTileAt(x, y);
                const tileObj = layer_obj.getTileAt(x, y);
                const blocked = (tileEdif && tileEdif.collides) ||
                    (tileDeco && tileDeco.collides) ||
                    (tileObj && tileObj.collides);
                row.push(blocked ? 1 : 0);
            }
            grid.push(row);
        }
        this.easystar = new EasyStar.js();
        this.easystar.setGrid(grid);
        this.easystar.setAcceptableTiles([0]);
        this.easystar.enableDiagonals();
        this.easystar.disableCornerCutting();
        this.pathfinderTileSize = map.tileWidth;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;

        // Configurar cámara
        this.cameras.main.setBounds(0, 0, 1280, 720);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Opcional: agregar bordes para visualizar la cámara
        this.cameras.main.setBackgroundColor(0x000000);

        // --- Portal al finalizar oleadas ---
        this.portal = null;
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.portalInteractionRange = 50;

        // Crear la animación por si no estuviese creada en esta escena
        if (!this.anims.exists('portalAnim')) {
            this.anims.create({
                key: 'portalAnim',
                frames: this.anims.generateFrameNames('portal', { prefix: 'Sprite-0001 ', suffix: '.', start: 0, end: 6 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.game.events.on('allWavesComplete', () => {
            // Un poco más arriba del centro del mapa (asumiendo 1280x720 como tamaño)
            const mapCenterX = 1280 / 2;
            const mapCenterY = 736 / 2 - 150;

            this.portal = this.physics.add.sprite(mapCenterX, mapCenterY, 'portal');
            this.portal.play('portalAnim');
        });
    }

    update() {
        if (this.easystar) this.easystar.calculate();

        // Control del portal si ya ha aparecido
        if (this.portal) {
            const distToPortal = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.portal.x, this.portal.y
            );

            if (distToPortal < this.portalInteractionRange && Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
                this.scene.start('shop');
            }
        }
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
