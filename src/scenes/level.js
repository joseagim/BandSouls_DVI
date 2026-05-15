import Phaser from 'phaser';
import Player from '../game-objects/player.js';
import Spawner from '../game-objects/spawner.js';
import WaveManager from '../game-objects/wave-manager.js';
import SoundManager from '../game-objects/sound-manager.js';
import Pickup from '../game-objects/pickup.js';


/**
 * Escena principal del juego. La escena se compone de una serie de plataformas 
 * sobre las que se sitúan las bases en las podrán aparecer las estrellas. 
 * El juego comienza generando aleatoriamente una base sobre la que generar una estrella. 
 * @abstract Cada vez que el jugador recoge la estrella, aparece una nueva en otra base.
 * El juego termina cuando el jugador ha recogido 10 estrellas.
 * @extends Phaser.Scene
 */
export default class Level extends Phaser.Scene {
    /**
     * Constructor de la escena
     */
    constructor(key_nombre) {
        super({ key: key_nombre });
        this.enemy_hurt
    }

    /**
     * Creación de los elementos de la escena principal de juego
     */
    create() {
        //this.stars = 10;
        this.bases = this.add.group();
        this.physics.world.setFPS(240);
        this.soundManager = new SoundManager(this);
        this.soundManager.addSounds({
            'movement': { key: 'movement', loop: true, loopDelay: 100 },
            'dash': { key: 'dash', volume: 10 },
            'guitar_attk': { key: 'guitar_attk', volume: 0.5 },
            'enemy_hurt': { key: 'enemy_hurt' },
            'get_hit': { key: 'get_hit' },
            'teclado_attk': { key: 'teclado_attk', volume: 1 },
            'bajo_attk': { key: 'bajo_attk', volume: 100000 },
            'drum_attk': { key: 'drum_attk', volume: 0.5 },
            'level1_music': { key: 'level1_music', loop: true, volume: 0.7, category: 'music' },
            'fuse_kamikaze': { key: 'fuse_kamikaze', volume: 0.5 },
            'explosion_kamikaze': { key: 'explosion_kamikaze', volume: 0.7 },
            'guitar_ability': { key: 'guitar_ability', volume: 1.0 },
            'drum_ability': { key: 'drum_ability', volume: 1.0 },
            'shop_music': { key: 'shop_music', loop: true, volume: 0.7, category: 'music' },
            'buy': { key: 'buy', volume: 1.0 },
            'shield_hit': { key: 'shield_hit', volume: 1.0 }

        })
        const playerStats = this.cache.json.get('data').playerBaseStats;
        const spawnPos = this.registry.get('spawnPosition');
        if (spawnPos) this.registry.remove('spawnPosition');
        this.player = new Player(this, spawnPos?.x ?? 400, spawnPos?.y ?? 400, playerStats);

        this.scene.launch('hud');

        const enemyPoolsData = this.cache.json.get('data').poolData;
        const enemyStats = this.cache.json.get('data').enemyStats;

        this.spawner = new Spawner(this, enemyPoolsData, enemyStats);

        this.waveManager = new WaveManager(this, this.spawner);

        const crossState = this.registry.get('levelCrossState');
        if (crossState) {
            this.registry.remove('levelCrossState');
            this._pendingCrossState = crossState;
        }

        const playerState = this.registry.get('playerState');
        if (playerState) {
            this.registry.remove('playerState');
            this._pendingPlayerState = playerState;
        }

        // Restaurar cooldowns de ulti guardados al salir de la sala anterior
        const savedCooldown = this.registry.get('ultiCooldown') || {};
        const ultiWeapons = [
            { weapon: this.player.guitar, cueColor: 0xff8800 },
            { weapon: this.player.drum,   cueColor: 0xffaa00 },
        ];
        for (const { weapon, cueColor } of ultiWeapons) {
            const remaining = savedCooldown[weapon.iconKey] || 0;
            if (remaining > 0) {
                weapon.canUseAbility = false;
                weapon._abilityTimer = this.time.delayedCall(remaining, () => {
                    weapon.canUseAbility = true;
                    weapon._abilityTimer = null;
                    this.player.showCooldownCue(cueColor);
                    this.game.events.emit('ultiReady', { weaponKey: weapon.iconKey });
                });
            }
        }

        this.scene.get('hud').events.once('hud-ready', () => {
            // Aplicar bloqueos aquí para que el HUD ya tenga el listener registrado
            this._initWeaponLocks();

            const startWave = this.getStartingWave();
            if (startWave != null) {
                this.waveManager.currentWave = startWave;
                this.waveManager.startNextWave(!!this._pendingCrossState);
            }

            if (this._pendingCrossState) {
                this._restoreCrossState(this._pendingCrossState);
                this._pendingCrossState = null;
            } else if (this._pendingPlayerState) {
                this._restorePlayerState(this._pendingPlayerState);
                this._pendingPlayerState = null;
            }

            for (const { weapon } of ultiWeapons) {
                if (!weapon.canUseAbility && weapon._abilityTimer) {
                    this.game.events.emit('ultiStart', {
                        weaponKey: weapon.iconKey,
                        cooldown: weapon._abilityTimer.getRemaining(),
                    });
                } else {
                    // Limpia cualquier estado fantasma del HUD para armas listas
                    this.game.events.emit('ultiReady', { weaponKey: weapon.iconKey });
                }
            }
        });

        // Colisión: proyectiles del boss → jugador
        // Nos suscribimos al evento que emite EnemyBeethoven al spawnearse
        // para registrar el overlap con su pool de proyectiles.
        const beethovenHandler = (boss) => {
            this.physics.add.overlap(
                this.player,
                boss.projectilePool.physicsGroup,
                (player, projectile) => {
                    if (!player.invincible && projectile.active) {
                        player.getDamage(projectile.damage, projectile.x, projectile.y);
                    }
                },
                null, this
            );
            // No zoom animation: the boss scene handles camera setup independently
        };

        const bossDefeatedHandler = () => {
            // No zoom animation on boss defeat
        };

        this.game.events.on('beethovenSpawned', beethovenHandler);
        this.game.events.on('bossDefeated', bossDefeatedHandler);

        this.physics.add.overlap(this.player, this.spawner.PhysicsGroup(), function (player, enemy) {
            if (enemy.active && !player.invincible) {
                enemy.attackOnContact(player);
            }
        }, null, this);

        // Colisión física entre enemigos (evita amontonamiento)
        this.physics.add.collider(
            this.spawner.PhysicsGroup(),
            this.spawner.PhysicsGroup(),
            null,
            (a, b) => a.active && !a.isDead && b.active && !b.isDead,
            this
        );

        // Colisión física jugador-enemigo (el jugador los empuja; desactivada durante el dash)
        this.physics.add.collider(
            this.player,
            this.spawner.PhysicsGroup(),
            null,
            (player, enemy) => !player.invincible && enemy.active && !enemy.isDead,
            this
        );

        // Grupo de pickups y overlap con el jugador
        this.pickupGroup = this.physics.add.group();
        this.physics.add.overlap(this.player, this.pickupGroup, (player, pickup) => {
            pickup.collect(player);
        }, null, this);

        this.cameras.main.setZoom(1.5); // Ventana de visualización

        this.setWeaponCollision(this.player.guitar);
        this.setWeaponCollision(this.player.bajo);
        this.setWeaponCollision(this.player.drum);
        this.setWeaponCollision(this.player.teclado);

        const weaponReplacedHandler = (newWeapon) => {
            this.setWeaponCollision(newWeapon);
        };
        this.game.events.on('weaponReplaced', weaponReplacedHandler);

        this.events.once('shutdown', () => {
            this.game.events.off('beethovenSpawned', beethovenHandler);
            this.game.events.off('bossDefeated', bossDefeatedHandler);
            this.game.events.off('weaponReplaced', weaponReplacedHandler);
        });

    }

