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
import selectionPick from '../../assets/sprites/title-screen/selection-pick.png'
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
    this.load.image('options', options);
    this.load.image('startSelected', startSelected);
    this.load.image('optionsSelected', optionsSelected);
    this.load.image('selectionPick', selectionPick);
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
    this.add.rectangle(640, 368, ancho, alto, 0xffffffff);
    this.startText = this.add.image(596, 490, "start");
    this.select = this.add.image(405, 490, "selectionPick");
    this.select.setVisible(false);
    this.optionsText = this.add.image(644, 570, "options");
    this.activeOption = null;

    this.input.keyboard.on("keydown-W", () => {
      if (this.activeOption == null){
        this.activeOption=this.startText;
        this.select.setVisible(true);
      }else if (this.activeOption == this.optionsText) {
        this.activeOption = this.startText;
        this.moveSelect(this.select, this.activeOption);
      } else {
        this.activeOption=this.optionsText;
        this.moveSelect(this.select, this.activeOption);
      }
    });

    this.input.keyboard.on("keydown-S", () => {
      if (this.activeOption == null){
        this.activeOption=this.startText;
        this.select.setVisible(true);
      }else if (this.activeOption == this.optionsText) {
        this.activeOption = this.startText;
        this.moveSelect(this.select, this.activeOption);
      } else {
        this.activeOption=this.optionsText;
        this.moveSelect(this.select, this.activeOption);
      }
    });

    this.input.keyboard.on("keydown-ENTER",()=>{
      if(this.activeOption==this.startText){
        this.scene.start('level');ss
      }else if(this.activeOption==this.optionsText){
        alert("se mostraria menu de opciones: audio, brillo, etc...")
      }else{

      }
    });

  }

  moveSelect(select, active) {
    select.y = active.y;
  }
}

