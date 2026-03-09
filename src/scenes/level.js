import Phaser from 'phaser';
import Platform from '../game-objects/platform.js';
import Player from '../game-objects/player.js';
import Enemy from '../game-objects/enemy.js';
import actor from '../game-objects/actor.js';
import Spawner from '../game-objects/spawner.js';
import WaveManager from '../game-objects/wave-manager.js';


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
    }

    /**
     * Creación de los elementos de la escena principal de juego
     */
    create() {
        //this.stars = 10;
        this.bases = this.add.group();

        const playerStats = this.cache.json.get('data').playerBaseStats;
        this.player = new Player(this, 400, 400, playerStats);

        this.scene.launch('hud');

        this.spawner = new Spawner(this);

        this.waveManager = new WaveManager(this, this.spawner);
        this.scene.get('hud').events.once('hud-ready', () => this.waveManager.startNextWave());

        this.physics.add.overlap(this.player, this.spawner.pool, function (player, enemy) {
            if (enemy.active && !player.invincible) {
                enemy.attack(player);
            }
        }, null, this);

        this.setWeaponCollision(this.player.guitar);
        this.setWeaponCollision(this.player.bajo);// para que funcione el bajo de momento

    }

    setWeaponCollision(weapon) {
        for (let hurtBox of weapon.getHurtboxes()) {
            this.physics.add.overlap(hurtBox, this.spawner.pool, (hurtbox, enemy) => {
                if (!enemy.invincible) {
                    weapon.attack(enemy, this.player.attackMod);
                    if (enemy.life <= 0) this.waveManager.enemyDies();
                }
            }, null, this);
        }
    }
}