    getStartingWave() {
        return 0;
    }

    _restorePlayerState(state) {
        this.player.life = state.life;
        this.player.updateHealth();

        if (state.hasShield && state.shieldHP > 0) {
            this.player.activateShield();
            this.player.shieldHP = state.shieldHP;
            this.player.updateHealth();
        }

        if (state.weapons) {
            this.player.restoreWeaponUpgrades(state.weapons);
        }

        if (state.currentWeaponIndex != null) {
            this.player.gunManager.currentIndex = state.currentWeaponIndex;
            this.player.gunManager._updateUI();
        }
    }

    _restoreCrossState(state) {
        this._restorePlayerState(state);

        if (state.remainingEnemies) {
            let extra = 0;
            for (const [type, count] of Object.entries(state.remainingEnemies)) {
                if (count > 0) {
                    extra += count;
                    this.spawner.spawnMultiple({ type, count, spawnDelay: 500 });
                }
            }
            if (extra > 0) {
                this.waveManager.enemies += extra;
                this.game.events.emit('enemyDead', this.waveManager.enemies);
            }
        }
    }

    enemyDies(enemy) {
        if (enemy.life <= 0 || enemy.exploded) {
            this.waveManager.enemyDies();
            // Sumar puntos por matar al enemigo
            const multiplier = this.player.scoreMultiplier ?? 1;
            const newScore = (this.registry.get('score') || 0) + (100 * multiplier);
            this.registry.set('score', newScore);
            this.events.emit('updateScore', newScore);
            this._tryDropPickup(enemy);
        }
    }

