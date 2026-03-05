import Phaser from 'phaser';

export default class WaveManager {
    constructor(scene, spawner) {
        this.scene = scene;
        this.spawner = spawner;
        this.currentWave = 0;
        this.enemies = 0;
        this.wavesData = scene.cache.json.get('data').waves;
        this.waveDelay = 3000;
    }

    startNextWave() {
        // si he llegado a la última oleada salgo
        if (this.currentWave >= this.wavesData.length) return;

        this.scene.events.emit('nextWave', this.currentWave + 1);
        //console.log("Iniciando la oleada " + (this.currentWave + 1));

        // pillo los datos de la wave 'currentWave'
        const wave = this.wavesData[this.currentWave];
        // para cada enemigo del json lo spawneo
        wave.enemies.forEach(enemyType => {
            this.enemies += enemyType.count;
            this.spawner.spawnMultiple(enemyType);
        });

        this.scene.events.emit('enemyDead', this.enemies);

        // actualizo datos de esta oleada
        this.waveDelay = wave.delay;
        this.currentWave++;
        
    }

    enemyDies() {
        // cuando un enemigo muera compruebo si he eliminado a todos y sigo con la siguiente oleada
        this.enemies--;

        this.scene.events.emit('enemyDead', this.enemies);

        if (this.enemies <= 0) {
        this.scene.events.emit('finishWave', this.waveDelay);
            this.scene.time.delayedCall(this.waveDelay, () => this.startNextWave());
        }
    }
}