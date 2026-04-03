import Phaser from 'phaser'

// title screen
import titleScreen from '../../assets/sprites/title-screen/lopk.png'
import deathScreen from '../../assets/sprites/title-screen/death-screen.png'
import start from '../../assets/sprites/title-screen/start-text.png'
import startJSON from '../../assets/sprites/title-screen/start-selected-atlas.json'
import startSelected from '../../assets/sprites/title-screen/start-selected-sheet.png'
import options from '../../assets/sprites/title-screen/options-text.png'
import optionsJSON from '../../assets/sprites/title-screen/options-selected-atlas.json'
import optionsSelected from '../../assets/sprites/title-screen/options-selected-sheet.png'
import selectionPick from '../../assets/sprites/title-screen/selection-pick.png'

// player (laude)
import laudeSpritesheet from '../../assets/animations/laude/sprite.png'
import laudeGuitarSpriteSheet from '../../assets/animations/laude/guitar-sprite.png'
import laudeDrumSpriteSheet from '../../assets/animations/laude/drum-sprite.png'
import laudeBassSpritesheet from '../../assets/animations/laude/bass-sprite.png'
import laudeKeyboardIdleSheet from '../../assets/animations/laude/keyboard-idle.png'
import laudeKeyboardAttackSheet from '../../assets/animations/laude/keyboard-attack.png'
import laudeKeyboardRunSheet from '../../assets/animations/laude/keyboard-run.png'
import laudeKeyboardIdleAtlas from '../../assets/animations/laude/keyboard-idle.json'
import laudeKeyboardAttackAtlas from '../../assets/animations/laude/keyboard-attack.json'
import laudeKeyboardRunAtlas from '../../assets/animations/laude/keyboard-run.json'
import laudeAtlas from '../../assets/animations/laude/laude_atlas.json'
import laudeBassAtlas from '../../assets/animations/laude/bass-sprite.json'
import cooldownResetVisualCueSheet from '../../assets/animations/laude/CooldownResetVisualCue-Sheet.png'
import cooldownResetVisualCueJSON from '../../assets/animations/laude/CooldownResetVisualCue.json'

// weapons
import guitarSprite from '../../assets/sprites/weapons/guitar/guitar-sprite.png'
import guitarIcon from '../../assets/sprites/weapons/guitar/guitar-icon.png'
import drumSticks from '../../assets/sprites/weapons/drum/drum-sticks.png'
import drumIcon from '../../assets/sprites/weapons/drum/drum-icon.png'
import bassSprite from '../../assets/sprites/weapons/bass/bass-sprite.png'
import bassIcon from '../../assets/sprites/weapons/bass/bass-icon.png'
import keyboardIcon from '../../assets/sprites/weapons/keyboard/keyboard-icon.png'
import keyboardProjectileSheet from '../../assets/sprites/weapons/keyboard/keyboard-projectile.png'
import keyboardProjectileAtlas from '../../assets/sprites/weapons/keyboard/keyboard-projectile.json'
import weaponSelected from '../../assets/sprites/weapons/selected-frame.png'
import weaponUnselected from '../../assets/sprites/weapons/unselected-frame.png'

// enemies - shadow
import shadowIdle from '../../assets/animations/enemy_shadow/shadow_idle.png'
import shadowIdleJSON from '../../assets/animations/enemy_shadow/shadow_idle_atlas.json'
import shadowMove from '../../assets/animations/enemy_shadow/shadow_move.png'
import shadowMoveJSON from '../../assets/animations/enemy_shadow/shadow_move_atlas.json'
import shadowHit from '../../assets/animations/enemy_shadow/shadow_hit.png'
import shadowHitJSON from '../../assets/animations/enemy_shadow/shadow_hit_atlas.json'
import shadowDie from '../../assets/animations/enemy_shadow/shadow_die.png'
import shadowDieJSON from '../../assets/animations/enemy_shadow/shadow_die_atlas.json'

// enemies - thief
import thiefIdle from '../../assets/animations/enemy_thief/thief_idle.png'
import thiefIdleJSON from '../../assets/animations/enemy_thief/thief_idle_atlas.json'
import thiefMove from '../../assets/animations/enemy_thief/thief_move.png'
import thiefMoveJSON from '../../assets/animations/enemy_thief/thief_move_atlas.json'
import thiefHit from '../../assets/animations/enemy_thief/thief_hit.png'
import thiefHitJSON from '../../assets/animations/enemy_thief/thief_hit_atlas.json'
import thiefDie from '../../assets/animations/enemy_thief/thief_die.png'
import thiefDieJSON from '../../assets/animations/enemy_thief/thief_die_atlas.json'

