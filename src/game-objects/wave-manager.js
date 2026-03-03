import Phaser from 'phaser';

export default class WaveManager {
    constructor(scene, spawner) {
        this.scene = scene;
        this.spawner = spawner;
        this.currentWave = 0;
        this.enemies = 0;
        this.wavesData = scene.cache.json.get('wavesJSON').waves;
        this.waveDelay = 3000;
    }

    startNextWave() {
        // si he llegado a la última oleada salgo
        if (this.currentWave >= this.wavesData.length) return;

        console.log("Iniciando la oleada " + (this.currentWave + 1));

        // pillo los datos de la wave 'currentWave'
        const wave = this.wavesData[this.currentWave];
        // para cada enemigo del json lo spawneo
        wave.enemies.forEach(enemyType => {
            this.enemies += enemyType.count;
            this.spawner.spawnMultiple(enemyType);
        });
        // actualizo datos de esta oleada
        this.waveDelay = wave.delay;
        this.currentWave++;

        console.log("Enemigos restantes: " + this.enemies);

    }

    enemyDies() {
        // cuando un enemigo muera compruebo si he eliminado a todos y sigo con la siguiente oleada
        this.enemies--;

        console.log("Enemigos restantes: " + this.enemies);

        if (this.enemies <= 0) {
            console.log("La oleada ha terminado. Esperando " + this.waveDelay / 1000 + " segundos");
            this.scene.time.delayedCall(this.waveDelay, () => this.startNextWave());
        }
    }
}