import Phaser from 'phaser'
import SoundManager from '../game-objects/sound-manager.js'

const SCALE_WIN   = 4;    // window 140×150 → 560×600
const SCALE_BAR   = 2;    // scrollbars 120×10 → 240×20
const SCALE_X     = 2.5;  // X button 20×20 → 50×50
const SCALE_TEXT  = 1.5;  // text sprites (24px tall → 36px)
const SCALE_CHECK = 1.2;    // fullscreen check button
const SCALE_MUTE  = 1.2;    // SFX/Music mute button

export default class OptionsMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'options_menu' });
    }

    create() {
        const sm = SoundManager.getInstance();
        const cx = this.scale.width  / 2;  
        const cy = this.scale.height / 2;  

        this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.4)
            .setInteractive();

        this.add.image(cx, cy, 'opt_window').setScale(SCALE_WIN);

        const xBtn = this.add.image(914, 155, 'opt_x')
            .setScale(SCALE_X)
            .setInteractive({ useHandCursor: true });
        this._addHover(xBtn);
        xBtn.on('pointerdown', () => this._close());

        // Layout
        const BAR_HALF   = (120 * SCALE_BAR)   / 2;  
        const CHECK_HALF = 10;  
        const TRACK_CX   = 900 - BAR_HALF;          
        const CHECK_X    = TRACK_CX - BAR_HALF - 15 - CHECK_HALF;  
        const LABEL_X    = 390;

        const ROW_SFX_Y = cy - 170;  // 198
        const ROW_MUS_Y = cy - 120;   // 338
        const ROW_FS_Y  = cy - 70;  // 473

        // ─ SFX 
        this._sfxVol   = sm.sfxVolume;
        this._sfxMuted = false;
        const sfx = this._makeScrollbar(TRACK_CX, ROW_SFX_Y, this._sfxVol);
        sfx.track.on('pointerdown', (p) => {
            const v = this._ptrToVol(p, TRACK_CX);
            this._sfxVol = v; sm.setSFXVolume(v); sfx.update(v);
            this._drag = { bar: sfx, trackCx: TRACK_CX,
                set: (val) => { this._sfxVol = val; sm.setSFXVolume(val); } };
        });

        const sfxMute = this.add.image(CHECK_X, ROW_SFX_Y, 'opt_sound')
            .setScale(SCALE_MUTE).setInteractive({ useHandCursor: true });
        this._addHover(sfxMute);
        sfxMute.on('pointerdown', () => {
            this._sfxMuted = !this._sfxMuted;
            if (this._sfxMuted) { this._sfxVol = sm.sfxVolume; sm.setSFXVolume(0); sfx.update(0); }
            else                { sm.setSFXVolume(this._sfxVol); sfx.update(this._sfxVol); }
            sfxMute.setTexture(this._sfxMuted ? 'opt_sound_mute' : 'opt_sound');
        });

        // ─ Music
        this._musicVol   = sm.musicVolume;
        this._musicMuted = false;
        const music = this._makeScrollbar(TRACK_CX, ROW_MUS_Y, this._musicVol);
        music.track.on('pointerdown', (p) => {
            const v = this._ptrToVol(p, TRACK_CX);
            this._musicVol = v; sm.setMusicVolume(v); music.update(v);
            this._drag = { bar: music, trackCx: TRACK_CX,
                set: (val) => { this._musicVol = val; sm.setMusicVolume(val); } };
        });

        const musicMute = this.add.image(CHECK_X, ROW_MUS_Y, 'opt_sound')
            .setScale(SCALE_MUTE).setInteractive({ useHandCursor: true });
        this._addHover(musicMute);
        musicMute.on('pointerdown', () => {
            this._musicMuted = !this._musicMuted;
            if (this._musicMuted) { this._musicVol = sm.musicVolume; sm.setMusicVolume(0); music.update(0); }
            else                  { sm.setMusicVolume(this._musicVol); music.update(this._musicVol); }
            musicMute.setTexture(this._musicMuted ? 'opt_sound_mute' : 'opt_sound');
        });

        // ─ Fullscreen 
        this._isFs = this.scale.isFullscreen;
        const fsBtn = this.add.image(TRACK_CX + BAR_HALF - CHECK_HALF, ROW_FS_Y, this._isFs ? 'opt_check_on' : 'opt_check_off')
            .setScale(SCALE_CHECK).setInteractive({ useHandCursor: true });
        this._addHover(fsBtn);
        fsBtn.on('pointerdown', () => {
            this._isFs = !this._isFs;
            this._isFs ? this.scale.startFullscreen() : this.scale.stopFullscreen();
            fsBtn.setTexture(this._isFs ? 'opt_check_on' : 'opt_check_off');
        });

        // ─ Text sprites
        this.add.image(LABEL_X, ROW_SFX_Y, 'opt_text_sfx')        .setScale(SCALE_TEXT).setOrigin(0, 0.5);
        this.add.image(LABEL_X, ROW_MUS_Y, 'opt_text_music')      .setScale(SCALE_TEXT).setOrigin(0, 0.5);
        this.add.image(LABEL_X, ROW_FS_Y,  'opt_text_fullscreen') .setScale(SCALE_TEXT).setOrigin(0, 0.5);

        // ─ Drag
        this._drag = null;
        this.input.on('pointermove', (p) => {
            if (!this._drag || !p.isDown) return;
            const v = this._ptrToVol(p, this._drag.trackCx);
            this._drag.set(v);
            this._drag.bar.update(v);
        });
        this.input.on('pointerup', () => { this._drag = null; });
    }

    _makeScrollbar(trackCx, y, initialVol) {
        const halfW = (120 * SCALE_BAR) / 2; 

        const track = this.add.image(trackCx, y, 'opt_scrollbar')
            .setScale(SCALE_BAR).setInteractive({ useHandCursor: true });

        const fill = this.add.image(trackCx - halfW, y, 'opt_scrollfill')
            .setScale(SCALE_BAR).setOrigin(0, 0.5);
        fill.setCrop(0, 0, initialVol * 120, 10);

        const thumb = this.add.image(trackCx - halfW + initialVol * 120 * SCALE_BAR, y, 'opt_scrollindex')
            .setScale(SCALE_BAR);

        // Hover only affects the thumb/index
        track.on('pointerover',  () => thumb.setTint(0xaaaaaa));
        track.on('pointerout',   () => thumb.clearTint());
        track.on('pointerdown',  () => thumb.setTint(0x888888));
        track.on('pointerup',    () => thumb.setTint(0xaaaaaa));

        const update = (v) => {
            fill.setCrop(0, 0, v * 120, 10);
            thumb.x = trackCx - halfW + v * 120 * SCALE_BAR;
        };

        return { track, fill, thumb, update };
    }

    _ptrToVol(pointer, trackCx) {
        const trackW = 120 * SCALE_BAR;
        return Phaser.Math.Clamp((pointer.x - (trackCx - trackW / 2)) / trackW, 0, 1);
    }

    _addHover(sprite) {
        sprite.on('pointerover',  () => sprite.setTint(0xaaaaaa));
        sprite.on('pointerout',   () => sprite.clearTint());
        sprite.on('pointerdown',  () => sprite.setTint(0x888888));
        sprite.on('pointerup',    () => sprite.setTint(0xaaaaaa));
    }

    _close() {
        this.scene.stop();
    }
}
