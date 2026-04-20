import Phaser from "phaser";
import Bar from './bar';

export default class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'hud' });
    }

    create() {
        this._gameEventHandlers = [];
        this._registryEventHandlers = [];

        const registerGameEvent = (eventName, callback, context = this) => {
            this.game.events.on(eventName, callback, context);
            this._gameEventHandlers.push({ eventName, callback, context });
        };

        const registerRegistryEvent = (eventName, callback, context = this) => {
            this.registry.events.on(eventName, callback, context);
            this._registryEventHandlers.push({ eventName, callback, context });
        };

        this.events.on('shutdown', () => {
            this._gameEventHandlers.forEach(({ eventName, callback, context }) => {
                this.game.events.off(eventName, callback, context);
            });
            this._gameEventHandlers.length = 0;
            this._registryEventHandlers.forEach(({ eventName, callback, context }) => {
                this.registry.events.off(eventName, callback, context);
            });
            this._registryEventHandlers.length = 0;
        }, this);

        // La barra se posiciona y escala dentro de _createWeaponSelector
        this.healthBar = new Bar(this, 0, 0, 'hud_health_border', 'hud_health_bar_green');
        this.healthBar.setScrollFactor(0);
        this.healthBar.setVisible(false);

        // Score — se posiciona en _createWeaponSelector
        this.scoreText = this.add.text(0, 0, '0', {
            fontSize: '26px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(1, 0.5).setScrollFactor(0).setVisible(false);

        const currentScore = this.registry.get('score') || 0;
        this.scoreText.setText(String(currentScore));

        registerRegistryEvent('changedata-score', (_parent, value) => {
            this.scoreText.setText(String(value) ?? "0");
        });

        // Enemigos restantes — centro arriba
        this.remainingEnemies = this.add.text(this.scale.width / 2, 20, 'Enemigos restantes: X', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.portalBanner = this.add.text(this.scale.width / 2, 140, '¡Ha aparecido un portal!', {
            fontSize: '32px',
            fill: '#ffe066',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5, 0).setScrollFactor(0);
        this.portalBanner.visible = false;

        this.waitingNextWave = this.add.text(this.scale.width / 2, 185, 'La siguiente oleada comenzará en X', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0);
        this.waitingNextWave.visible = false;

        // Display de número de oleada (esquina superior izquierda)
        this._roundDigits = [];
        this._showRound(1);

        // evento: actualizar salud del jugador
        registerGameEvent('updateHealth', (player) => {
            const percentage = player.life / player.maxHP;
            this.healthBar.setValue(percentage);
            this.healthBar.setBarTexture(percentage <= 0.3 ? 'hud_health_bar' : 'hud_health_bar_green');
        });

        // ─── Barra de vida del Boss (abajo a la derecha) ────────────────────────
        this._bossBarContainer = this.add.container(0, 0).setScrollFactor(0).setVisible(false);
        this._bossBarContainer.setDepth(200);

        const barW   = 280;  // ancho total de la barra
        const barH   = 18;
        const barX   = this.scale.width  - barW - 20;  // borde derecho con margen
        const barY   = this.scale.height - 60;          // mismo nivel que la barra del jugador

        // Fondo semitransparente detrás de toda la sección
        const bgPanel = this.add.graphics()
            .fillStyle(0x000000, 0.55)
            .fillRoundedRect(barX - 10, barY - 28, barW + 20, barH + 42, 6);

        // Etiqueta con el nombre del boss
        const bossLabel = this.add.text(barX, barY - 24, 'BEETHOVEN', {
            fontSize: '14px',
            fill: '#ffcc00',
            fontFamily: '"System-ui", Courier, monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0);

        // Fondo rojo oscuro de la barra
        const barBg = this.add.graphics()
            .fillStyle(0x550000, 1)
            .fillRect(barX, barY, barW, barH);

        // Relleno rojo brillante (vida actual)
        this._bossHealthFill = this.add.graphics();
        this._bossHealthFill.fillStyle(0xff2222, 1);
        this._bossHealthFill.fillRect(barX, barY, barW, barH);

        // Borde de la barra
        const barBorder = this.add.graphics()
            .lineStyle(2, 0xffffff, 0.8)
            .strokeRect(barX, barY, barW, barH);

        // Texto de porcentaje de vida
        this._bossHealthText = this.add.text(barX + barW / 2, barY + barH / 2, '100%', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: '"System-ui", Courier, monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5);

        this._bossBarBounds = { x: barX, y: barY, w: barW, h: barH };

        this._bossBarContainer.add([bgPanel, bossLabel, barBg, this._bossHealthFill, barBorder, this._bossHealthText]);

        // Escuchar actualizaciones de vida del boss
        registerGameEvent('bossHealthUpdate', (current, max) => {
            this._bossBarContainer.setVisible(true);
            const pct    = Math.max(0, Math.min(1, current / max));
            const { x, y, w, h } = this._bossBarBounds;
            this._bossHealthFill.clear();
            // Color: verde > 50%, amarillo > 25%, rojo <= 25%
            const color = pct > 0.5 ? 0xff2222 : pct > 0.25 ? 0xff8800 : 0xff0000;
            this._bossHealthFill.fillStyle(color, 1);
            this._bossHealthFill.fillRect(x, y, w * pct, h);
            this._bossHealthText.setText(Math.ceil(pct * 100) + '%');
        });

        // Al morir el boss, ocultar la barra tras un breve delay
        registerGameEvent('bossDefeated', () => {
            this.time.delayedCall(2000, () => {
                this._bossBarContainer.setVisible(false);
            });
        });


        // El botón de dash se crea en _createWeaponSelector para posicionarlo a su derecha
        this._dashButton = null;
        registerGameEvent('dashStart', (cooldown) => {
            if (this._dashButton) this._dashButton.setTexture('dash-button-disabled');
            if (this._dashCooldownBar) this._dashCooldownBar.setVisible(true);
            this._dashCooldownFill = { value: 0 };
            this._redrawDashBar();
            this.tweens.add({
                targets: this._dashCooldownFill,
                value: 1,
                duration: cooldown,
                ease: 'Linear',
                onUpdate: () => this._redrawDashBar()
            });
        });
        registerGameEvent('dashReady', () => {
            if (this._dashButton) this._dashButton.setTexture('dash-button');
            if (this._dashCooldownBar) this._dashCooldownBar.setVisible(false);
        });

        // evento: actualizar número de oleada
        registerGameEvent('nextWave', (waveNumber) => {
            this._showRound(waveNumber);
            this.portalBanner.visible = false;
        });

        // evento: actualizar enemigos restantes
        registerGameEvent('enemyDead', (enemiesLeft) => {
            this.remainingEnemies.setText('Enemigos restantes: ' + enemiesLeft);
        });

        // evento: portal de tienda aparecido
        registerGameEvent('shopTime', () => {
            this.portalBanner.visible = true;
        });

        // evento: mensaje de espera para la siguiente oleada
        registerGameEvent('finishWave', (waveDelay) => {
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
        registerRegistryEvent('changedata-trinkets', (_parent, values) => {
            this._updateTrinketsDisplay(values);
        });

        // --- Weapon selector ---
        this._weaponSlots = [];

        const buildWeaponSelector = () => {
            const data = this.registry.get('weaponSelectorData');
            if (data) this._createWeaponSelector(data.iconKeys, data.currentIndex);
        };

        registerGameEvent('weaponSelectorInit', buildWeaponSelector);
        // Por si ya se emitió antes de que el HUD estuviera listo
        buildWeaponSelector();

        registerGameEvent('weaponChanged', (index) => {
            this._updateWeaponSelector(index);
            if (this._ultiButton && this._weaponIconKeys) {
                const si = this._playerToSortedIndex?.[index] ?? index;
                const key = this._ultiKeyMap[this._weaponIconKeys[si]];
                if (key) this._ultiButton.setTexture(key);
            }
        });

        this.events.emit('hud-ready');
    }

    _createWeaponSelector(iconKeys, currentIndex) {
        this._weaponSlots.forEach(s => { s.frame.destroy(); if (s.icon) s.icon.destroy(); });
        this._weaponSlots = [];

        // Orden fijo: guitarra, batería, bajo, teclado
        const weaponOrder = ['guitar-icon', 'drum-icon', 'bass-icon', 'keyboard-icon'];
        const sortedKeys = [...iconKeys].sort((a, b) => {
            const ai = weaponOrder.indexOf(a); const bi = weaponOrder.indexOf(b);
            return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        });

        this._playerToSortedIndex = {};
        iconKeys.forEach((key, pi) => { this._playerToSortedIndex[pi] = sortedKeys.indexOf(key); });
        const sortedCurrentIndex = this._playerToSortedIndex[currentIndex] ?? 0;
        this._weaponIconKeys = sortedKeys;

        this._ultiKeyMap = {
            'guitar-icon':   'guitar-vibe-button',
            'drum-icon':     'drum-smash-button',
            'bass-icon':     'bass-grenade-button',
            'keyboard-icon': 'keyboard-minigun-button',
        };

        // Layout — slots abajo-derecha, crecen hacia la izquierda
        const slotSpacing = 85;
        const slotScale  = 2.1;
        const slotY      = this.scale.height - 60;
        const rightEdge  = this.scale.width  - 60;
        const firstSlotX = rightEdge - (sortedKeys.length - 1) * slotSpacing;

        // Panel translúcido que cubre barra de vida + slots
        if (this._hudTopPanel)   this._hudTopPanel.destroy();
        if (this._scorePanelGfx) this._scorePanelGfx.destroy();
        const panelPad  = 35;
        const panelLeft = firstSlotX - panelPad - 20;
        const panelW    = rightEdge + panelPad - panelLeft + 20;
        const panelTop  = slotY - 85;
        const panelH    = slotY + 50 - panelTop;
        this._hudTopPanel = this.add.graphics()
            .fillStyle(0x000000, 0.4)
            .fillRoundedRect(panelLeft, panelTop, panelW, panelH, 8)
            .setDepth(-1)
            .setScrollFactor(0);

        // Barra de vida: ajustada al ancho del panel
        if (this.healthBar) {
            const barScale = (panelW - 24) / this.healthBar.frame.width;
            this.healthBar.setScale(barScale);
            this.healthBar.setPosition(panelLeft + 12, panelTop );
            this.healthBar.setVisible(true);
        }

        // Panel de puntuación: encima del panel de armas, alineado a la derecha
        const scoreH    = 46;
        const scoreW    = Math.round(190 * 1.3);
        const scoreLeft = this.scale.width - scoreW;
        const scoreTop  = panelTop - 28 - scoreH;
        const sg = this.add.graphics().setScrollFactor(0).setDepth(-1);
        const fadeZone  = 70;
        const fadeSteps = 14;
        const stripW    = fadeZone / fadeSteps;
        // Centro sólido (sin solapamiento)
        sg.fillStyle(0x000000, 0.4);
        sg.fillRect(scoreLeft + fadeZone, scoreTop, scoreW - 2 * fadeZone, scoreH);
        // Franjas de fade en ambos lados
        for (let i = 0; i < fadeSteps; i++) {
            const alpha  = ((i + 1) / fadeSteps) * 0.4;
            const leftX  = scoreLeft + i * stripW;
            const rightX = scoreLeft + scoreW - (i + 1) * stripW;
            sg.fillStyle(0x000000, alpha);
            sg.fillRect(leftX,  scoreTop, stripW, scoreH);
            sg.fillRect(rightX, scoreTop, stripW, scoreH);
        }
        this._scorePanelGfx = sg;

        this.scoreText.setPosition(scoreLeft + scoreW - 60, scoreTop + scoreH / 2);
        this.scoreText.setVisible(true);

        // Dash + ulti abajo-izquierda, más grandes
        if (this._dashButton)      this._dashButton.destroy();
        if (this._ultiButton)      this._ultiButton.destroy();
        if (this._dashCooldownBar) this._dashCooldownBar.destroy();

        const dashX = 50;
        const ultiX = dashX + 90;

        this._dashButton = this.add.image(dashX, slotY, 'dash-button')
            .setScrollFactor(0).setDepth(100).setScale(1.8);

        const initialUltiKey = this._ultiKeyMap[sortedKeys[sortedCurrentIndex]] || 'guitar-vibe-button';
        this._ultiButton = this.add.image(ultiX, slotY, initialUltiKey)
            .setScrollFactor(0).setDepth(100).setScale(1.8);

        this._dashBarBounds = { x: dashX + 28, y: slotY - 22, w: 5, h: 44 };
        this._dashCooldownFill = { value: 0 };
        this._dashCooldownBar = this.add.graphics().setScrollFactor(0).setDepth(100).setVisible(false);
        this._redrawDashBar();

        // Slots de arma
        this._weaponSlots = sortedKeys.map((iconKey, i) => {
            const x = firstSlotX + i * slotSpacing;
            const isSelected = i === sortedCurrentIndex;
            const frame = this.add.image(x, slotY, isSelected ? 'weapon-selected' : 'weapon-unselected')
                .setScrollFactor(0).setDepth(100).setScale(slotScale);
            const icon = iconKey
                ? this.add.image(x, slotY, iconKey).setScrollFactor(0).setDepth(101).setScale(slotScale)
                : null;
            return { frame, icon };
        });
    }

    _updateWeaponSelector(playerIndex) {
        const sortedIndex = this._playerToSortedIndex?.[playerIndex] ?? playerIndex;
        this._weaponSlots.forEach((slot, i) => {
            slot.frame.setTexture(i === sortedIndex ? 'weapon-selected' : 'weapon-unselected');
        });
    }

    _updateTrinketsDisplay(trinkets) {
        this.trinketIcons.forEach(el => el.destroy());
        this.trinketIcons = [];

        if (!trinkets || trinkets.length === 0) return;

        const maxPerRow = 7;
        const iconSize  = 40;
        const gap       = 5;
        const rowH      = iconSize + gap;
        const totalRowW = maxPerRow * iconSize + (maxPerRow - 1) * gap;
        const startX    = this.scale.width / 2 - totalRowW / 2;
        const bottomY   = this.scale.height - 12; // casi pegados al borde inferior

        if (this._trinketExpanded === undefined) this._trinketExpanded = false;

        const totalRows   = Math.ceil(trinkets.length / maxPerRow);
        const visibleRows = this._trinketExpanded ? totalRows : 1;
        const visibleCount = Math.min(trinkets.length, visibleRows * maxPerRow);
        const hasMore = trinkets.length > maxPerRow;

        // Filas crecen hacia arriba: fila 0 es la más baja
        trinkets.slice(0, visibleCount).forEach((t, i) => {
            if (!t.image) return;
            const col = i % maxPerRow;
            const row = Math.floor(i / maxPerRow);
            const icon = this.add.image(
                startX + col * (iconSize + gap),
                bottomY - row * rowH,
                t.image
            ).setOrigin(0, 1).setDisplaySize(iconSize, iconSize).setAlpha(0.35).setScrollFactor(0);
            this.trinketIcons.push(icon);
        });

        if (hasMore) {
            const dotsY = bottomY - visibleRows * rowH - 4;
            const dotsText = this.add.text(startX, dotsY, '...', {
                fontSize: '20px', fill: '#ffffff', fontFamily: 'Arial',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0, 1).setScrollFactor(0).setInteractive({ useHandCursor: true });

            dotsText.on('pointerdown', () => {
                this._trinketExpanded = !this._trinketExpanded;
                this._updateTrinketsDisplay(this.registry.get('trinkets') || []);
            });
            this.trinketIcons.push(dotsText);
        }
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

    _redrawDashBar() {
        if (!this._dashCooldownBar || !this._dashBarBounds) return;
        const { x, y, w, h } = this._dashBarBounds;
        this._dashCooldownBar.clear();
        // Fondo oscuro
        this._dashCooldownBar.fillStyle(0x222222, 0.8);
        this._dashCooldownBar.fillRect(x, y, w, h);
        // Relleno de abajo a arriba
        const fillH = h * this._dashCooldownFill.value;
        this._dashCooldownBar.fillStyle(0x00ccff, 1);
        this._dashCooldownBar.fillRect(x, y + h - fillH, w, fillH);
    }

    _showRound(number) {
        // Destruir dígitos anteriores
        this._roundDigits.forEach(img => img.destroy());
        this._roundDigits = [];
        // Comprobamos si estamos en la tienda (this.scene.key aquí siempre sería 'hud')
        if (this.scene.manager.isActive("shop")) {
            const shopText = this.add.text(this.scale.width - 20, 20, 'SHOP', {
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
        const gap = -5;
        const rightEdge = this.scale.width - 20;
        const totalWidth = digits.length * digitWidth + (digits.length - 1) * gap;
        const y = 20;

        digits.forEach((d, i) => {
            const x = rightEdge - totalWidth + i * (digitWidth + gap) + digitWidth / 2;
            const img = this.add.image(x, y, 'round_numbers', Number(d)).setOrigin(0.5, 0).setScale(scale).setScrollFactor(0);
            this._roundDigits.push(img);
        });
    }
}