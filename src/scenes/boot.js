import Phaser from 'phaser'

import platform from '../../assets/sprites/platform.png'
import base from '../../assets/sprites/base.png'
import player from '../../assets/sprites/player.png'
import titleScreen from '../../assets/sprites/title-screen/lopk.png'
import laudeSpritesheet from '../../assets/animations/laude/sprite.png'
import laudeAtlas from '../../assets/animations/laude/atlas.json'
import start from '../../assets/sprites/title-screen/start-text.png'
import startJSON from '../../assets/sprites/title-screen/start-selected-atlas.json'
import options from '../../assets/sprites/title-screen/options-text.png'
import optionsJSON from '../../assets/sprites/title-screen/options-selected-atlas.json'
import optionsSelected from '../../assets/sprites/title-screen/options-selected-sheet.png'
import startSelected from '../../assets/sprites/title-screen/start-selected-sheet.png'
import selectionPick from '../../assets/sprites/title-screen/selection-pick.png'
import deathScreen from '../../assets/sprites/title-screen/death-screen.png'
import enemyIdle from '../../assets/animations/basic-enemy/Idle.png'
import enemyIdleJSON from '../../assets/animations/basic-enemy/enemy_idle_atlas.json'
import enemyWalk from '../../assets/animations/basic-enemy/move.png'
import enemyWalkJSON from '../../assets/animations/basic-enemy/enemy_walk_atlas.json'
import enemyHit from '../../assets/animations/basic-enemy/enemy_hit.png'
import enemyHitJSON from '../../assets/animations/basic-enemy/enemy_hit_atlas.json'
import HUDhealthBorder from '../../assets/animations/hud/health-bar/border.png'
import HUDhealthBar from '../../assets/animations/hud/health-bar/bar.png'

import city_tileset from '../../assets/map/city_tileset.png';
import city_json from '../../assets/map/ciudad-mapa.json'

// data
import playerBaseStats from '../../assets/data/playerBaseStats.json';
import shadowBaseStats from '../../assets/data/shadowBaseStats.json';
import wavesJSON from '../../assets/data/waves.json';

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
    this.load.image('title', titleScreen);
    this.load.image('options', options);
    this.load.image('selectionPick', selectionPick);
    this.load.image('city_tiles',city_tileset);
    this.load.image('death',deathScreen);
    this.load.tilemapTiledJSON('map',city_json);
    this.load.image('platform', platform);
    this.load.image('base', base);
    this.load.image('player', player);
    this.load.atlas('optionsSelected',optionsSelected,optionsJSON);
    this.load.atlas('startSelected', startSelected, startJSON);
    this.load.atlas('laude', laudeSpritesheet, laudeAtlas);
    this.load.json('laudeBaseStats', playerBaseStats);
    this.load.json('shadowBaseStats', shadowBaseStats);
    this.load.atlas('enemy_idle',enemyIdle,enemyIdleJSON);
    this.load.atlas('enemy_walk',enemyWalk,enemyWalkJSON);
    this.load.atlas('enemy_hit',enemyHit,enemyHitJSON);
    this.load.image('hud_health_border', HUDhealthBorder);
    this.load.image('hud_health_bar', HUDhealthBar);
    this.load.json('wavesJSON', wavesJSON);
  }

  /**
   * Creación de la escena. En este caso, solo cambiamos a la escena que representa el
   * nivel del juego
   */
  create() {
    this.add.image(640, 368, "title");
    this.startText = this.add.sprite(596, 490, "start");
    this.anims.create({
        key: 'startAnim',
        frames: this.anims.generateFrameNames('startSelected'), 
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'optionsAnim',
        frames: this.anims.generateFrameNames('optionsSelected'), 
        frameRate: 10,
        repeat: -1
    });

    this.select = this.add.image(405, 490, "selectionPick");
    this.select.setVisible(false);
    this.optionsText = this.add.sprite(644, 570, "options");
    this.activeOption = null;

    this.input.keyboard.on("keydown-W", () => {
      if (this.activeOption == null){
        this.activeOption=this.startText;
        this.startText.play('startAnim');
        this.select.setVisible(true);
      }else if (this.activeOption == this.optionsText) {
        this.startText.play('startAnim');
        this.optionsText.stop();
        this.optionsText.setTexture('options');
        this.activeOption = this.startText;
        this.moveSelect(this.select, this.activeOption);
      } else {
        this.startText.stop();
        this.activeOption=this.optionsText;
        this.startText.setTexture('start');
        this.optionsText.play('optionsAnim')
        this.moveSelect(this.select, this.activeOption);
      }
    });

    this.input.keyboard.on("keydown-S", () => {
      if (this.activeOption == null){
        this.activeOption=this.startText;
        this.startText.play('startAnim');
        this.select.setVisible(true);
      }else if (this.activeOption == this.optionsText) {
        this.startText.play('startAnim');
        this.optionsText.stop();
        this.optionsText.setTexture('options');
        this.activeOption = this.startText;
        this.moveSelect(this.select, this.activeOption);
      } else {
        this.startText.stop();
        this.activeOption=this.optionsText;
        this.startText.setTexture('start');
        this.optionsText.play('optionsAnim')
        this.moveSelect(this.select, this.activeOption);
      }
    });

    this.input.keyboard.on("keydown-ENTER",()=>{
      if(this.activeOption==this.startText){
        this.scene.start('level_fondo');
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

