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
        var tiles = map.addTilesetImage('Modern_Exteriors_Complete_Tileset_32x32', 'city_tiles');

        var layer_suelo = map.createLayer('suelo', tiles, 0, 0);
        var layer_deco = map.createLayer('decoraciones', tiles, 0, 0);
        var layer_deco2 = map.createLayer('decoraciones2', tiles, 0, 0);
        var layer_colisiones = map.createLayer('colisiones', tiles, 0, 0);
        
        

        layer_colisiones.setCollisionByExclusion([-1], true);
        layer_deco2.setDepth(200);

        this.bases = this.add.group();

        super.create();

        this.soundManager.play('level1_music');

        this.physics.add.collider(this.player, layer_colisiones);
      //  this.physics.add.collider(this.player, layer_objetos);

        this.physics.add.collider(this.spawner.PhysicsGroup(), layer_colisiones);
        //this.physics.add.collider(this.spawner.pool, layer_objetos);

        // Inicializar pathfinding A* con el grid del tilemap
        const gridWidth = map.width;
        const gridHeight = map.height;
        this.bounds = {
            x : 0,
            y : 0,
            right : gridWidth * map.tileWidth,
            bottom : gridHeight * map.tileHeight
        }
        this.physics.world.setBounds(0, 0, this.bounds.right, this.bounds.bottom);
        const grid = [];
        for (let y = 0; y < gridHeight; y++) {
            const row = [];
            for (let x = 0; x < gridWidth; x++) {
                const tileEdif = layer_colisiones.getTileAt(x, y);
                //const tileObj = layer_objetos.getTileAt(x, y);
                const blocked = (tileEdif && tileEdif.collides); // || (tileObj && tileObj.collides);
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
        this.portalInteractionRange = 80;
        this._portalEnterTimer = null;
        this._portalBlinkTween = null;

        // Crear la animación por si no estuviese creada en esta escena
        if (!this.anims.exists('portalAnim')) {
            this.anims.create({
                key: 'portalAnim',
                frames: this.anims.generateFrameNames('portal', { prefix: 'Sprite-0001 ', suffix: '.', start: 0, end: 6 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.game.events.on('shopTime', () => this._spawnShopPortal());

        this.game.events.on('nextWave', () => {
            if (this.portal) {
                this.portal.destroy();
                this.portal = null;
            }
            if (this._portalEnterTimer) {
                this._portalEnterTimer.remove();
                this._portalEnterTimer = null;
            }
            this._stopPortalBlink();
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

            if (distToPortal < this.portalInteractionRange) {
                if (!this._portalEnterTimer) {
                    this._portalEnterTimer = this.time.delayedCall(3000, () => {
                        this._stopPortalBlink();
                        this.registry.set('savedWave', this.waveManager.currentWave);
                        this.scene.start('shop');
                    });
                    this._startPortalBlink();
                }
            } else {
                if (this._portalEnterTimer) {
                    this._portalEnterTimer.remove();
                    this._portalEnterTimer = null;
                    this._stopPortalBlink();
                }
            }
        }
    }

    getStartingWave() {
        const saved = this.registry.get('savedWave');
        if (saved != null) {
            this.registry.remove('savedWave');
            return saved;
        }
        return 0;
    }

    _spawnShopPortal() {
        if (this.portal) return; // evita doble spawn
        const mapCenterX = 1280 / 2;
        const mapCenterY = 736 / 2 - 150;
        this.portal = this.physics.add.sprite(mapCenterX, mapCenterY, 'portal');
        this.portal.play('portalAnim');
        this.portal.setScale(2);
    }

    _startPortalBlink() {
        this._portalBlinkTween = this.tweens.add({
            targets: this.player,
            alpha: 0.15,
            duration: 250,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    _stopPortalBlink() {
        if (this._portalBlinkTween) {
            this._portalBlinkTween.stop();
            this._portalBlinkTween = null;
            this.player.setAlpha(1);
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
