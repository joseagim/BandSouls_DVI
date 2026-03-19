import Phaser from 'phaser';
import Boot from './scenes/boot.js';
import End from './scenes/end.js';
import Level from './scenes/level-ataque-guitar.js';
import HUD from './scenes/hud.js';
import Level_Fondo from './scenes/level_fondo.js';
import Level2 from './scenes/level2.js';

/**
 * Inicio del juego en Phaser. Creamos el archivo de configuración del juego y creamos
 * la clase Game de Phaser, encargada de crear e iniciar el juego.
 */
let config = {
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    width: 1280,
    height: 736,
    parent: 'juego',
    scale: {
        mode: Phaser.Scale.FIT,  
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    scene: [Boot,Level_Fondo, Level2, End, HUD],
    physics: {
        default: 'arcade',
        arcade: {
            fps: 120,
            gravity: { x:0, y: 0 },
            debug: false
        }
    }
};

new Phaser.Game(config);