// boss - beethoven
import beethovenSprite from '../../assets/bosses/beethoven/beethoven.png'
import beethovenAlert from '../../assets/bosses/beethoven/alert.png'
import beethovenAttackSheet from '../../assets/bosses/beethoven/attack.png'
import beethovenAttackAtlas from '../../assets/bosses/beethoven/attack.json'
import bossPatterns from '../../assets/bosses/beethoven/bossPatterns.json'

// hud
import HUDhealthBorder from '../../assets/sprites/hud/health-bar/border.png'
import HUDhealthBar from '../../assets/sprites/hud/health-bar/bar.png'
import roundNumbers from '../../assets/sprites/hud/round-numbers.png'
import dashButton from '../../assets/sprites/hud/buttons/dash-button.png'
import dashButtonDisabled from '../../assets/sprites/hud/buttons/dash-button-disabled.png'
import guitarVibeButton from '../../assets/sprites/hud/buttons/guitar-vibe-button.png'
import guitarVibeButtonDisabled from '../../assets/sprites/hud/buttons/guitar-vibe-button-disabled.png'
import bassGrenadeButton from '../../assets/sprites/hud/buttons/bass-grenade-button.png'
import bassGrenadeButtonDisabled from '../../assets/sprites/hud/buttons/bass-grenade-button-disabled.png'
import drumSmashButton from '../../assets/sprites/hud/buttons/drum-smash-button.png'
import drumSmashButtonDisabled from '../../assets/sprites/hud/buttons/drum-smash-button-disabled.png'
import keyboardMinigunButton from '../../assets/sprites/hud/buttons/keyboard-minigun-button.png'
import keyboardMinigunButtonDisabled from '../../assets/sprites/hud/buttons/keyboard-minigun-button-disabled.png'

//mapas
import city_tileset from '../../assets/map/rogueLike_city.png';
import city_json from '../../assets/map/city_map.json'
import shop_tileset from '../../assets/map/gj.png'
import shop_json from '../../assets/map/garajefinal.json'
import portalSpritesheet from '../../assets/animations/portal/portal-spritesheet.png'
import portalJSON from '../../assets/animations/portal/portaljson.json'
import tileset_grassland_grass from '../../assets/map/tileset-grassland-grass.png';
import tileset_grassland_paths from '../../assets/map/tileset-grassland-paths.png';
import tileset_grassland_props from '../../assets/map/tileset-grassland-props.png';
import tileset_grassland_water from '../../assets/map/tileset-grassland-water.png';
import level2JSON from '../../assets/map/level2.json';

// data
import data from '../../assets/data/gameConfig';
import itemsData from '../../assets/data/items.json';

// items
import item_tubescreamer from '../../assets/sprites/items/tubescreamer.png';
import item_mask from '../../assets/sprites/items/mask.png';
import item_bumble_pick from '../../assets/sprites/items/bumble_pick.png';
import item_metronome from '../../assets/sprites/items/metronome.png';

// sound-fx
import SoundManager from '../game-objects/sound-manager.js'; 
import movement from '../../assets/sounds/fx/movement-player.mp3';
import dash from '../../assets/sounds/fx/dash.mp3';
import guitar_attk from '../../assets/sounds/fx/guitar-attk.mp3';
import get_hit from '../../assets/sounds/fx/get-hit.mp3';
import enemy_hurt_fx from '../../assets/sounds/fx/enemy_hurt.mp3';
import teclado_attk from '../../assets/sounds/fx/teclado-attk.mp3';
import bajo_attk from '../../assets/sounds/fx/bajo-attk.mp3';
import drum_attk from '../../assets/sounds/fx/drum-attk.mp3';

