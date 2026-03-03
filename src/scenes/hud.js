import Phaser from "phaser";
import Bar from './bar';

export default class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'hud' });
    }

    create() {
        // Creamos la barra de vida en la esquina superior izquierda
        this.healthBar = new Bar(this, 20, 20, 'hud_health_border', 'hud_health_bar');
        this.healthBar.setScale(3);
        this.healthBar.setScrollFactor(0);
        // Escuchamos eventos del juego para actualizar la barra
        const mainLevel = this.scene.get('level_fondo');
        
        // Cuando el jugador cambie su vida, el HUD reacciona
        mainLevel.events.on('updateHealth', (player) => {
            const isAlive = player.current > 0;
            if(!isAlive){
              this.scene.start('end');
            }else{
            const percentage = player.current / player.max;
            this.healthBar.setValue(percentage);
            }
        });
    }
}