import Phaser from 'phaser'

import platform from '../../assets/sprites/platform.png'
import base from '../../assets/sprites/base.png'
import player from '../../assets/sprites/player.png'
import bajo from '../../assets/sprites/bajo.png'
import titleScreen from '../../assets/sprites/title-screen/lopk.png'
import laudeSpritesheet from '../../assets/animations/laude/sprite.png'
import laudeGuitarSpriteSheet from '../../assets/animations/laude/guitar-sprite.png'
import laudeDrumSpriteSheet from '../../assets/animations/laude/drum-sprite.png'
import laudeBassSpritesheet from '../../assets/animations/laude/bass-sprite.png'
import laudeAtlas from '../../assets/animations/laude/laude_atlas.json'
import laudeBassAtlas from '../../assets/animations/laude/bass-sprite.json'
import start from '../../assets/sprites/title-screen/start-text.png'
import startJSON from '../../assets/sprites/title-screen/start-selected-atlas.json'
import options from '../../assets/sprites/title-screen/options-text.png'
import optionsJSON from '../../assets/sprites/title-screen/options-selected-atlas.json'
import optionsSelected from '../../assets/sprites/title-screen/options-selected-sheet.png'
import startSelected from '../../assets/sprites/title-screen/start-selected-sheet.png'
import selectionPick from '../../assets/sprites/title-screen/selection-pick.png'
import guitarSprite from '../../assets/sprites/weapons/guitar/guitar-sprite.png'
import drumSticks from '../../assets/sprites/weapons/drum/drum-sticks.png'
import guitarIcon from '../../assets/sprites/weapons/guitar/guitar-icon.png'
import drumIcon from '../../assets/sprites/weapons/drum/drum-icon.png'
import bassSprite from '../../assets/sprites/weapons/bass/bass-sprite.png'
import bassIcon from '../../assets/sprites/weapons/bass/bass-icon.png'
import weaponSelected from '../../assets/sprites/weapons/selected-frame.png'
import weaponUnselected from '../../assets/sprites/weapons/unselected-frame.png'
import cooldownResetVisualCueSheet from '../../assets/animations/laude/CooldownResetVisualCue-Sheet.png'
import cooldownResetVisualCueJSON from '../../assets/animations/laude/CooldownResetVisualCue.json'

import deathScreen from '../../assets/sprites/title-screen/death-screen.png'
import enemyIdle from '../../assets/animations/basic-enemy/Idle.png'
import enemyIdleJSON from '../../assets/animations/basic-enemy/enemy_idle_atlas.json'
import enemyWalk from '../../assets/animations/basic-enemy/move.png'
import enemyWalkJSON from '../../assets/animations/basic-enemy/enemy_walk_atlas.json'
import enemyHit from '../../assets/animations/basic-enemy/enemy_hit.png'
import enemyHitJSON from '../../assets/animations/basic-enemy/enemy_hit_atlas.json'
import enemyDie from '../../assets/animations/basic-enemy/enemy_die.png'
import enemyDieJSON from '../../assets/animations/basic-enemy/enemy_die_atlas.json'
import HUDhealthBorder from '../../assets/animations/hud/health-bar/border.png'
import HUDhealthBar from '../../assets/animations/hud/health-bar/bar.png'
import roundNumbers from '../../assets/sprites/round-numbers/numbers.png'

//mapas
import city_tileset from '../../assets/map/rogueLike_city.png';
import city_json from '../../assets/map/city_map.json'
import tileset_grassland_grass from '../../assets/map/tileset-grassland-grass.png';
import tileset_grassland_paths from '../../assets/map/tileset-grassland-paths.png';
import tileset_grassland_props from '../../assets/map/tileset-grassland-props.png';
import tileset_grassland_water from '../../assets/map/tileset-grassland-water.png';
import level2JSON from '../../assets/map/level2.json';

// data
import data from '../../assets/data/gameConfig';

