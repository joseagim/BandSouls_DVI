import Phaser from 'phaser';
import Player from '../game-objects/player.js';
import Spawner from '../game-objects/spawner.js';
import WaveManager from '../game-objects/wave-manager.js';
import SoundManager from '../game-objects/sound-manager.js';


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
        this.gettin_hit = false;
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
            'explosion_kamikaze': { key: 'explosion_kamikaze', volume: 0.7 }
        })
        const playerStats = this.cache.json.get('data').playerBaseStats;
        this.player = new Player(this, 400, 400, playerStats);

        this.scene.launch('hud');

        const enemyPoolsData = this.cache.json.get('data').poolData;
        const enemyStats = this.cache.json.get('data').enemyStats;

        this.spawner = new Spawner(this, enemyPoolsData, enemyStats);

        this.waveManager = new WaveManager(this, this.spawner);
        this.scene.get('hud').events.once('hud-ready', () => this.waveManager.startNextWave());

        // Colisión: proyectiles del boss → jugador
        // Nos suscribimos al evento que emite EnemyBeethoven al spawnearse
        // para registrar el overlap con su pool de proyectiles.
        this.game.events.on('beethovenSpawned', (boss) => {
            this.physics.add.overlap(
                this.player,
                boss.projectilePool.physicsGroup,
                (player, projectile) => {
                    if (!player.invincible && projectile.active) {
                        if (!this.gettin_hit) {
                            this.soundManager.play('get_hit');
                            this.gettin_hit = true;
                            this.time.delayedCall(1000, () => { this.gettin_hit = false; }, [], this);
                        }
                        player.getDamage(projectile.damage);
                    }
                },
                null, this
            );
        });

        this.physics.add.overlap(this.player, this.spawner.PhysicsGroup(), function (player, enemy) {
            if (enemy.active && !player.invincible) {
                if (!this.gettin_hit) {
                    this.soundManager.play('get_hit');
                    this.gettin_hit = true;
                    this.time.delayedCall(1000, () => { this.gettin_hit = false; }, [], this);
                }
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

        this.cameras.main.setZoom(1); // Ventana de visualización

        this.setWeaponCollision(this.player.guitar);
        this.setWeaponCollision(this.player.bajo);
        this.setWeaponCollision(this.player.drum);
        this.setWeaponCollision(this.player.teclado);

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
                    if (enemy.life <= 0) {
                        this.waveManager.enemyDies();
                        // Sumar puntos por matar al enemigo
                        const newScore = (this.registry.get('score') || 0) + 100;
                        this.registry.set('score', newScore);
                        this.events.emit('updateScore', newScore);
                    }
                }
            }, null, this);
        }
    }
}