//musica
import menu_music from '../../assets/sounds/music/menu-music.mp3';
import level1_music from '../../assets/sounds/music/level1-music.mp3';


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
    // title screen
    this.load.image('title', titleScreen);
    this.load.image('death', deathScreen);
    this.load.image('start', start);
    this.load.atlas('startSelected', startSelected, startJSON);
    this.load.image('options', options);
    this.load.atlas('optionsSelected', optionsSelected, optionsJSON);
    this.load.image('selectionPick', selectionPick);

    // player (laude)
    this.load.atlas('laude', laudeSpritesheet, laudeAtlas);
    this.load.atlas('laude_guitar', laudeGuitarSpriteSheet, laudeAtlas);
    this.load.atlas('laude_drum', laudeDrumSpriteSheet, laudeAtlas);
    this.load.atlas('laude_bass', laudeBassSpritesheet, laudeBassAtlas);
    this.load.atlas('laude_keyboard_idle', laudeKeyboardIdleSheet, laudeKeyboardIdleAtlas);
    this.load.atlas('laude_keyboard_attack', laudeKeyboardAttackSheet, laudeKeyboardAttackAtlas);
    this.load.atlas('laude_keyboard_run', laudeKeyboardRunSheet, laudeKeyboardRunAtlas);
    this.load.atlas('cooldownResetVisualCue', cooldownResetVisualCueSheet, cooldownResetVisualCueJSON);

    // weapons
    this.load.image('guitarSprite', guitarSprite);
    this.load.image('guitar-icon', guitarIcon);
    this.load.image('drumSticks', drumSticks);
    this.load.image('drum-icon', drumIcon);
    this.load.image('bass-sprite', bassSprite);
    this.load.image('bass-icon', bassIcon);
    this.load.image('keyboard-icon', keyboardIcon);
    this.load.atlas('keyboard_projectile', keyboardProjectileSheet, keyboardProjectileAtlas);
    this.load.image('weapon-selected', weaponSelected);
    this.load.image('weapon-unselected', weaponUnselected);

    // enemies - shadow
    this.load.atlas('shadow_idle', shadowIdle, shadowIdleJSON);
    this.load.atlas('shadow_move', shadowMove, shadowMoveJSON);
    this.load.atlas('shadow_hit', shadowHit, shadowHitJSON);
    this.load.atlas('shadow_die', shadowDie, shadowDieJSON);

    // enemies - thief
    this.load.atlas('thief_idle', thiefIdle, thiefIdleJSON);
    this.load.atlas('thief_move', thiefMove, thiefMoveJSON);
    this.load.atlas('thief_hit', thiefHit, thiefHitJSON);
    this.load.atlas('thief_die', thiefDie, thiefDieJSON);

    // boss - beethoven
    this.load.image('beethoven',        beethovenSprite);
    this.load.image('beethoven_alert',  beethovenAlert);
    this.load.atlas('beethoven_attack', beethovenAttackSheet, beethovenAttackAtlas);
    this.cache.json.add('bossPatterns', bossPatterns);

    // hud
    this.load.image('hud_health_border', HUDhealthBorder);
    this.load.image('hud_health_bar', HUDhealthBar);
    this.load.spritesheet('round_numbers', roundNumbers, { frameWidth: 24, frameHeight: 32 });
    this.load.image('dash-button', dashButton);
    this.load.image('dash-button-disabled', dashButtonDisabled);
    this.load.image('guitar-vibe-button', guitarVibeButton);
    this.load.image('guitar-vibe-button-disabled', guitarVibeButtonDisabled);
    this.load.image('bass-grenade-button', bassGrenadeButton);
    this.load.image('bass-grenade-button-disabled', bassGrenadeButtonDisabled);
    this.load.image('drum-smash-button', drumSmashButton);
    this.load.image('drum-smash-button-disabled', drumSmashButtonDisabled);
    this.load.image('keyboard-minigun-button', keyboardMinigunButton);
    this.load.image('keyboard-minigun-button-disabled', keyboardMinigunButtonDisabled);

    // mapas
    this.load.image('city_tiles', city_tileset);
    this.load.image('shop_tiles', shop_tileset);
    this.load.tilemapTiledJSON('shop_map', shop_json);
    this.load.atlas('portal', portalSpritesheet, portalJSON);

    // data
    this.cache.json.add('data', data);
    this.cache.json.add('items', itemsData);

    // items
    this.load.image('assets/sprites/items/tubescreamer.png', item_tubescreamer);
    this.load.image('assets/sprites/items/mask.png', item_mask);
    this.load.image('assets/sprites/items/bumble_pick.png', item_bumble_pick);
    this.load.image('assets/sprites/items/metronome.png', item_metronome);

    // sonidos
    this.load.audio('movement', movement);
    this.load.audio('dash', dash);
    this.load.audio('guitar_attk', guitar_attk);
    this.load.audio('get_hit', get_hit);
    this.load.audio('enemy_hurt', enemy_hurt_fx);
    this.load.audio('teclado_attk', teclado_attk);
    this.load.audio('bajo_attk', bajo_attk);
    this.load.audio('drum_attk', drum_attk);

    // música
    this.load.audio('menu_music', menu_music);
    this.load.audio('level1_music', level1_music);

    this.soundManager = new SoundManager(this);
    this.soundManager.addSounds({
      'menu_music': { key: 'menu_music', loop: true, category: 'music' },
    })

    //mapa
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
    // Inicializar registro persistente de score y trinkets
    this.registry.set('score', 0);
    this.registry.set('trinkets', []);

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

    this.input.keyboard.on("keydown-ENTER", () => {
      if (this.activeOption == this.startText) {
        this.soundManager.fadeOutMusic(500);
        this.time.delayedCall(500, () => {
          this.scene.start('level_fondo'); 
        });
      } else if (this.activeOption == this.optionsText) {
        alert("se mostraria menu de opciones: audio, brillo, etc...")
      } else {

      }
    });



  }

  moveSelect(select, active) {
    select.y = active.y;
  }
}

