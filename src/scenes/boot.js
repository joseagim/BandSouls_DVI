import Phaser from 'phaser'

import platform from '../../assets/sprites/platform.png'
import base from '../../assets/sprites/base.png'
import player from '../../assets/sprites/player.png'
import laudeSpritesheet from '../../assets/animations/laude/sprite.png'
import laudeAtlas from '../../assets/animations/laude/atlas.json'
import start from '../../assets/sprites/title-screen/start-text.png'
import options from '../../assets/sprites/title-screen/options-text.png'
import optionsSelected from '../../assets/sprites/title-screen/options-selected.png'
import startSelected from '../../assets/sprites/title-screen/start-selected.png'
import enemyIdle from '../../assets/animations/basic-enemy/Idle.png'
import enemyIdleJSON from '../../assets/animations/basic-enemy/enemy_idle_atlas.json'
import enemyWalk from '../../assets/animations/basic-enemy/move.png'
import enemyWalkJSON from '../../assets/animations/basic-enemy/enemy_walk_atlas.json'
/**
 * Escena para la precarga de los assets que se usarán en el juego.
 * Esta escena se puede mejorar añadiendo una imagen del juego y una 
 * barra de progreso de carga de los assets
 * @see {@link https://gamedevacademy.org/creating-a-preloading-screen-in-phaser-3/} como ejemplo
 * sobre cómo hacer una barra de progreso.
 */
export default class Boot extends Phaser.Scene {
  /**
   * Constructor de la escena
   */
  constructor() {
    super({ key: 'boot' });
  }

  /**
   * Carga de los assets del juego
   */
  preload() {
    // Con setPath podemos establecer el prefijo que se añadirá a todos los load que aparecen a continuación
    //this.load.setPath('assets/sprites/');
    this.load.image('start', start);
    this.load.image('options',options)

    this.load.image('platform', platform);
    this.load.image('base', base);
    this.load.image('player', player);
    this.load.atlas('laude', laudeSpritesheet, laudeAtlas);
    this.load.atlas('enemy_idle', enemyIdle, enemyIdleJSON);
    this.load.atlas('enemy_walk', enemyWalk, enemyWalkJSON)
  }

  /**
   * Creación de la escena. En este caso, solo cambiamos a la escena que representa el
   * nivel del juego
   */
  create() {
    let ancho = 960;
    let alto = 720;
    this.add.rectangle(640, 368, ancho, alto, 0xffffff);
    let startText = this.add.image(644,490,"start");
    let optionsText = this.add.image(644, 560, "options");
    let activeOption = null;
    console.log("anchura: "+startText.width);  // Ancho total del texto en píxeles
    console.log("altura: "+startText.height);
    if (activeOption == null) {

      this.input.keyboard.on("keydown-DOWN", () => {
        activeOption=startText;
      });

    } else if (activeOption == startText) {

    } else {

    }

  }
}