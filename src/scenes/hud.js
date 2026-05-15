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

        const GAMEPLAY_SCENES = ['level_fondo', 'level_2', 'shop'];

        // Pause button — top-left corner, 8px margin from edges
        const pauseBtn = this.add.image(8, 8, 'pause-button')
            .setScale(2).setOrigin(-0.15, -0.1).setScrollFactor(0).setDepth(100)
            .setInteractive({ useHandCursor: true });

        // Panel + barra de vida — arriba izquierda, a la derecha del botón de pausa
        this.healthBar = new Bar(this, 0, 0, 'hud_health_border', 'hud_health_bar_green');
        this.healthBar.setScrollFactor(0);
        const hpBarScale = 2;
        const hpPadX     = 80;
        const hpPadY     = 8;
        const hpPanelW   = Math.round(this.healthBar.frame.width  * hpBarScale) + 20;
        const hpPanelH   = Math.round(this.healthBar.frame.height * hpBarScale) + 16;
        this.add.graphics()
            .fillStyle(0x000000, 0.4)
            .fillRoundedRect(hpPadX, hpPadY, hpPanelW, hpPanelH, 8)
            .setDepth(-1)
            .setScrollFactor(0);
        this.healthBar.setScale(hpBarScale);
        this.healthBar.setPosition(hpPadX + 10, hpPadY + 8);
        this.healthBar.setVisible(true);
        pauseBtn.on('pointerover',  () => pauseBtn.setTint(0xaaaaaa));
        pauseBtn.on('pointerout',   () => pauseBtn.clearTint());
        pauseBtn.on('pointerdown',  () => pauseBtn.setTint(0x888888));
        pauseBtn.on('pointerup',    () => pauseBtn.setTint(0xaaaaaa));
        pauseBtn.on('pointerup', () => {
            const active = GAMEPLAY_SCENES.find(k => this.scene.isActive(k));
            if (active) this._launchPause(active);
        });

        // Score — se posiciona en _createWeaponSelector
        this.scoreText = this.add.text(0, 0, '0', {
            fontSize: '26px',
            fill: '#ffffff',
            fontFamily: 'Verdana',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(10).setVisible(false);

        const currentScore = this.registry.get('score') || 0;
        this.scoreText.setText(String(currentScore));
        this._lastScore = currentScore;
        this._scorePopupIndex = 0;

        registerRegistryEvent('changedata-score', (_parent, value) => {
            this.scoreText.setText(String(value) ?? "0");
            const delta = value - (this._lastScore ?? 0);
            this._lastScore = value;
            if (delta !== 0) this._spawnScorePopup(delta);
        });

        // Enemigos restantes — centro arriba
        this.remainingEnemies = this.add.text(this.scale.width / 2, 20, 'Enemigos restantes: X', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Verdana',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.portalBanner = this.add.text(this.scale.width / 2, 140, '', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Verdana',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5, 0).setScrollFactor(0).setVisible(false);

        this.portalBannerSub = this.add.text(this.scale.width / 2, 184, '', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Verdana',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setVisible(false);

        this.waitingNextWave = this.add.text(this.scale.width / 2, 185, 'La siguiente oleada comenzará en X', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Verdana',
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
        const barX   = (this.scale.width - barW) / 2;  // centrada horizontalmente
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

        registerGameEvent('ultiStart', ({ weaponKey, cooldown }) => {
            if (!this._ultiCooldownState) this._ultiCooldownState = {};
            this._ultiCooldownState[weaponKey] = { startTime: Date.now(), cooldown };
            if (this._getCurrentUltiIconKey() === weaponKey) {
                if (this._ultiCooldownTween) { this._ultiCooldownTween.stop(); this._ultiCooldownTween = null; }
                this._startUltiCooldownUI(0, cooldown);
            }
        });
        registerGameEvent('ultiReady', ({ weaponKey }) => {
            if (this._ultiCooldownState) delete this._ultiCooldownState[weaponKey];
            if (this._getCurrentUltiIconKey() === weaponKey) {
                this._stopUltiCooldownUI(weaponKey);
            }
        });

        // evento: actualizar número de oleada
        registerGameEvent('nextWave', (waveNumber) => {
            this._showRound(waveNumber);
            this.portalBanner.setVisible(false);
            this.portalBannerSub.setVisible(false);
        });

        // evento: actualizar enemigos restantes
        registerGameEvent('enemyDead', (enemiesLeft) => {
            this.remainingEnemies.setText('Enemigos restantes: ' + enemiesLeft);
        });

        // evento: portal de tienda aparecido
        registerGameEvent('shopTime', () => {
            this.portalBanner.setText('¡Se ha abierto un portal!').setColor('#aa44ff').setVisible(true);
            this.portalBannerSub.setVisible(false);
        });

        registerGameEvent('nextLevelTime', () => {
            this.portalBanner.setText('¡Se ha abierto un portal!').setColor('#ff4800').setVisible(true);
            this.portalBannerSub.setText('Ya puedes explorar la siguiente zona').setVisible(true);
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

        // --- Machine panel (oculto por defecto) ---
        this._machinePanelElements = [];
        registerGameEvent('showMachinePanel', (name, subtitle, price, canAfford) => {
            this._showMachinePanel(name, subtitle, price, canAfford);
        });
        registerGameEvent('hideMachinePanel', () => {
            this._hideMachinePanel();
        });

        // --- Shop item panel (oculto por defecto) ---
        this._itemPanelElements = [];
        this._currentPanelItemId = null;
        this._currentPanelCanAfford = null;
        this._currentPanelIsPurchased = null;
        this.trinketIcons = [];

        // --- Machine panel ---
        this._machinePanelElements = [];

        registerGameEvent('showMachinePanel', (name, subtitle, price, canAfford, hasShield) => {
            this._showMachinePanel(name, subtitle, price, canAfford, hasShield);
        });
        registerGameEvent('hideMachinePanel', () => {
            this._hideMachinePanel();
        });

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
        this._lockedPlayerIndices = new Set();

        const buildWeaponSelector = () => {
            const data = this.registry.get('weaponSelectorData');
            if (data) this._createWeaponSelector(data.iconKeys, data.currentIndex);
        };

        registerGameEvent('weaponSelectorInit', buildWeaponSelector);
        // Por si ya se emitió antes de que el HUD estuviera listo
        buildWeaponSelector();

        registerGameEvent('weaponLocksChanged', (lockedIndices) => {
            this._lockedPlayerIndices = new Set(lockedIndices);
            const data = this.registry.get('weaponSelectorData');
            const idx  = this._currentWeaponPlayerIndex ?? data?.currentIndex ?? 0;
            if (data) this._createWeaponSelector(data.iconKeys, idx);
        });

        // --- Powerups activos (debajo de la barra de vida) ---
        this._activePowerups = [];
        registerGameEvent('pickupCollected', (cfg) => {
            if (cfg.pickupType !== 'powerup' || !cfg.hudIcon || !cfg.duration) return;
            this._addActivePowerup(cfg);
        });

        registerGameEvent('weaponChanged', (index) => {
            this._currentWeaponPlayerIndex = index;
            this._updateWeaponSelector(index);
            if (this._ultiButton && this._weaponIconKeys) {
                const si = this._playerToSortedIndex?.[index] ?? index;
                const iconKey = this._weaponIconKeys[si];
                if (this._ultiCooldownTween) { this._ultiCooldownTween.stop(); this._ultiCooldownTween = null; }
                const state = this._ultiCooldownState?.[iconKey];
                if (state) {
                    const elapsed = Date.now() - state.startTime;
                    const progress = Math.min(elapsed / state.cooldown, 1);
                    const remaining = Math.max(state.cooldown - elapsed, 0);
                    this._startUltiCooldownUI(progress, remaining);
                } else {
                    this._stopUltiCooldownUI(iconKey);
                }
            }
        });

        // TAB key → pause menu
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB).on('down', () => {
            const active = GAMEPLAY_SCENES.find(k => this.scene.isActive(k));
            if (active) this._launchPause(active);
        });

        this.events.emit('hud-ready');
    }

    _createWeaponSelector(iconKeys, currentIndex) {
        this._weaponSlots.forEach(s => { s.frame.destroy(); if (s.icon) s.icon.destroy(); });
        this._weaponSlots = [];

        // Mapa de iconos MK2 → base para mantener el orden de slots
        const iconBaseMap = {
            'guitarmk2-icon':   'guitar-icon',
            'drummk2-icon':     'drum-icon',
            'bassmk2-icon':     'bass-icon',
            'keyboardmk2-icon': 'keyboard-icon',
        };
        // Orden fijo: guitarra, batería, bajo, teclado
        const weaponOrder = ['guitar-icon', 'drum-icon', 'bass-icon', 'keyboard-icon'];

        // Filtrar armas bloqueadas: solo mostrar las desbloqueadas
        const locked = this._lockedPlayerIndices ?? new Set();
        const unlockedEntries = iconKeys
            .map((key, pi) => ({ key, pi }))
            .filter(({ pi }) => !locked.has(pi));

        unlockedEntries.sort((a, b) => {
            const ai = weaponOrder.indexOf(iconBaseMap[a.key] ?? a.key);
            const bi = weaponOrder.indexOf(iconBaseMap[b.key] ?? b.key);
            return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        });

        const sortedKeys = unlockedEntries.map(e => e.key);

        this._playerToSortedIndex = {};
        unlockedEntries.forEach(({ pi }, si) => { this._playerToSortedIndex[pi] = si; });
        const sortedCurrentIndex = this._playerToSortedIndex[currentIndex] ?? 0;
        this._weaponIconKeys = sortedKeys;

        this._currentWeaponPlayerIndex = currentIndex;
        if (!this._ultiCooldownState) this._ultiCooldownState = {};

        this._ultiKeyMap = {
            'guitar-icon':       'guitar-vibe-button',
            'drum-icon':         'drum-smash-button',
            'bass-icon':         'bass-grenade-button',
            'keyboard-icon':     'keyboard-minigun-button',
            'guitarmk2-icon':    'guitar-vibe-button',
            'drummk2-icon':      'drum-smash-button',
            'bassmk2-icon':      'bass-grenade-button',
            'keyboardmk2-icon':  'keyboard-minigun-button',
        };
        this._ultiDisabledKeyMap = {
            'guitar-icon':       'guitar-vibe-button-disabled',
            'drum-icon':         'drum-smash-button-disabled',
            'bass-icon':         'bass-grenade-button-disabled',
            'keyboard-icon':     'keyboard-minigun-button-disabled',
            'guitarmk2-icon':    'guitar-vibe-button-disabled',
            'drummk2-icon':      'drum-smash-button-disabled',
            'bassmk2-icon':      'bass-grenade-button-disabled',
            'keyboardmk2-icon':  'keyboard-minigun-button-disabled',
        };

        // Layout — slots abajo-derecha, crecen hacia la izquierda
        const slotSpacing = 85;
        const slotScale  = 2.1;
        const slotY      = this.scale.height - 60;
        const rightEdge  = this.scale.width  - 60;
        const firstSlotX = rightEdge - (sortedKeys.length - 1) * slotSpacing;

        // Panel translúcido que cubre los slots
        if (this._hudTopPanel)   this._hudTopPanel.destroy();
        if (this._scorePanelGfx) this._scorePanelGfx.destroy();
        const panelPad  = 35;
        const panelLeft = firstSlotX - panelPad - 20;
        const panelW    = rightEdge + panelPad - panelLeft + 20;
        const panelTop  = slotY - 50;
        const panelH    = slotY + 50 - panelTop;
        this._hudTopPanel = this.add.graphics()
            .fillStyle(0x000000, 0.4)
            .fillRoundedRect(panelLeft, panelTop, panelW, panelH, 8)
            .setDepth(-1)
            .setScrollFactor(0);

        // Panel de puntuación: encima del panel de armas, alineado a la derecha
        const scoreH    = 46;
        const scoreW    = Math.round(190 * 1.3);
        const scoreLeft = this.scale.width - scoreW;
        const scoreTop  = panelTop - 40 - scoreH;
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
        if (this._dashButton)       this._dashButton.destroy();
        if (this._ultiButton)       this._ultiButton.destroy();
        if (this._dashCooldownBar)  this._dashCooldownBar.destroy();
        if (this._ultiCooldownBar)  this._ultiCooldownBar.destroy();
        if (this._ultiCooldownTween) { this._ultiCooldownTween.stop(); this._ultiCooldownTween = null; }

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

        this._ultiBarBounds = { x: ultiX + 28, y: slotY - 22, w: 5, h: 44 };
        this._ultiCooldownFill = { value: 0 };
        this._ultiCooldownBar = this.add.graphics().setScrollFactor(0).setDepth(100).setVisible(false);
        this._redrawUltiBar();

        // Restore cooldown state for the currently equipped weapon
        const currentIconKey = this._weaponIconKeys[sortedCurrentIndex];
        const existingState = this._ultiCooldownState?.[currentIconKey];
        if (existingState) {
            const elapsed = Date.now() - existingState.startTime;
            const progress = Math.min(elapsed / existingState.cooldown, 1);
            const remaining = Math.max(existingState.cooldown - elapsed, 0);
            this._startUltiCooldownUI(progress, remaining);
        }

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

        // Debajo de la barra de vida (hpPadX=80, hpPadY=8, panel≈56px de alto)
        const maxPerRow = 7;
        const iconSize  = 28;
        const gap       = 4;
        const rowH      = iconSize + gap;
        const startX    = 90;
        const startY    = 70; // justo debajo del panel de vida

        if (this._trinketExpanded === undefined) this._trinketExpanded = false;

        const totalRows   = Math.ceil(trinkets.length / maxPerRow);
        const visibleRows = this._trinketExpanded ? totalRows : 1;
        const visibleCount = Math.min(trinkets.length, visibleRows * maxPerRow);
        const hasMore = trinkets.length > maxPerRow;

        // Filas crecen hacia abajo
        trinkets.slice(0, visibleCount).forEach((t, i) => {
            if (!t.image) return;
            const col = i % maxPerRow;
            const row = Math.floor(i / maxPerRow);
            const icon = this.add.image(
                startX + col * (iconSize + gap),
                startY + row * rowH,
                t.image
            ).setOrigin(0, 0).setDisplaySize(iconSize, iconSize).setAlpha(0.85).setScrollFactor(0);
            this.trinketIcons.push(icon);
        });

        if (hasMore) {
            const dotsY = startY + visibleRows * rowH + 4;
            const dotsText = this.add.text(startX, dotsY, '...', {
                fontSize: '16px', fill: '#ffffff', fontFamily: 'Verdana',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0, 0).setScrollFactor(0).setInteractive({ useHandCursor: true });

            dotsText.on('pointerdown', () => {
                this._trinketExpanded = !this._trinketExpanded;
                this._updateTrinketsDisplay(this.registry.get('trinkets') || []);
            });
            this.trinketIcons.push(dotsText);
        }
    }

    _showMachinePanel(name, subtitle, price, canAfford) {
        this._hideMachinePanel();

        const panelWidth = 260;
        const panelX = this.scale.width / 2 - panelWidth / 2;
        const panelY = this.scale.height - 240;
        const contentX = panelX + 15;
        let currentY = panelY + 15;

        // Create text elements first to measure total height
        const nameText = this.add.text(contentX, currentY, name, {
            fontSize: '22px', fill: '#ffffff',
            fontFamily: '"System-ui", Courier, monospace', fontStyle: 'bold',
            wordWrap: { width: panelWidth - 30 }
        }).setScrollFactor(0).setDepth(1);
        currentY += nameText.height + 12;

        const hr1 = this.add.graphics().setScrollFactor(0).setDepth(1);
        hr1.lineStyle(1, 0xffffff, 0.8);
        hr1.lineBetween(panelX + 10, currentY, panelX + panelWidth - 10, currentY);
        currentY += 15;

        const subText = this.add.text(contentX, currentY, subtitle, {
            fontSize: '14px', fill: '#cccccc',
            fontFamily: 'Verdana', wordWrap: { width: panelWidth - 30 }
        }).setScrollFactor(0).setDepth(1);
        currentY += subText.height + 15;

        const hr2 = this.add.graphics().setScrollFactor(0).setDepth(1);
        hr2.lineStyle(1, 0xffffff, 0.8);
        hr2.lineBetween(panelX + 10, currentY, panelX + panelWidth - 10, currentY);
        currentY += 20;

        const priceText = this.add.text(contentX, currentY, `Puntos: ${price}`, {
            fontSize: '18px', fill: canAfford ? '#ffffff' : '#ff0000',
            fontFamily: '"System-ui", Courier, monospace', fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(1);
        currentY += priceText.height;

        let hintText = null;
        if (canAfford) {
            hintText = this.add.text(contentX, currentY + 4, '[F] Comprar', {
                fontSize: '12px', fill: '#aaaaaa', fontFamily: 'Verdana'
            }).setScrollFactor(0).setDepth(1);
            currentY += hintText.height + 4;
        }
        currentY += 15;

        // Now draw background with exact measured height
        const panelH = currentY - panelY;
        const bg = this.add.graphics().setScrollFactor(0).setDepth(0);
        bg.fillStyle(0x000000, 0.4);
        bg.fillRect(panelX, panelY, panelWidth, panelH);
        bg.lineStyle(2, 0xffffff, 1);
        bg.strokeRect(panelX, panelY, panelWidth, panelH);

        this._machinePanelElements.push(bg, nameText, hr1, subText, hr2, priceText);
        if (hintText) this._machinePanelElements.push(hintText);
    }

    _hideMachinePanel() {
        this._machinePanelElements.forEach(el => el.destroy());
        this._machinePanelElements = [];
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
            fontFamily: 'Verdana',
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
                fontFamily: 'Verdana',
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
        let priceColor = canAfford ? '#ffee00' : '#ff0000';

        if (isPurchased) {
            priceTextContent = 'objeto equipado';
            priceColor = '#ffffff';
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
            const buyHint = this.add.text(contentX, currentY + priceText.height + 4, '[F] Comprar', {
                fontSize: '12px',
                fill: '#aaaaaa',
                fontFamily: 'Verdana'
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

    _getCurrentUltiIconKey() {
        if (!this._weaponIconKeys || this._currentWeaponPlayerIndex == null) return null;
        const si = this._playerToSortedIndex?.[this._currentWeaponPlayerIndex] ?? this._currentWeaponPlayerIndex;
        return this._weaponIconKeys[si] ?? null;
    }

    _startUltiCooldownUI(startProgress, duration) {
        const iconKey = this._getCurrentUltiIconKey();
        const disabledKey = this._ultiDisabledKeyMap?.[iconKey];
        if (this._ultiButton && disabledKey) this._ultiButton.setTexture(disabledKey);
        if (this._ultiCooldownBar) this._ultiCooldownBar.setVisible(true);
        this._ultiCooldownFill = { value: startProgress };
        this._redrawUltiBar();
        this._ultiCooldownTween = this.tweens.add({
            targets: this._ultiCooldownFill,
            value: 1,
            duration,
            ease: 'Linear',
            onUpdate: () => this._redrawUltiBar(),
            onComplete: () => {
                if (iconKey) {
                    delete this._ultiCooldownState?.[iconKey];
                    this._stopUltiCooldownUI(iconKey);
                }
            }
        });
    }

    _stopUltiCooldownUI(iconKey) {
        if (this._ultiCooldownTween) { this._ultiCooldownTween.stop(); this._ultiCooldownTween = null; }
        const enabledKey = this._ultiKeyMap?.[iconKey];
        if (this._ultiButton && enabledKey) this._ultiButton.setTexture(enabledKey);
        if (this._ultiCooldownBar) this._ultiCooldownBar.setVisible(false);
    }

    _redrawDashBar() {
        if (!this._dashCooldownBar || !this._dashBarBounds) return;
        const { x, y, w, h } = this._dashBarBounds;
        this._dashCooldownBar.clear();
        this._dashCooldownBar.fillStyle(0x222222, 0.8);
        this._dashCooldownBar.fillRect(x, y, w, h);
        const fillH = h * this._dashCooldownFill.value;
        this._dashCooldownBar.fillStyle(0x00ccff, 1);
        this._dashCooldownBar.fillRect(x, y + h - fillH, w, fillH);
    }

    _redrawUltiBar() {
        if (!this._ultiCooldownBar || !this._ultiBarBounds) return;
        const { x, y, w, h } = this._ultiBarBounds;
        this._ultiCooldownBar.clear();
        this._ultiCooldownBar.fillStyle(0x222222, 0.8);
        this._ultiCooldownBar.fillRect(x, y, w, h);
        const fillH = h * this._ultiCooldownFill.value;
        this._ultiCooldownBar.fillStyle(0xff8800, 1);
        this._ultiCooldownBar.fillRect(x, y + h - fillH, w, fillH);
    }

    _spawnScorePopup(delta) {
        if (!this.scoreText.visible) return;

        const label = (delta > 0 ? '+' : '') + delta;
        const color = delta > 0 ? '#ffee00' : '#ff3333';

        const x = this.scoreText.x - 80;
        const y = this.scoreText.y;
        const goUp = this._scorePopupIndex % 2 === 0;
        this._scorePopupIndex++;

        const txt = this.add.text(x, y, label, {
            fontSize: '18px',
            fill: color,
            fontFamily: 'Verdana',
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(5).setAlpha(1);

        this.tweens.add({
            targets: txt,
            x: x - 40,
            y: y + (goUp ? -14 : 14),
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });
    }

    _showMachinePanel(name, subtitle, price, canAfford, hasShield) {
        this._hideMachinePanel();

        const panelWidth = 260;
        const panelX = this.scale.width / 2 - panelWidth / 2;
        const padX = panelX + 15;
        const padTop = 15;
        const padBottom = 15;

        // — Contenido primero para medir altura real —
        let currentY = padTop; // relativo al panel; se convierte a pantalla al posicionar

        const nameText = this.add.text(0, 0, name, {
            fontSize: '22px', fill: '#ffffff',
            fontFamily: '"System-ui", Courier, monospace', fontStyle: 'bold',
            wordWrap: { width: panelWidth - 30 }
        }).setDepth(1);
        currentY += nameText.height + 12;

        currentY += 15; // hr1

        const descText = this.add.text(0, 0, subtitle, {
            fontSize: '14px', fill: '#cccccc',
            fontFamily: 'Verdana', wordWrap: { width: panelWidth - 30 }
        }).setDepth(1);
        currentY += descText.height + 15;

        currentY += 20; // hr2

        let priceContent = `Puntos: ${price}`;
        let priceColor = canAfford ? '#ffee00' : '#ff0000';
        if (hasShield) { priceContent = typeof hasShield === 'string' ? hasShield : 'Escudo activo'; priceColor = '#ffffff'; }

        const priceText = this.add.text(0, 0, priceContent, {
            fontSize: '18px', fill: priceColor,
            fontFamily: '"System-ui", Courier, monospace', fontStyle: 'bold'
        }).setDepth(1);
        currentY += priceText.height;

        let buyHint = null;
        if (canAfford && !hasShield) {
            buyHint = this.add.text(0, 0, '[F] Comprar', {
                fontSize: '12px', fill: '#aaaaaa', fontFamily: 'Verdana'
            }).setDepth(1);
            currentY += 4 + buyHint.height;
        }

        const panelHeight = currentY + padBottom;
        const panelY = this.scale.height - panelHeight - 20;

        // — Fondo y borde con altura exacta —
        const graphics = this.add.graphics().setDepth(0);
        graphics.fillStyle(0x000000, 0.4).fillRect(panelX, panelY, panelWidth, panelHeight);
        graphics.lineStyle(2, 0xffffff, 1).strokeRect(panelX, panelY, panelWidth, panelHeight);

        // — Posicionar contenido —
        let y = panelY + padTop;

        nameText.setPosition(padX, y);
        y += nameText.height + 12;

        const hr1 = this.add.graphics().setDepth(1);
        hr1.lineStyle(1, 0xffffff, 0.8).lineBetween(panelX + 10, y, panelX + panelWidth - 10, y);
        y += 15;

        descText.setPosition(padX, y);
        y += descText.height + 15;

        const hr2 = this.add.graphics().setDepth(1);
        hr2.lineStyle(1, 0xffffff, 0.8).lineBetween(panelX + 10, y, panelX + panelWidth - 10, y);
        y += 20;

        priceText.setPosition(padX, y);
        y += priceText.height + 4;

        if (buyHint) buyHint.setPosition(padX, y);

        this._machinePanelElements.push(graphics, nameText, hr1, descText, hr2, priceText);
        if (buyHint) this._machinePanelElements.push(buyHint);
    }

    _hideMachinePanel() {
        this._machinePanelElements.forEach(el => el.destroy());
        this._machinePanelElements = [];
    }

    _addActivePowerup(cfg) {
        // Si el mismo powerup ya está activo, refrescarlo
        const existingIdx = this._activePowerups.findIndex(p => p.id === cfg.id);
        if (existingIdx !== -1) {
            const old = this._activePowerups[existingIdx];
            old.tween?.stop();
            old.icon?.destroy();
            old.bar?.destroy();
            this._activePowerups.splice(existingIdx, 1);
        }

        this._activePowerups.push({ id: cfg.id, cfg, fill: { value: 1 }, duration: cfg.duration });
        this._rebuildActivePowerups();
    }

    _rebuildActivePowerups() {
        // Parar tweens y destruir visuales actuales
        for (const entry of this._activePowerups) {
            entry.tween?.stop();
            entry.icon?.destroy();
            entry.bar?.destroy();
            entry.icon = null;
            entry.bar = null;
            entry.tween = null;
        }

        // Posición: debajo del panel de vida
        // hpPadX=80, hpPadY=8, hpPanelH≈56 → powerups empiezan en y≈70
        const iconGap = 10;
        const barH    = 4;

        // Calcular ancho real del primer icono para centrar (todos comparten el mismo spritesheet)
        const sampleFrame = this.textures.getFrame(this._activePowerups[0]?.cfg.hudIcon);
        const iconW = sampleFrame ? sampleFrame.realWidth : 32;

        const totalW  = this._activePowerups.length * (iconW + iconGap) - iconGap;
        const startX  = this.scale.width / 2 - totalW / 2;
        const startY  = this.scale.height - 60;

        for (let i = 0; i < this._activePowerups.length; i++) {
            const entry = this._activePowerups[i];
            const x = startX + i * (iconW + iconGap);

            entry.icon = this.add.image(x, startY, entry.cfg.hudIcon)
                .setScrollFactor(0).setDepth(200).setScale(1).setOrigin(0, 0);

            const fw = this.textures.getFrame(entry.cfg.hudIcon)?.realWidth ?? iconW;
            entry._bx = x;
            entry._by = startY + fw + 4;
            entry._bw = fw;
            entry._bh = barH;

            entry.bar = this.add.graphics().setScrollFactor(0).setDepth(200);
            this._redrawPowerupBar(entry);

            const remaining = entry.fill.value * entry.duration;
            entry.tween = this.tweens.add({
                targets: entry.fill,
                value: 0,
                duration: remaining,
                ease: 'Linear',
                onUpdate: () => this._redrawPowerupBar(entry),
                onComplete: () => {
                    entry.icon?.destroy();
                    entry.bar?.destroy();
                    this._activePowerups = this._activePowerups.filter(p => p !== entry);
                    this._rebuildActivePowerups();
                }
            });
        }
    }

    _redrawPowerupBar(entry) {
        if (!entry.bar) return;
        const { _bx: x, _by: y, _bw: w, _bh: h } = entry;
        entry.bar.clear();
        entry.bar.fillStyle(0x333333, 0.8);
        entry.bar.fillRect(x, y, w, h);
        entry.bar.fillStyle(0xffffff, 1);
        entry.bar.fillRect(x, y, w * entry.fill.value, h);
    }

    _launchPause(callerKey) {
        if (this.scene.isActive('pause_menu')) return;
        this.tweens.pauseAll();
        this.scene.launch('pause_menu', { callerKey });
        this.scene.get('pause_menu').events.once('shutdown', () => {
            this.tweens.resumeAll();
        });
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