import Phaser from 'phaser';
import Platform from '../game-objects/platform.js';
import Player from '../game-objects/player.js';
import Enemy from '../game-objects/enemies/enemy.js'
import Level from './level.js';
import EasyStar from 'easystarjs';
import JukeboxMachine from '../game-objects/machines/jukeboxMachine.js';


/**
 * Escena principal del juego. La escena se compone de una serie de plataformas 
 * sobre las que se sitúan las bases en las podrán aparecer las estrellas. 
 * El juego comienza generando aleatoriamente una base sobre la que generar una estrella. 
 * @abstract Cada vez que el jugador recoge la estrella, aparece una nueva en otra base.
 * El juego termina cuando el jugador ha recogido 10 estrellas.
 * @extends Phaser.Scene
 */
export default class Level2 extends Level {
    /**
     * Constructor de la escena
     */
    constructor() {
        super('level_2');
    }

    /**
     * Creación de los elementos de la escena principal de juego
     */
    create() {
        //this.stars = 10;
        var map = this.make.tilemap({ key: 'bosque_map' });
        var tiles = map.addTilesetImage('Modern_Exteriors_Complete_Tileset_32x32', 'city_tiles');

        var layer_suelo = map.createLayer('suelo', tiles, 0, 0);
        var layer_deco = map.createLayer('decoraciones', tiles, 0, 0);
        var layer_sup = map.createLayer('superior', tiles, 0, 0);
        var layer_objetos = map.createLayer('colisiones', tiles, 0, 0);
        
        layer_objetos.setCollisionByExclusion([-1],true);

        
        this.bases = this.add.group();
        
        super.create();

        this.soundManager.play('level1_music');

        this.player.setDepth(1);

        // Spawn manual de kamikaze para probar
        layer_sup.setDepth(200);

                
        this.physics.add.collider(this.player,layer_objetos);

        this.physics.add.collider(this.spawner.PhysicsGroup(),layer_objetos);

        // Inicializar pathfinding A* con el grid del tilemap
        const gridWidth = map.width;
        const gridHeight = map.height;
        const grid = [];
        for (let y = 0; y < gridHeight; y++) {
            const row = [];
            for (let x = 0; x < gridWidth; x++) {
                const tileObj  = layer_objetos.getTileAt(x, y);
                const blocked =(tileObj  && tileObj.collides);
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

        const mapPixelWidth = gridWidth * map.tileWidth;
        const mapPixelHeight = gridHeight * map.tileHeight;
        this.physics.world.setBounds(0, 0, mapPixelWidth, mapPixelHeight);

        // Jukebox upgrade machine — position TBD
        this.jukeboxMachine = new JukeboxMachine(this, 1070, 70);
        this.jukeboxMachine.addCollider(this.player);
        this.jukeboxMachine.addCollider(this.spawner.PhysicsGroup());

        // Configurar cámara
        this.cameras.main.setBounds(0, 0, 1280, 720);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        // Opcional: agregar bordes para visualizar la cámara
        this.cameras.main.setBackgroundColor(0x000000);


        // --- Portales ---
        this.portal = null;
        this.portalInteractionRange = 80;
        this._portalEnterTimer = null;
        this._returnPortalTimer = null;
        this._portalBlinkTween = null;
        // Cooldown de 20s al llegar desde level_fondo para no volver inmediatamente
        this._returnPortalLocked = !!this._pendingPlayerState;
        if (this._returnPortalLocked) {
            this.time.delayedCall(20000, () => { this._returnPortalLocked = false; });
        }

        if (!this.anims.exists('portalAnim')) {
            this.anims.create({
                key: 'portalAnim',
                frames: this.anims.generateFrameNames('portal', { prefix: 'Sprite-0001 ', suffix: '.', start: 0, end: 6 }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.anims.exists('portalLevelAnim')) {
            this.anims.create({
                key: 'portalLevelAnim',
                frames: this.anims.generateFrameNumbers('portal_level', { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Portal de retorno al nivel 1 — siempre visible
        this.returnPortal = this.physics.add.sprite(60, 60, 'portal_level');
        this.returnPortal.play('portalLevelAnim');
        this.returnPortal.setScale(2);
        this.returnPortal.setDepth(0);

        const shopTimeHandler = () => this._spawnShopPortal();
        const nextWaveHandler = () => {
            if (this.portal) {
                this.portal.destroy();
                this.portal = null;
            }
            if (this._portalEnterTimer) {
                this._portalEnterTimer.remove();
                this._portalEnterTimer = null;
            }
            this._stopPortalBlink();
        };

        this.game.events.on('shopTime', shopTimeHandler);
        this.game.events.on('nextWave', nextWaveHandler);

        this.events.once('shutdown', () => {
            this.game.events.off('shopTime', shopTimeHandler);
            this.game.events.off('nextWave', nextWaveHandler);
        });

    }

    update() {
        if (this.easystar) this.easystar.calculate();
        if (this.jukeboxMachine) this.jukeboxMachine.update(this.player);

        // Portal de tienda
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
                        this.registry.set('ultiCooldown', {
                            [this.player.guitar.iconKey]: this.player.guitar._abilityTimer?.getRemaining() ?? 0,
                            [this.player.drum.iconKey]:   this.player.drum._abilityTimer?.getRemaining()   ?? 0,
                        });
                        this.registry.set('playerState', {
                            life: this.player.life,
                            hasShield: this.player.hasShield,
                            shieldHP: this.player.shieldHP,
                            weapons: {
                                guitar: this.player.guitar.iconKey,
                                drum: this.player.drum.iconKey,
                                bajo: this.player.bajo.iconKey,
                                teclado: this.player.teclado.iconKey,
                            },
                            currentWeaponIndex: this.player.gunManager.currentIndex,
                        });
                        this.registry.set('spawnPosition', { x: this.portal.x, y: this.portal.y });
                        this.soundManager.stop('level1_music');
                        this.soundManager.play('shop_music');
                        this.scene.start('shop', { from: this.scene.key });
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

        // Portal de retorno al nivel 1
        if (this.returnPortal && !this._returnPortalLocked) {
            const distToReturn = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.returnPortal.x, this.returnPortal.y
            );

            if (distToReturn < this.portalInteractionRange) {
                if (!this._returnPortalTimer) {
                    this._returnPortalTimer = this.time.delayedCall(3000, () => {
                        this._stopPortalBlink();
                        this.registry.set('savedWave', this.waveManager.currentWave - 1);
                        this.registry.set('ultiCooldown', {
                            [this.player.guitar.iconKey]: this.player.guitar._abilityTimer?.getRemaining() ?? 0,
                            [this.player.drum.iconKey]:   this.player.drum._abilityTimer?.getRemaining()   ?? 0,
                        });
                        const remainingEnemies = {};
                        for (const type of Object.keys(this.spawner.pool.active)) {
                            remainingEnemies[type] = this.spawner.pool.active[type].length;
                        }
                        this.registry.set('levelCrossState', {
                            life: this.player.life,
                            hasShield: this.player.hasShield,
                            shieldHP: this.player.shieldHP,
                            weapons: {
                                guitar: this.player.guitar.iconKey,
                                drum: this.player.drum.iconKey,
                                bajo: this.player.bajo.iconKey,
                                teclado: this.player.teclado.iconKey,
                            },
                            currentWeaponIndex: this.player.gunManager.currentIndex,
                            remainingEnemies,
                        });
                        this.registry.set('spawnPosition', { x: 130, y: 620 });
                        this.soundManager.stop('level1_music');
                        this.scene.start('level_fondo');
                    });
                    this._startPortalBlink();
                }
            } else {
                if (this._returnPortalTimer) {
                    this._returnPortalTimer.remove();
                    this._returnPortalTimer = null;
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
        this.portal.setDepth(0);
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