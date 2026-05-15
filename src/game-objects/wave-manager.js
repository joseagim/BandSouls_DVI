import Phaser from 'phaser';

export default class WaveManager {
    constructor(scene, spawner) {
        this.scene = scene;
        this.spawner = spawner;
        this.currentWave = 0;
        this.enemies = 0;
        this.wavesData = scene.cache.json.get('data').waves;
        this.shopWaves = scene.cache.json.get('data').shopWaves ?? [];
        this.nextLevelWaves = scene.cache.json.get('data').nextLevelWaves ?? [];
        this.waveDelay = 3000;
    }

    startNextWave(skipSpawn = false) {
        // si he llegado a la última oleada salgo
        if (this.currentWave >= this.wavesData.length) return;

        this.scene.game.events.emit('nextWave', this.currentWave + 1);

        // pillo los datos de la wave 'currentWave'
        const wave = this.wavesData[this.currentWave];
        const speedMult    = wave.speedMult    ?? 1;
        const cooldownMult = wave.cooldownMult ?? 1;
        if (!skipSpawn) {
            wave.enemies.forEach(enemyType => {
                this.enemies += enemyType.count;
                this.spawner.spawnMultiple(enemyType, speedMult, cooldownMult);
            });
        }

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
            // Si era la última oleada
            if (this.currentWave >= this.wavesData.length) {
                this.scene.game.events.emit('finishWave', this.waveDelay);
                this.scene.game.events.emit('allWavesComplete');
            } else if (this.nextLevelWaves.some(e => e.wave === this.currentWave)) {
                // Sin countdown: emitimos el objeto completo para que la escena sepa a dónde ir
                const entry = this.nextLevelWaves.find(e => e.wave === this.currentWave);
                this.scene.game.events.emit('nextLevelTime', entry);
            } else if (this.shopWaves.includes(this.currentWave)) {
                this.scene.game.events.emit('finishWave', this.waveDelay);
                this.scene.game.events.emit('shopTime', this.currentWave);
                this.scene.time.delayedCall(this.waveDelay, () => this.startNextWave());
            } else {
                this.scene.game.events.emit('finishWave', this.waveDelay);
                this.scene.time.delayedCall(this.waveDelay, () => this.startNextWave());
            }
        }
    }
}