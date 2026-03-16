import Phaser from 'phaser';
import Player from '../game-objects/player.js';

import SoundManager from '../game-objects/sound_manager.js';

export default class Shop extends Phaser.Scene {
    /**
     * Constructor de la escena
     */
    constructor() {
        super('shop');
    }

    /**
     * Creación de los elementos de la escena de la tienda
     */
    create() {
        var map = this.make.tilemap({ key: 'shop_map' });
        var tiles = map.addTilesetImage('gardef', 'shop_tiles');
        const mapOffsetX = (this.cameras.main.width - map.widthInPixels) / 2;
        const mapOffsetY = (this.cameras.main.height - map.heightInPixels) / 2;
        var layer = map.createLayer('Capa de patrones 1', tiles, mapOffsetX, mapOffsetY);


        layer.setCollisionByProperty({ colision: true });
        this.soundManager = new SoundManager(this);
        this.soundManager.addSounds({
            'movement': { key: 'movement', loop: true, loopDelay: 100 },
            'dash': { key: 'dash', volume: 10 },
            'guitar_attk': { key: 'guitar_attk', volume: 0.5 }
        });

        const playerStats = this.cache.json.get('data').playerBaseStats;
        this.player = new Player(this, mapOffsetX + (map.widthInPixels / 2), mapOffsetY + (map.heightInPixels / 2), playerStats);

        this.physics.add.collider(this.player, layer);

        this.scene.launch('hud');
        console.log(this.scene.key);
    }
}