// sound-fx
import SoundManager from '../game-objects/sound-manager.js'; 
import movement from '../../assets/sounds/fx/movement-player.mp3';
import dash from '../../assets/sounds/fx/dash.mp3';
import guitar_attk from '../../assets/sounds/fx/guitar-attk.mp3';
import get_hit from '../../assets/sounds/fx/get-hit.mp3';
import enemy_hurt_fx from '../../assets/sounds/fx/enemy_hurt.mp3';
import menu_music from '../../assets/sounds/music/menu-music.mp3';
import teclado_attk from '../../assets/sounds/fx/teclado-attk.mp3';
import bajo_attk from '../../assets/sounds/fx/bajo-attk.mp3';
import drum_attk from '../../assets/sounds/fx/drum-attk.mp3';


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
    this.load.image('death', deathScreen);
    this.load.image('options', options);
    this.load.image('selectionPick', selectionPick);
    this.load.image('guitarSprite', guitarSprite);
    this.load.image('drumSticks', drumSticks);
    this.load.image('guitar-icon', guitarIcon);
    this.load.image('drum-icon', drumIcon);
    this.load.image('bass-sprite', bassSprite);
    this.load.image('bass-icon', bassIcon);
    this.load.image('weapon-selected', weaponSelected);
    this.load.image('weapon-unselected', weaponUnselected);

    this.load.image('death',deathScreen);
    this.load.tilemapTiledJSON('map',city_json);
    this.load.image('city_tiles', city_tileset);
    this.load.image('death', deathScreen);

    this.load.image('platform', platform);
    this.load.image('base', base);
    this.load.image('player', player);
    this.load.image('bajo', bajo);
    this.load.atlas('optionsSelected', optionsSelected, optionsJSON);
    this.load.atlas('startSelected', startSelected, startJSON);
    this.load.atlas('laude', laudeSpritesheet, laudeAtlas);
    this.load.atlas('laude_guitar', laudeGuitarSpriteSheet, laudeAtlas);
    this.load.atlas('laude_drum', laudeDrumSpriteSheet, laudeAtlas);
    this.load.atlas('laude_bass', laudeBassSpritesheet, laudeBassAtlas);
    this.load.atlas('cooldownResetVisualCue', cooldownResetVisualCueSheet, cooldownResetVisualCueJSON);
    this.cache.json.add('data', data);
    this.load.atlas('enemy_idle', enemyIdle, enemyIdleJSON);
    this.load.atlas('enemy_walk', enemyWalk, enemyWalkJSON);
    this.load.atlas('enemy_hit', enemyHit, enemyHitJSON);
    this.load.atlas('enemy_die', enemyDie, enemyDieJSON);
    this.load.image('hud_health_border', HUDhealthBorder);
    this.load.image('hud_health_bar', HUDhealthBar);
    this.load.spritesheet('round_numbers', roundNumbers, { frameWidth: 24, frameHeight: 32 });

    //sonidos

    this.load.audio('movement', movement);
    this.load.audio('dash', dash); 
    this.load.audio('guitar_attk', guitar_attk);
    this.load.audio('enemy_hurt', enemy_hurt_fx);
    this.load.audio('menu_music', menu_music);
    this.load.audio('get_hit', get_hit);
    this.load.audio('teclado_attk', teclado_attk);
    this.load.audio('bajo_attk', bajo_attk);
    this.load.audio('drum_attk', drum_attk);

    this.soundManager = new SoundManager(this);
    this.soundManager.addSounds({
        'menu_music': { key: 'menu_music', loop: true, category: 'music' },
    })

    //mapa
    this.load.image('city_tiles',city_tileset);
    this.load.tilemapTiledJSON('map', city_json);
    this.load.tilemapTiledJSON('level2', level2JSON);
    this.load.image('tileset_grassland_grass', tileset_grassland_grass);
    this.load.image('tileset_grassland_paths', tileset_grassland_paths);
    this.load.image('tileset_grassland_props', tileset_grassland_props);
    this.load.image('tileset_grassland_water', tileset_grassland_water);
  }

  /**
   * Creación de la escena. En este caso, solo cambiamos a la escena que representa el
   * nivel del juego
   */
  create() {
    this.soundManager.play('menu_music');
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
      if (this.activeOption == null) {
        this.activeOption = this.startText;
        this.startText.play('startAnim');
        this.select.setVisible(true);
      } else if (this.activeOption == this.optionsText) {
        this.startText.play('startAnim');
        this.optionsText.stop();
        this.optionsText.setTexture('options');
        this.activeOption = this.startText;
        this.moveSelect(this.select, this.activeOption);
      } else {
        this.startText.stop();
        this.activeOption = this.optionsText;
        this.startText.setTexture('start');
        this.optionsText.play('optionsAnim')
        this.moveSelect(this.select, this.activeOption);
      }
    });

    this.input.keyboard.on("keydown-S", () => {
      if (this.activeOption == null) {
        this.activeOption = this.startText;
        this.startText.play('startAnim');
        this.select.setVisible(true);
      } else if (this.activeOption == this.optionsText) {
        this.startText.play('startAnim');
        this.optionsText.stop();
        this.optionsText.setTexture('options');
        this.activeOption = this.startText;
        this.moveSelect(this.select, this.activeOption);
      } else {
        this.startText.stop();
        this.activeOption = this.optionsText;
        this.startText.setTexture('start');
        this.optionsText.play('optionsAnim')
        this.moveSelect(this.select, this.activeOption);
      }
    });

    this.input.keyboard.on("keydown-ENTER",()=>{
      if(this.activeOption==this.startText){
        this.soundManager.fadeOutMusic(500);
        this.time.delayedCall(500, () => {
          this.scene.start('level_2'); //esto deberia ser level_fondo, DEBUG de mati
        });
      }else if(this.activeOption==this.optionsText){
        alert("se mostraria menu de opciones: audio, brillo, etc...")
      } else {

      }
    });

  }

  moveSelect(select, active) {
    select.y = active.y;
  }
}

