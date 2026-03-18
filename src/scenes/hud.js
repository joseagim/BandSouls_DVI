import Phaser from "phaser";
import Bar from './bar';

export default class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'hud' });
    }

    create() {
        // crear la barra arriba a la izquierda
        this.healthBar = new Bar(this, 20, 20, 'hud_health_border', 'hud_health_bar');
        this.healthBar.setScale(3);
        this.healthBar.setScrollFactor(0);

        // --- Score display (rojo, centrado arriba) ---
        this.scoreText = this.add.text(this.scale.width / 2, 20, '0', {
            fontSize: '36px',
            fill: '#ff0000',
            fontFamily: '"System-ui", Courier, monospace',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5, 0).setScrollFactor(0);

        // Mostrar el score actual del registro (por si venimos de otra escena)
        const currentScore = this.registry.get('score') || 0;
        this.scoreText.setText(String(currentScore));

        // Escuchar cambios en el registry para actualizar el score
        this.registry.events.on('changedata-score', (_parent, value) => {
            this.scoreText.setText(String(value));
        });

        // crear el texto de info oleadas
        this.remainingEnemies = this.add.text(20, 80, 'Enemigos restantes: X', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.waitingNextWave = this.add.text(400, 150, 'La siguiente oleada comenzará en X', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.waitingNextWave.visible = false;

        // Display de número de oleada (esquina superior derecha)
        this._roundDigits = [];
        this._showRound(1);

        // pillamos la escena para escuchar eventos y actualizar el hud
        const mainLevel = this.scene.get('level_fondo');

        // evento: actualizar salud del jugador
        mainLevel.events.on('updateHealth', (player) => {
            const percentage = player.life / player.maxHP;
            this.healthBar.setValue(percentage);
        });

        // evento: actualizar número de oleada
        mainLevel.events.on('nextWave', (waveNumber) => {
            this._showRound(waveNumber);
        });

        // evento: actualizar enemigos restantes
        mainLevel.events.on('enemyDead', (enemiesLeft) => {
            this.remainingEnemies.setText('Enemigos restantes: ' + enemiesLeft);
        });

        // evento: mensaje de espera para la siguiente oleada
        mainLevel.events.on('finishWave', (waveDelay) => {
            let timeLeft = Math.floor(waveDelay / 1000);

            this.waitingNextWave.visible = true;
            this.waitingNextWave.setText('La siguiente oleada comenzará en ' + timeLeft);

            this.time.addEvent({
                delay: 1000,
                repeat: timeLeft - 1,
                callback: () => {
                    timeLeft--;
                    if (timeLeft > 0) {
                        this.waitingNextWave.setText('La siguiente oleada comenzará en ' + timeLeft);
                    } else {
                        this.waitingNextWave.visible = false;
                    }
                },
                callbackScope: this
            });
        });

        // --- Shop item panel (oculto por defecto) ---
        this._itemPanelElements = [];
        this._currentPanelItemId = null;
        this._currentPanelCanAfford = null;
        this._currentPanelIsPurchased = null;
        this.trinketIcons = [];

        // Escuchar eventos del shop para mostrar/ocultar panel
        const shopScene = this.scene.get('shop');
        if (shopScene) {
            shopScene.events.on('showShopItem', (item, canAfford, isPurchased) => {
                // Solo recrear el panel si cambió el item o la affordability o isPurchased
                if (this._currentPanelItemId !== item.id || this._currentPanelCanAfford !== canAfford || this._currentPanelIsPurchased !== isPurchased) {
                    this._showItemPanel(item, canAfford, isPurchased);
                    this._currentPanelItemId = item.id;
                    this._currentPanelCanAfford = canAfford;
                    this._currentPanelIsPurchased = isPurchased;
                }
            });
            shopScene.events.on('hideShopItem', () => {
                this._hideItemPanel();
                this._currentPanelItemId = null;
                this._currentPanelCanAfford = null;
                this._currentPanelIsPurchased = null;
            });

            // Escuchar updateHealth del shop player también
            shopScene.events.on('updateHealth', (player) => {
                const percentage = player.life / player.maxHP;
                this.healthBar.setValue(percentage);
            });
        }

        // Si estamos en la tienda, ocultar info de oleadas
        if (this.scene.manager.isActive('shop')) {
            this.remainingEnemies.setVisible(false);
            this.waitingNextWave.setVisible(false);
        }

        // Render trinkets
        this._updateTrinketsDisplay(this.registry.get('trinkets') || []);
        this.registry.events.on('changedata-trinkets', (_parent, values) => {
            this._updateTrinketsDisplay(values);
        });

        this.events.emit('hud-ready');
    }

    _updateTrinketsDisplay(trinkets) {
        this.trinketIcons.forEach(icon => icon.destroy());
        this.trinketIcons = [];

        if (!trinkets || trinkets.length === 0) return;

        const startX = 20;
        const startY = 125;
        const iconSize = 40;
        const gap = 5;
        const maxPerRow = 5;

        trinkets.forEach((t, i) => {
            if (!t.image) return;
            const row = Math.floor(i / maxPerRow);
            const col = i % maxPerRow;
            const x = startX + col * (iconSize + gap);
            const y = startY + row * (iconSize + gap);

            const icon = this.add.image(x, y, t.image)
                .setOrigin(0, 0)
                .setDisplaySize(iconSize, iconSize)
                .setAlpha(0.6)
                .setScrollFactor(0);

            this.trinketIcons.push(icon);
        });
    }

    /**
     * Muestra el panel de info de un item de la tienda.
     * @param {Item} item
     * @param {boolean} canAfford
     * @param {boolean} isPurchased
     */
    _showItemPanel(item, canAfford, isPurchased) {
        // Limpiar panel anterior
        this._hideItemPanel();

        const panelWidth = 260;
        const panelX = this.scale.width / 2 - panelWidth / 2;
        const panelY = this.scale.height - 240;

        // Fondo negro semi-transparente con borde blanco
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(panelX, panelY, panelWidth, 215);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRect(panelX, panelY, panelWidth, 230);
        this._itemPanelElements.push(graphics);

        const contentX = panelX + 15;
        let currentY = panelY + 15;

        // Nombre del item (título)
        const nameText = this.add.text(contentX, currentY, item.name, {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: '"System-ui", Courier, monospace',
            fontStyle: 'bold',
            wordWrap: { width: panelWidth - 30 }
        });
        this._itemPanelElements.push(nameText);
        currentY += nameText.height + 12;

        // Línea horizontal (separador nombre)
        const hr1 = this.add.graphics();
        hr1.lineStyle(1, 0xffffff, 0.8);
        hr1.lineBetween(panelX + 10, currentY, panelX + panelWidth - 10, currentY);
        this._itemPanelElements.push(hr1);
        currentY += 15;

        // Descripción
        const descText = this.add.text(contentX, currentY, item.description, {
            fontSize: '14px',
            fill: '#cccccc',
            fontFamily: 'Arial',
            wordWrap: { width: panelWidth - 30 }
        });
        this._itemPanelElements.push(descText);
        currentY += descText.height + 15;

        // Buffs y Debuffs
        const statsText = item.getStatsText();
        if (statsText.length > 0) {
            const statsDisplay = this.add.text(contentX, currentY, statsText, {
                fontSize: '14px',
                fill: '#88ff88',
                fontFamily: 'Arial',
                wordWrap: { width: panelWidth - 30 }
            });
            this._itemPanelElements.push(statsDisplay);
            currentY += statsDisplay.height + 20;
        }

        // Línea horizontal (separador precio)
        const hr2 = this.add.graphics();
        hr2.lineStyle(1, 0xffffff, 0.8);
        hr2.lineBetween(panelX + 10, currentY, panelX + panelWidth - 10, currentY);
        this._itemPanelElements.push(hr2);
        currentY += 20;

        // Precio (blanco si se puede comprar, rojo si no)
        let priceTextContent = `Puntos: ${item.price}`;
        let priceColor = canAfford ? '#ffffff' : '#ff0000';

        if (isPurchased) {
            priceTextContent = 'objeto equipado';
            priceColor = '#aaaaaa';
        }

        const priceText = this.add.text(contentX, currentY, priceTextContent, {
            fontSize: '18px',
            fill: priceColor,
            fontFamily: '"System-ui", Courier, monospace',
            fontStyle: 'bold'
        });
        this._itemPanelElements.push(priceText);

        // Texto de instrucción para comprar
        if (canAfford && !isPurchased) {
            const buyHint = this.add.text(contentX, currentY + priceText.height + 4, '[E] Buy', {
                fontSize: '12px',
                fill: '#aaaaaa',
                fontFamily: 'Arial'
            });
            this._itemPanelElements.push(buyHint);
        }
    }

    /**
     * Oculta el panel de info de item.
     */
    _hideItemPanel() {
        this._itemPanelElements.forEach(el => el.destroy());
        this._itemPanelElements = [];
    }

    _showRound(number) {
        // Destruir dígitos anteriores
        this._roundDigits.forEach(img => img.destroy());
        this._roundDigits = [];
        // Comprobamos si estamos en la tienda (this.scene.key aquí siempre sería 'hud')
        if (this.scene.manager.isActive("shop")) {
            const rightEdge = this.scale.width - 20;
            const y = 20;
            const shopText = this.add.text(rightEdge, y, 'SHOP', {
                fontSize: '40px',
                fill: '#ff0000',
                fontFamily: '"System-ui", Courier, monospace',
                stroke: '#000000',
                strokeThickness: 6,
                shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, stroke: true, fill: true }
            }).setOrigin(1, 0).setScrollFactor(0);

            this._roundDigits.push(shopText);
            return;
        }
        const digits = String(number).split('');
        const scale = 3;
        const digitWidth = 24 * scale;
        const gap = 4;
        const totalWidth = digits.length * digitWidth + (digits.length - 1) * gap;
        const rightEdge = this.scale.width - 20;
        const y = 20;

        digits.forEach((d, i) => {
            const x = rightEdge - totalWidth + i * (digitWidth + gap) + digitWidth / 2;
            const img = this.add.image(x, y, 'round_numbers', Number(d)).setOrigin(0.5, 0).setScale(scale).setScrollFactor(0);
            this._roundDigits.push(img);
        });
    }
}