    _initWeaponLocks() {
        const cfg = this.cache.json.get('data').pickupConfig;
        if (!cfg) return;

        // Bloquear armas según config
        for (const slot of (cfg.lockedWeapons ?? [])) {
            const idx = cfg.weaponSlots[slot];
            if (idx !== undefined) this.player.gunManager.lockWeapon(idx);
        }

        // Re-desbloquear las que el jugador ya tenía de niveles anteriores
        const unlocked = this.registry.get('unlockedWeapons') || [];
        for (const slot of unlocked) {
            const idx = cfg.weaponSlots[slot];
            if (idx !== undefined) this.player.gunManager.unlockWeapon(idx);
        }
    }

    _tryDropPickup(enemy) {
        const cfg = this.cache.json.get('data').pickupConfig;
        if (!cfg?.dropTables) return;

        const table = cfg.dropTables[enemy.tag];
        if (!table) return;

        for (const entry of table) {
            if (Math.random() < entry.chance) {
                let pickupCfg = { ...entry };

                if (pickupCfg.pickupType === 'powerup') {
                    const pool = cfg.powerups;
                    const chosen = entry.id === 'random'
                        ? pool[Math.floor(Math.random() * pool.length)]
                        : pool.find(p => p.id === entry.id);
                    if (chosen) pickupCfg = { ...pickupCfg, ...chosen };
                }

                const pickup = new Pickup(this, enemy.x, enemy.y, pickupCfg);
                this.pickupGroup.add(pickup);
                break;
            }
        }
    }

    setWeaponCollision(weapon) {
        for (let hurtBox of weapon.getHurtboxes()) {
            this.physics.add.overlap(hurtBox, this.spawner.PhysicsGroup(), (hurtbox, enemy) => {
                if (!enemy.invincible) {
                    if (!this.enemy_hurt) {
                        this.soundManager.play('enemy_hurt');
                        this.enemy_hurt = true;
                        this.time.delayedCall(500, () => { this.enemy_hurt = false; }, [], this);
                    }
                    //this.soundManager.playWithPitch('enemy_hurt');
                    weapon.attack(enemy, this.player.attackMod, hurtbox);
                }
            }, null, this);
        }
    }
}
