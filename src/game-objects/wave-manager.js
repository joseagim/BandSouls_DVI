import Phaser from 'phaser';

export default class WaveManager {
    constructor(scene, spawner) {
        this.scene = scene;
        this.spawner = spawner;
        this.currentWave = 0;
        this.enemies = 0;
        this.wavesData = scene.cache.json.get('data').waves;
        this.shopWaves = scene.cache.json.get('data').shopWaves ?? [];
        this.waveDelay = 3000;
    }

    startNextWave() {
        // si he llegado a la última oleada salgo
        if (this.currentWave >= this.wavesData.length) return;

        this.scene.game.events.emit('nextWave', this.currentWave + 1);

        // pillo los datos de la wave 'currentWave'
        const wave = this.wavesData[this.currentWave];
        // para cada enemigo del json lo spawneo
        const speedMult    = wave.speedMult    ?? 1;
        const cooldownMult = wave.cooldownMult ?? 1;
        wave.enemies.forEach(enemyType => {
            this.enemies += enemyType.count;
            this.spawner.spawnMultiple(enemyType, speedMult, cooldownMult);
        });

        this.scene.game.events.emit('enemyDead', this.enemies);

        // actualizo datos de esta oleada
        this.waveDelay = wave.delay;
        this.currentWave++;

    }

    enemyDies() {
        // Guardia contra doble llamada: la física a 120fps puede disparar
        // el callback de overlap 2 veces por frame de render para el mismo
        // par arma-enemigo. Sin esta guardia, la siguiente oleada se inicia
        // dos veces, generando dos instancias del boss simultáneas.
        if (this.enemies <= 0) return;

        // cuando un enemigo muera compruebo si he eliminado a todos y sigo con la siguiente oleada
        this.enemies--;

        this.scene.game.events.emit('enemyDead', this.enemies);

        if (this.enemies <= 0) {
            this.scene.game.events.emit('finishWave', this.waveDelay);

            // Si era la última oleada
            if (this.currentWave >= this.wavesData.length) {
                this.scene.game.events.emit('allWavesComplete');
            } else if (this.shopWaves.includes(this.currentWave)) {
                this.scene.game.events.emit('shopTime', this.currentWave);
            } else {
                this.scene.time.delayedCall(this.waveDelay, () => this.startNextWave());
            }
        }
    }
}