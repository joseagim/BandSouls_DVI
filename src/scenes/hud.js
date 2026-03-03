import Phaser from "phaser";
import Bar from './bar';

export default class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'hud' });
    }

    create() {
        // crear la barra arriba a la izquierda
        this.healthBar = new Bar(this, 20, 20, 'hud_health_border', 'hud_health_bar');
        this.healthBar.setScale(3);
        this.healthBar.setScrollFactor(0);

        // crear el texto de info oleadas
        this.waveCounter = this.add.text(20, 80, 'Oleada X', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.remainingEnemies = this.add.text(20, 120, 'Enemigos restantes: X', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        })

        this.waitingNextWave = this.add.text(400, 150, 'La siguiente oleada comenzará en X', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        })
        this.waitingNextWave.visible = false;

        // pillamos la escena para escuchar eventos y actualizar el hud
        const mainLevel = this.scene.get('level_fondo');
        
        // evento: actualizar salud del jugador
        mainLevel.events.on('updateHealth', (player) => {
            const percentage = player.life / player.maxHP;
            this.healthBar.setValue(percentage);
        });

        // evento: actualizar número de oleada
        mainLevel.events.on('nextWave', (waveNumber) => {
            this.waveCounter.setText('Oleada ' + waveNumber);

            // efecto visual
            this.tweens.add({
                    targets: this.waveCounter,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true
            });
        })

        // evento: actualizar enemigos restantes
        mainLevel.events.on('enemyDead', (enemiesLeft) => {
            this.remainingEnemies.setText('Enemigos restantes: ' + enemiesLeft);
        })
        
        // evento: mensaje de espera para la siguiente oleada
        mainLevel.events.on('finishWave', (waveDelay) => {
            // calcular segundos
            let timeLeft = Math.floor(waveDelay / 1000);
            
            // modificar texto
            this.waitingNextWave.visible = true;
            this.waitingNextWave.setText('La siguiente oleada comenzará en ' + timeLeft);

            // metemos llamadas para cada segundo restante
            this.time.addEvent({
                delay: 1000,
                repeat: timeLeft - 1,
                callback: () => {
                    timeLeft--;
                    
                    if (timeLeft > 0) {
                        this.waitingNextWave.setText('La siguiente oleada comenzará en ' + timeLeft);
                        //console.log('Siguiente oleada en: ' + timeLeft);
                    } else {
                        // Al llegar a cero, ocultamos el mensaje
                        this.waitingNextWave.visible = false;
                    }
                },
                callbackScope: this
            });
        });

        this.events.emit('hud-ready');
    }
}