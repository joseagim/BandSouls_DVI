import Phaser from 'phaser';
import Player from '../game-objects/player.js';
import Item from '../game-objects/item.js';
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
        const marginX = 130;
        const marginY = 140;

        this.player = new Player(
            this,
            833,
            320,
            playerStats
        );



        this.physics.add.collider(this.player, layer);

        this.scene.launch('hud');

        // --- Sistema de items en la tienda ---
        const tileSize = map.tileHeight; // 48

        // Posiciones de los 3 pilares (columnas 4, 7, 10 en fila 4, basado en tile 98 del mapa)
        // Centradas en el tile: col * tileSize + tileSize/2 + mapOffset
        this.pillarPositions = [
            { col: 4, row: 5 },
            { col: 7, row: 5 },
            { col: 10, row: 5 }
        ].map(p => ({
            x: mapOffsetX + p.col * tileSize + tileSize / 2,
            y: mapOffsetY + p.row * tileSize + tileSize / 2
        }));

        // Seleccionar 3 items del pool con selección ponderada
        const itemPool = this.cache.json.get('items').map(data => new Item(data));
        this.shopItems = Item.pickWeighted(itemPool, 3);

        // Estado de cada pilar: { item, purchased, sprite }
        this.pillarStates = this.shopItems.map((item, i) => {
            const position = this.pillarPositions[i];
            const sprite = this.add.sprite(position.x, position.y - tileSize / 2, item.image);
            sprite.setOrigin(0.5, 1); // Anclar en la parte inferior-centro
            return {
                item: item,
                purchased: false,
                position: position,
                sprite: sprite
            };
        });


        this.interactionRange = 60;


        this.activePillarIndex = -1; 5


        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);


        this.anims.create({
            key: 'portalAnim',
            frames: this.anims.generateFrameNames('portal', { prefix: 'Sprite-0001 ', suffix: '.', start: 0, end: 6 }),
            frameRate: 10,
            repeat: -1
        });

        this.portal = this.physics.add.sprite(833, 272, 'portal');
        this.portal.play('portalAnim');
        this.portalInteractionRange = 50;
    }





    update() {
        if (!this.player || !this.pillarStates) return;

        let closestIndex = -1;
        let closestDist = Infinity;


        for (let i = 0; i < this.pillarStates.length; i++) {
            const state = this.pillarStates[i];
            if (state.purchased) continue;

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                state.position.x, state.position.y
            );

            if (dist < this.interactionRange && dist < closestDist) {
                closestDist = dist;
                closestIndex = i;
            }
        }


        if (closestIndex !== this.activePillarIndex) {
            if (closestIndex >= 0) {
                const state = this.pillarStates[closestIndex];
                const currentScore = this.registry.get('score') || 0;
                const canAfford = currentScore >= state.item.price;
                this.events.emit('showShopItem', state.item, canAfford);
            } else {
                this.events.emit('hideShopItem');
            }
            this.activePillarIndex = closestIndex;
        }


        if (closestIndex >= 0) {
            const state = this.pillarStates[closestIndex];
            const currentScore = this.registry.get('score') || 0;
            const canAfford = currentScore >= state.item.price;

            this.events.emit('showShopItem', state.item, canAfford);
        }

        const distToPortal = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.portal.x, this.portal.y
        );


        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
            if (this.activePillarIndex >= 0) {
                const state = this.pillarStates[this.activePillarIndex];
                const currentScore = this.registry.get('score') || 0;

                if (currentScore >= state.item.price && !state.purchased) {

                    const newScore = currentScore - state.item.price;
                    this.registry.set('score', newScore);


                    state.purchased = true;


                    this.player.addTrinket(state.item);

                    if (state.sprite) {
                        state.sprite.destroy();
                        state.sprite = null;
                    }

                    this.events.emit('hideShopItem');
                    this.activePillarIndex = -1;
                }
            }
        }

        // Enter para entrar al portal
        if (Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
            if (distToPortal < this.portalInteractionRange) {
                this.scene.start('level_fondo');
            }
        }

    }

}
