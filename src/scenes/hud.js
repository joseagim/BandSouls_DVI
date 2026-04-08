import Phaser from "phaser";
import Bar from './bar';

export default class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'hud' });
    }

    create() {
        // crear la barra abajo a la izquierda
        this.healthBar = new Bar(this, 20, this.scale.height - 50, 'hud_health_border', 'hud_health_bar');
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
                this.scoreText.setText(String(value) ?? "0");
        });

        // crear el texto de info oleadas
        this.remainingEnemies = this.add.text(20, 120, 'Enemigos restantes: X', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0);

        this.waitingNextWave = this.add.text(this.scale.width / 2, 180, 'La siguiente oleada comenzará en X', {
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
        this.game.events.on('updateHealth', (player) => {
            const percentage = player.life / player.maxHP;
            this.healthBar.setValue(percentage);
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
        this.game.events.on('bossHealthUpdate', (current, max) => {
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
        this.game.events.on('bossDefeated', () => {
            this.time.delayedCall(2000, () => {
                this._bossBarContainer.setVisible(false);
            });
        });


        // El botón de dash se crea en _createWeaponSelector para posicionarlo a su derecha
        this._dashButton = null;
        this.game.events.on('dashStart', (cooldown) => {
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
        this.game.events.on('dashReady', () => {
            if (this._dashButton) this._dashButton.setTexture('dash-button');
            if (this._dashCooldownBar) this._dashCooldownBar.setVisible(false);
        });

        // evento: actualizar número de oleada
        this.game.events.on('nextWave', (waveNumber) => {
            this._showRound(waveNumber);
        });

        // evento: actualizar enemigos restantes
        this.game.events.on('enemyDead', (enemiesLeft) => {
            this.remainingEnemies.setText('Enemigos restantes: ' + enemiesLeft);
        });

        // evento: mensaje de espera para la siguiente oleada
        this.game.events.on('finishWave', (waveDelay) => {
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

        // --- Weapon selector ---
        this._weaponSlots = [];

        const buildWeaponSelector = () => {
            const data = this.registry.get('weaponSelectorData');
            if (data) this._createWeaponSelector(data.iconKeys, data.currentIndex);
        };

        this.game.events.on('weaponSelectorInit', buildWeaponSelector);
        // Por si ya se emitió antes de que el HUD estuviera listo
        buildWeaponSelector();

        this.game.events.on('weaponChanged', (index) => {
            this._updateWeaponSelector(index);
            if (this._ultiButton && this._weaponIconKeys) {
                const key = this._ultiKeyMap[this._weaponIconKeys[index]];
                if (key) this._ultiButton.setTexture(key);
            }
        });

        this.events.emit('hud-ready');
    }

    _createWeaponSelector(iconKeys, currentIndex) {
        this._weaponSlots.forEach(s => { s.frame.destroy(); if (s.icon) s.icon.destroy(); });
        this._weaponSlots = [];

        const slotSpacing = 70;
        const startX = 60;
        const y = 70;

        this._ultiKeyMap = {
            'guitar-icon':   'guitar-vibe-button',
            'drum-icon':     'drum-smash-button',
            'bass-icon':     'bass-grenade-button',
            'keyboard-icon': 'keyboard-minigun-button',
        };
        this._weaponIconKeys = iconKeys;

        // Botones de habilidad a la derecha del último slot
        if (this._dashButton) this._dashButton.destroy();
        if (this._ultiButton) this._ultiButton.destroy();
        if (this._dashCooldownBar) this._dashCooldownBar.destroy();
        const dashX = startX + iconKeys.length * slotSpacing + 10;
        const dashY = y - 35;

        this._dashButton = this.add.image(dashX, dashY, 'dash-button')
            .setScrollFactor(0)
            .setDepth(100)
            .setScale(1.3);

        const initialUltiKey = this._ultiKeyMap[iconKeys[currentIndex]] || 'guitar-vibe-button';
        this._ultiButton = this.add.image(dashX, y + 25, initialUltiKey)
            .setScrollFactor(0)
            .setDepth(100)
            .setScale(1.3);

        // Barra de cooldown del dash (a la derecha del botón, carga de abajo a arriba)
        this._dashBarBounds = { x: dashX + 25, y: dashY - 20, w: 5, h: 40 };
        this._dashCooldownFill = { value: 0 };
        this._dashCooldownBar = this.add.graphics().setScrollFactor(0).setDepth(100).setVisible(false);
        this._redrawDashBar();

        // Panel translúcido detrás de los iconos (ajustado dinámicamente al número de slots)
        if (this._hudTopPanel) this._hudTopPanel.destroy();
        const panelLeft = startX - 45;
        const panelRight = startX + (iconKeys.length - 1) * slotSpacing + 45;
        this._hudTopPanel = this.add.graphics()
            .fillStyle(0x000000, 0.4)
            .fillRoundedRect(panelLeft, 14, panelRight - panelLeft, 105, 8)
            .setDepth(-1)
            .setScrollFactor(0);

        this._weaponSlots = iconKeys.map((iconKey, i) => {
            const x = startX + i * slotSpacing;
            const isSelected = i === currentIndex;

            const frame = this.add.image(x, y, isSelected ? 'weapon-selected' : 'weapon-unselected')
                .setScrollFactor(0)
                .setDepth(100)
                .setScale(1.8);

            let icon = null;
            if (iconKey) {
                icon = this.add.image(x, y, iconKey)
                    .setScrollFactor(0)
                    .setDepth(101)
                    .setScale(1.8);
            }

            return { frame, icon };
        });
    }

    _updateWeaponSelector(currentIndex) {
        this._weaponSlots.forEach((slot, i) => {
            slot.frame.setTexture(i === currentIndex ? 'weapon-selected' : 'weapon-unselected');
        });
    }

    _updateTrinketsDisplay(trinkets) {
        this.trinketIcons.forEach(el => el.destroy());
        this.trinketIcons = [];

        if (!trinkets || trinkets.length === 0) return;

        const startX = 20;
        const startY = 150;
        const iconSize = 40;
        const gap = 5;
        const maxPerRow = 3;
        const rowHeight = iconSize + gap;

        if (this._trinketExpanded === undefined) this._trinketExpanded = false;

        const visibleRows = this._trinketExpanded ? Math.ceil(trinkets.length / maxPerRow) : 1;
        const visibleCount = visibleRows * maxPerRow;
        const hasMore = trinkets.length > maxPerRow;

        trinkets.slice(0, visibleCount).forEach((t, i) => {
            if (!t.image) return;
            const col = i % maxPerRow;
            const row = Math.floor(i / maxPerRow);
            const icon = this.add.image(startX + col * (iconSize + gap), startY + row * rowHeight, t.image)
                .setOrigin(0, 0)
                .setDisplaySize(iconSize, iconSize)
                .setAlpha(0.6)
                .setScrollFactor(0);
            this.trinketIcons.push(icon);
        });

        if (hasMore) {
            const dotsRow = this._trinketExpanded ? Math.ceil(trinkets.length / maxPerRow) : 1;
            const dotsText = this.add.text(startX, startY + dotsRow * rowHeight, '...', {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 3
            }).setScrollFactor(0).setInteractive({ useHandCursor: true });

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