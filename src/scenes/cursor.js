import Phaser from 'phaser';

const CURSOR_SCALE    = 1;
const GAMEPLAY_SCENES = ['level_fondo', 'level2'];

export default class CursorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'cursor' });
    }

    create() {
        this.game.canvas.style.cursor = 'none';

        this._isOver     = false;
        this._dragging   = false;
        this._wasDown    = false;
        this._overOnDown = false;

        // Funciones nombradas para poder hacer off+on sin duplicados
        this._onOver     = () => { this._isOver = true;  };
        this._onOut      = () => { this._isOver = false; };
        this._prevActive = new Set();

        const p = this.input.activePointer;
        this._img = this.add.image(p.x, p.y, 'cursor_arrow')
            .setDepth(9999)
            .setScrollFactor(0)
            .setOrigin(0, 0)
            .setScale(CURSOR_SCALE);

        this.input.on('pointermove', (ptr) => {
            this._img.setPosition(ptr.x, ptr.y);
        });
    }

    _syncListeners() {
        const nowActive = new Set();

        this.game.scene.scenes.forEach(scene => {
            if (scene === this || !scene.input || !scene.sys.isActive()) return;
            nowActive.add(scene);
            scene.input.off('gameobjectover', this._onOver);
            scene.input.off('gameobjectout',  this._onOut);
            scene.input.on('gameobjectover',  this._onOver);
            scene.input.on('gameobjectout',   this._onOut);
        });

        // Si alguna escena que tenía el puntero encima dejó de estar activa
        // (scene.stop sin disparar gameobjectout), reseteamos _isOver
        for (const scene of this._prevActive) {
            if (!nowActive.has(scene)) { this._isOver = false; break; }
        }
        this._prevActive = nowActive;
    }

    update() {
        this.game.canvas.style.cursor = 'none';

        this._syncListeners();

        const pointer = this.input.activePointer;
        if (!pointer) return;

        // Detección de drag
        const isDown = pointer.isDown;
        if (isDown && !this._wasDown)  this._overOnDown = this._isOver;
        if (!isDown)                   { this._dragging = false; this._overOnDown = false; }
        else if (this._overOnDown)     this._dragging = true;
        this._wasDown = isDown;

        // Selección de sprite
        const inGameplay = GAMEPLAY_SCENES.some(k => this.scene.isActive(k));
        let key;
        if      (this._dragging)  key = 'cursor_drag';
        else if (this._isOver)    key = 'cursor_hand';
        else if (inGameplay)      key = 'cursor_sniper';
        else                      key = 'cursor_arrow';

        this._img.setTexture(key);
    }
}
