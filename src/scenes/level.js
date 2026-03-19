import Phaser from 'phaser';
import Platform from '../game-objects/platform.js';
import Player from '../game-objects/player.js';
import Enemy from '../game-objects/enemy.js';
import actor from '../game-objects/actor.js';
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
        this.soundManager = new SoundManager(this);
        this.soundManager.addSounds({
            'movement': { key: 'movement', loop: true, loopDelay: 100 },
            'dash': { key: 'dash', volume: 10 },
            'guitar_attk': { key: 'guitar_attk', volume: 0.5 },
            'enemy_hurt': { key: 'enemy_hurt' },
            'get_hit': { key: 'get_hit' },
            'teclado_attk': { key: 'teclado_attk', volume: 0.5 },
            'bajo_attk': { key: 'bajo_attk', volume: 100000 },
            'drum_attk': { key: 'drum_attk', volume: 0.5 },
            'level1_music': { key: 'level1_music', loop: true, volume: 0.7, category: 'music' }
        })
        const playerStats = this.cache.json.get('data').playerBaseStats;
        this.player = new Player(this, 400, 400, playerStats);

        this.scene.launch('hud');

        this.spawner = new Spawner(this);

        this.waveManager = new WaveManager(this, this.spawner);
        this.scene.get('hud').events.once('hud-ready', () => this.waveManager.startNextWave());

        this.physics.add.overlap(this.player, this.spawner.pool, function(player,enemy){
            if (enemy.active && !player.invincible){
                if(!this.gettin_hit) {
                    this.soundManager.play('get_hit');
                    this.gettin_hit = true;
                    this.time.delayedCall(1000, () => { this.gettin_hit = false; }, [], this);
                }
                enemy.attack(player);
            }
        }, null, this);

        this.cameras.main.setZoom(1); // Ventana de visualización

        this.setWeaponCollision(this.player.guitar);
        this.setWeaponCollision(this.player.bajo);
        this.setWeaponCollision(this.player.drum);

    }

    setWeaponCollision(weapon) {
        for (let hurtBox of weapon.getHurtboxes()) {
            this.physics.add.overlap(hurtBox, this.spawner.pool, (hurtbox, enemy) => {
                if (!enemy.invincible) {
                    if(!this.enemy_hurt) {
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
