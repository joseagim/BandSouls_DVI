import Phaser from 'phaser';
import actor from './actor';
import Guitar from './weapons/guitar';
import Drum from './weapons/drum';
import Bass from './weapons/bass';
import Keyboard from './weapons/keyboard';
import GuitarMK2 from './weapons/guitar_mk2';
import DrumMK2 from './weapons/drum_mk2';
import BassMK2 from './weapons/bass_mk2';
import KeyboardMK2 from './weapons/keyboard_mk2';
import Item from './item';
import SoundManager from './sound-manager';
import GunManager from './gun-manager';

/**
 * Clase que representa el jugador del juego. El jugador se mueve por el mundo usando los cursores.
 * También almacena la puntuación o número de estrellas que ha recogido hasta el momento.
 */
export default class Player extends actor {

    /**
     * Constructor del jugador
     * @param {Phaser.Scene} scene Escena a la que pertenece el jugador
     * @param {number} x Coordenada X
     * @param {number} y Coordenada Y
     */

    constructor(scene, x, y, stats) {
        super(scene, x, y, 'player', stats);
        this.x = x;
        this.y = y;

        // Velocidades
        this.dashSpeed = stats.dashSpeed;
        this.dashDuration = stats.dashDuration;
        this.dashCooldown = stats.dashCooldown;
        this.easeOutScale = 0.80;

        // Estados
        this.isDashing = false;
        this.dashEaseout = false;
        this.canDash = true;
        this.canAttack = true;
        this.lastDirection = 'down';

        // Sprites
        this.createAnimations();

        this.body.setSize(12, 24);
        this.body.setOffset(10, 8);
        this.setScale(1.5);
        this.play('idle-down', true);

        // Esta label es la UI en la que pondremos la puntuación del jugador
        this.label = this.scene.add.text(10, 10, "", { fontSize: 20 });


        // visual cues
        this.cdAnim = this.scene.add.sprite(x, y, 'cooldownResetVisualCue');
        this.cdAnim.setVisible(false);
        this.xOffsetCdAnim = -25;
        this.yOffsetCdAnim = -15;

        // this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);


        // this.keyF = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F); DEBUG FOR DAMAGE
        this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.scene.input.keyboard.on('keydown-E', () => {
            this.arma.ability();
        });
        this.mouseClick = this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.button === 0 && this.canAttack) {
                if (this.arma === this.bajo) {
                    this.arma.startCharge();
                    //this.soundManager.playWithPitch('bajo_attk');
                    this.isAttacking = true;
                } else if (this.arma === this.drum) {
                    this.arma.startAttack();
                } else if (this.arma === this.teclado) {
                    this.arma.startCharge();
                    //this.soundManager.playWithPitch('keyboard_attk');
                } else {
                    this.soundManager.playWithPitch('guitar_attk');
                    this.arma.activateWeapon();
                    this.canAttack = false;
                    this.isAttacking = true;
                    this.scene.time.delayedCall(this.arma.duration,
                        () => {
                            this.arma.deactivateWeapon(); this.isAttacking = false;
                            this.scene.time.delayedCall(this.arma.cooldown - this.arma.duration,
                                () => { this.canAttack = true; })
                        });
                }
            }
        });

        this.scene.input.on('pointerup', (pointer) => {
            if (pointer.button === 0 && this.arma === this.bajo && this.arma.isCharging) {
                // Bass: release charge → perform the strike
                this.arma.releaseCharge();
                this.canAttack = false;
                this.scene.time.delayedCall(this.arma.duration,
                    () => {
                        this.isAttacking = false;
                        this.scene.time.delayedCall(this.arma.cooldown - this.arma.duration,
                            () => { this.canAttack = true; })
                    });
            }
        });

        const weaponStats = this.scene.cache.json.get('data').weaponStats;
        this.guitar = new Guitar(this.scene, this.x, this.y, this, weaponStats.guitar);
        this.bajo = new Bass(this.scene, this.x, this.y, this, weaponStats.bass);
        this.drum = new Drum(this.scene, this.x, this.y, this, weaponStats.drum);
        this.teclado = new Keyboard(this.scene, this.x, this.y, this, weaponStats.keyboard);

        this.gunManager = new GunManager(this.scene, this, [
            { weapon: this.guitar, iconKey: 'guitar-icon' },
            { weapon: this.drum, iconKey: 'drum-icon' },
            { weapon: this.bajo, iconKey: 'bass-icon' },
            { weapon: this.teclado, iconKey: 'keyboard-icon' },
        ]);

        this.soundManager = SoundManager.getInstance(this.scene);
        this.playingMovementSound = false;

        // Regeneración de vida
        this.regenDelay = stats.regenDelay;
        this.lastDamageTime = 0;
        this.scene.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (this.life < this.maxHP && (this.scene.time.now - this.lastDamageTime) >= this.regenDelay) {
                    this.life = Math.min(this.life + 5, this.maxHP);
                    this.updateHealth();
                }
            }
        });

        // Multiplicador de puntuación (usado por powerups)
        this.scoreMultiplier = 1;

        // Escudo
        this.hasShield = false;
        this.shieldHP = 0;
        this._shieldSprite = null;

        //seccion de items no consumibles(trinkets)
        this.trinket = [];

        // Re-aplicar trinkets guardados en el registro (persistencia entre escenas)
        const savedTrinkets = this.scene.registry.get('trinkets') || [];
        for (const trinketData of savedTrinkets) {
            const item = new Item(trinketData);
            item.applyTo(this);
            this.trinket.push(item);
        }
    }

    /**
     * Añade un trinket al jugador, aplica sus buffs/debuffs y actualiza el registro.
     * @param {Item} item
     */
    addTrinket(item) {
        item.applyTo(this);
        item.purchased = true;
        this.trinket.push(item);

        const savedTrinkets = this.scene.registry.get('trinkets') || [];
        savedTrinkets.push({
            id: item.id,
            name: item.name,
            description: item.description,
            buffs: item.buffs,
            debuffs: item.debuffs,
            price: item.price,
            weight: item.weight,
            image: item.image
        });
        this.scene.registry.set('trinkets', savedTrinkets);

        // Actualizar barra de vida si se ha cambiado
        this.updateHealth();
    }

    /**
     * Elimina un trinket del jugador, revierte sus efectos y actualiza el registro.
     * @param {Item} item
     */
    removeTrinket(item) {
        const idx = this.trinket.indexOf(item);
        if (idx === -1) return;

        item.removeFrom(this);
        this.trinket.splice(idx, 1);

        const savedTrinkets = this.scene.registry.get('trinkets') || [];
        const regIdx = savedTrinkets.findIndex(t => t.id === item.id);
        if (regIdx !== -1) savedTrinkets.splice(regIdx, 1);
        this.scene.registry.set('trinkets', savedTrinkets);
    }

    get arma() {
        return this.gunManager.currentWeapon;
    }

    updateVisualCues() {
        this.cdAnim.x = this.x + this.xOffsetCdAnim;
        this.cdAnim.y = this.y + this.yOffsetCdAnim;
    }

    /**
     * Métodos preUpdate de Phaser. En este caso solo se encarga del movimiento del jugador.
     * Como se puede ver, no se tratan las colisiones con las estrellas, ya que estas colisiones 
     * ya son gestionadas por la estrella (no gestionar las colisiones dos veces)
     * @override
     */
    preUpdate(t, dt) {
        super.preUpdate(t, dt);

        this.updateVisualCues();
        this._updateShieldPosition();

        if (this.dashEaseout) {
            this.body.velocity.scale(this.easeOutScale);

            if (this.body.velocity.length() < 15) {
                this.dashEaseout = false;
                this.body.setVelocity(0);
            }
        }
        // Si estamos haciendo dash y chocamos contra algo (pared o objeto sólido)
        if (this.isDashing && (this.body.blocked.left || this.body.blocked.right || this.body.blocked.up || this.body.blocked.down)) {
            this.stopDash();
            if (this.dashTimer) this.dashTimer.remove(); // Cancelamos el timer de duración
            return; // No procesamos más movimiento mientras hacemos dash
        }

        if (this.isDashing || this.dashEaseout) return;

        this.body.setVelocity(0);

        const lockDirection = this.arma.getAnimSuffix() === '-keyboard' && this.arma.isCharging;

        if (this.keyA.isDown) {
            if (!lockDirection) this.lastDirection = 'left';
            this.body.setVelocityX(-this.speed);

        } else if (this.keyD.isDown) {
            if (!lockDirection) this.lastDirection = 'right';
            this.body.setVelocityX(this.speed);
        }


        if (this.keyW.isDown) {
            if (!lockDirection) this.lastDirection = 'up';
            this.body.setVelocityY(-this.speed);
        } else if (this.keyS.isDown) {
            if (!lockDirection) this.lastDirection = 'down';
            this.body.setVelocityY(this.speed);;
        }

        this.body.velocity.normalize().scale(this.speed);

        if (this.body.velocity.length() > 0 && !this.playingMovementSound) {
            this.soundManager.play('movement');
            this.playingMovementSound = true;
        } else if (this.body.velocity.length() === 0 && this.playingMovementSound) {
            this.soundManager.stop('movement');
            this.playingMovementSound = false;
        }

        this.updateAnimation();

        if (this.keySpace.isDown && this.canDash && this.body.velocity.length() > 0) {
            this.doDash();
        }

    }

    updateHealth() {
        this.scene.game.events.emit('updateHealth', this);
    }

    die() {
        this.soundManager.stopAll();
        this.scene.scene.stop('hud');
        this.scene.scene.start("end")
    }

    showCooldownCue(color) {
        this.cdAnim.clearTint();
        this.cdAnim.setTintFill(color);

        this.cdAnim.setVisible(true);
        this.cdAnim.play('cooldown_reset', true);

        this.cdAnim.once('animationcomplete-cooldown_reset', () => {
            this.cdAnim.setVisible(false);
        });
    }


    doDash() {
        // el jugador hace dash
        this.soundManager.play('dash');
        this.isDashing = true;
        this.canDash = false;
        this.scene.game.events.emit('dashStart', this.dashCooldown);

        // velocidad en función del vector dirección del jugador
        this.body.velocity.normalize().scale(this.dashSpeed);
        this.invincible = true;


        // ease out del dash
        this.scene.time.delayedCall(1 / 4 * this.dashDuration, () => {
            this.dashEaseout = true;
        });

        // cuando termine el dash
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.stopDash();
        });

        // cuando termine el cooldown del dash
        this.scene.time.delayedCall(this.dashCooldown, () => {
            let dashColor = 0x00ffff;
            this.showCooldownCue(dashColor);
            this.canDash = true;
            this.scene.game.events.emit('dashReady');
        });
    }

    stopDash() {
        this.isDashing = false;
        this.invincible = false;
        if (this.body) {
            this.body.setVelocity(0, 0);
        }
    }

    getDamage(dmg, sourceX = null, sourceY = null) {
        if (this.hasShield && this._isFromBehind(sourceX, sourceY)) {
            this.shieldHP -= dmg;
            this._updateShieldPosition();
            this.scene.cameras.main.shake(20, 0.003);
            this.soundManager.play('shield_hit');
            if (this.shieldHP <= 0) this.deactivateShield();
            return;
        }
        if (!this._gettingHit) {
            this.soundManager.play('get_hit');
            this._gettingHit = true;
            this.scene.time.delayedCall(1000, () => { this._gettingHit = false; });
        }
        super.getDamage(dmg);
        this.lastDamageTime = this.scene.time.now;
        this.scene.cameras.main.shake(50, 0.01);
    }

    _isFromBehind(sourceX, sourceY) {
        if (sourceX === null || sourceY === null) return false;
        const dx = sourceX - this.x;
        const dy = sourceY - this.y;
        switch (this.lastDirection) {
            case 'right': return dx < 0;
            case 'left':  return dx > 0;
            case 'up':    return dy > 0;
            case 'down':  return dy < 0;
        }
        return false;
    }

    activateShield() {
        this.hasShield = true;
        this.shieldHP = 200;
        this._shieldSprite = this.scene.add.sprite(this.x, this.y, 'shield-front');
        this._shieldSprite.setScale(1.8);
        this._updateShieldPosition();
    }

    deactivateShield() {
        this.hasShield = false;
        this.shieldHP = 0;
        if (this._shieldSprite) {
            const s = this._shieldSprite;
            this._shieldSprite = null;
            this.scene.tweens.add({
                targets: s,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                ease: 'Cubic.easeOut',
                onComplete: () => s.destroy()
            });
        }
    }

    _updateShieldPosition() {
        if (!this._shieldSprite) return;
        const pct = this.shieldHP / 200;
        const frame = pct > 0.6 ? 0 : pct > 0.2 ? 1 : 2;
        this._shieldSprite.setPosition(this.x, this.y);
        switch (this.lastDirection) {
            case 'down':
                this._shieldSprite.setTexture('shield-front', frame).setFlipX(false).setDepth(this.depth - 1);
                break;
            case 'up':
                this._shieldSprite.setTexture('shield-back', frame).setFlipX(false).setDepth(this.depth + 1);
                break;
            case 'right':
                this._shieldSprite.setTexture('shield-side', frame).setFlipX(false).setDepth(this.depth - 1);
                break;
            case 'left':
                this._shieldSprite.setTexture('shield-side', frame).setFlipX(true).setDepth(this.depth - 1);
                break;
        }
    }

    getDirection() {
        const direction = { x: 0, y: 0 };

        // Ejemplo con cursores (asumiendo que tienes cursores configurados)
        if (this.keyA.isDown) direction.x = -1;
        if (this.keyD.isDown) direction.x = 1;
        if (this.keyW.isDown) direction.y = -1;
        if (this.keyS.isDown) direction.y = 1;

        // Normalizar para diagonales (evitar velocidad extra)
        if (direction.x !== 0 && direction.y !== 0) {
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= length;
            direction.y /= length;
        }

        return direction;
    }

    setEnemigo(enemigo) {
        this.enemigo = enemigo;
    }

    upgradeCurrentWeapon() {
        const weaponStats = this.scene.cache.json.get('data').weaponStats;
        const idx = this.gunManager.currentIndex;
        const current = this.arma;

        let upgraded = null;
        let iconKey = null;

        if (current === this.guitar) {
            upgraded = new GuitarMK2(this.scene, this.x, this.y, this, weaponStats.guitar_mk2);
            iconKey = 'guitarmk2-icon';
            this.guitar = upgraded;
        } else if (current === this.drum) {
            upgraded = new DrumMK2(this.scene, this.x, this.y, this, weaponStats.drum_mk2);
            iconKey = 'drummk2-icon';
            this.drum = upgraded;
        } else if (current === this.bajo) {
            upgraded = new BassMK2(this.scene, this.x, this.y, this, weaponStats.bass_mk2);
            iconKey = 'bassmk2-icon';
            this.bajo = upgraded;
        } else if (current === this.teclado) {
            upgraded = new KeyboardMK2(this.scene, this.x, this.y, this, weaponStats.keyboard_mk2);
            iconKey = 'keyboardmk2-icon';
            this.teclado = upgraded;
        }

        if (upgraded) {
            this.gunManager.replaceWeapon(idx, upgraded, iconKey);
            this._playUpgradeFlash();
        }
    }

    restoreWeaponUpgrades(savedWeapons) {
        const mk2Keys = ['guitarmk2-icon', 'drummk2-icon', 'bassmk2-icon', 'keyboardmk2-icon'];
        const slotToIndex = { guitar: 0, drum: 1, bajo: 2, teclado: 3 };
        const prevIndex = this.gunManager.currentIndex;

        for (const [slot, iconKey] of Object.entries(savedWeapons)) {
            if (mk2Keys.includes(iconKey) && slotToIndex[slot] !== undefined) {
                this.gunManager.currentIndex = slotToIndex[slot];
                this.upgradeCurrentWeapon();
            }
        }

        this.gunManager.currentIndex = prevIndex;
        this.gunManager._updateUI();
    }

    _playUpgradeFlash() {
        if (!this.scene.textures.exists('_upgrade_particle')) {
            const gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(0xffffff, 1);
            gfx.fillCircle(4, 4, 4);
            gfx.generateTexture('_upgrade_particle', 8, 8);
            gfx.destroy();
        }

        const emitter = this.scene.add.particles(this.x, this.y - 12, '_upgrade_particle', {
            speed:    { min: 60, max: 200 },
            angle:    { min: 0, max: 360 },
            scale:    { start: 1.4, end: 0 },
            alpha:    { start: 1, end: 0 },
            tint:     [0xffee00, 0xffaa00, 0xffffff, 0xffcc33],
            lifespan: 500,
            emitting: false,
        });
        emitter.setDepth(this.depth + 1);
        emitter.explode(30);

        this.scene.time.delayedCall(600, () => emitter.destroy());
    }

    updateAnimation() {
        // para evitar todo el rato this.body.velocity
        const vel = this.body.velocity;
        const suffix = this.arma.getAnimSuffix();

        // si el teclado (o mk2) está cargando, animación de keyboard attack (sin reiniciarla si ya está en curso)
        if ((suffix === '-keyboard' || suffix === '-keyboard-mk2') && this.arma.isCharging) {
            const currentKey = this.anims.currentAnim?.key;
            if (currentKey && currentKey.startsWith('attack-') && currentKey.endsWith(suffix)) return;

            switch (this.lastDirection) {
                case 'left':
                    this.flipX = true;
                    this.play(`attack-right${suffix}`, true);
                    break;
                case 'right':
                    this.flipX = false;
                    this.play(`attack-right${suffix}`, true);
                    break;
                case 'up':
                    this.flipX = false;
                    this.play(`attack-up${suffix}`, true);
                    break;
                case 'down':
                default:
                    this.flipX = false;
                    this.play(`attack-down${suffix}`, true);
                    break;
            }
            return;
        }

        // si se está moviendo
        if (vel.length() > 0) {
            if (Math.abs(vel.x) > Math.abs(vel.y)) {
                this.flipX = (vel.x < 0);
                this.play('run-right' + suffix, true);
            } else {
                this.flipX = false;
                if (vel.y < 0) this.play('run-up' + suffix, true);
                else this.play('run-down' + suffix, true);
            }
        }
        // si está quieto
        else {
            // miramos la última dirección
            switch (this.lastDirection) {
                case 'left':
                    this.flipX = true;
                    this.play('idle-right' + suffix, true);
                    break;
                case 'right':
                    this.flipX = false;
                    this.play('idle-right' + suffix, true);
                    break;
                case 'up':
                    this.flipX = false;
                    this.play('idle-up' + suffix, true);
                    break;
                case 'down':
                    this.flipX = false;
                    this.play('idle-down' + suffix, true);
                    break;
            }
        }
    }

    createAnimations() {

        // Animaciones sin arma
        this.scene.anims.create({
            key: 'idle-down',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'idle_down_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-up',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'idle_up_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-right',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'idle_right_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-down',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'run_down_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-up',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'run_up_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-right',
            frames: this.anims.generateFrameNames('laude', {
                prefix: 'run_right_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        // Animaciones guitarra
        this.scene.anims.create({
            key: 'idle-down-guitar',
            frames: this.anims.generateFrameNames('laude_guitar', {
                prefix: 'idle_down_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-up-guitar',
            frames: this.anims.generateFrameNames('laude_guitar', {
                prefix: 'idle_up_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-right-guitar',
            frames: this.anims.generateFrameNames('laude_guitar', {
                prefix: 'idle_right_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-down-guitar',
            frames: this.anims.generateFrameNames('laude_guitar', {
                prefix: 'run_down_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-up-guitar',
            frames: this.anims.generateFrameNames('laude_guitar', {
                prefix: 'run_up_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-right-guitar',
            frames: this.anims.generateFrameNames('laude_guitar', {
                prefix: 'run_right_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        // Animaciones Bajo
        this.scene.anims.create({
            key: 'idle-down-bass',
            frames: this.anims.generateFrameNames('laude_bass', {
                prefix: 'idle_down_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'idle-up-bass',
            frames: this.anims.generateFrameNames('laude_bass', {
                prefix: 'idle_up_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'idle-right-bass',
            frames: this.anims.generateFrameNames('laude_bass', {
                prefix: 'idle_right_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'run-down-bass',
            frames: this.anims.generateFrameNames('laude_bass', {
                prefix: 'run_down_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'run-up-bass',
            frames: this.anims.generateFrameNames('laude_bass', {
                prefix: 'run_up_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'run-right-bass',
            frames: this.anims.generateFrameNames('laude_bass', {
                prefix: 'run_right_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        // Animaciones batería
        this.scene.anims.create({
            key: 'idle-down-drum',
            frames: this.anims.generateFrameNames('laude_drum', {
                prefix: 'idle_down_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-up-drum',
            frames: this.anims.generateFrameNames('laude_drum', {
                prefix: 'idle_up_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-right-drum',
            frames: this.anims.generateFrameNames('laude_drum', {
                prefix: 'idle_right_',
                start: 1,
                end: 4
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-down-drum',
            frames: this.anims.generateFrameNames('laude_drum', {
                prefix: 'run_down_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-up-drum',
            frames: this.anims.generateFrameNames('laude_drum', {
                prefix: 'run_up_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-right-drum',
            frames: this.anims.generateFrameNames('laude_drum', {
                prefix: 'run_right_',
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        // Animaciones teclado (idle, run y attack, son 3 png distintos)
        this.scene.anims.create({
            key: 'idle-down-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_idle', {
                prefix: 'idle_down_',
                start: 0,
                end: 3
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-up-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_idle', {
                prefix: 'idle_up_',
                start: 0,
                end: 3
            }),
            frameRate: 4,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'idle-right-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_idle', {
                prefix: 'idle_right_',
                start: 0,
                end: 3
            }),
            frameRate: 4,
            repeat: -1
        });
        // run usa laude_keyboard_run (frames 0-indexed, 4 frames)
        this.scene.anims.create({
            key: 'run-down-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_run', {
                prefix: 'run_down_',
                start: 0,
                end: 3
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-up-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_run', {
                prefix: 'run_up_',
                start: 0,
                end: 3
            }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'run-right-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_run', {
                prefix: 'run_right_',
                start: 0,
                end: 3
            }),
            frameRate: 8,
            repeat: -1
        });
        // attack usa laude_keyboard_attack (frames 0-indexed, 7 frames)
        this.scene.anims.create({
            key: 'attack-down-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_attack', {
                prefix: 'attack_down_',
                start: 0,
                end: 6
            }),
            frameRate: 6.5,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'attack-up-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_attack', {
                prefix: 'attack_up_',
                start: 0,
                end: 6
            }),
            frameRate: 6.5,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'attack-right-keyboard',
            frames: this.anims.generateFrameNames('laude_keyboard_attack', {
                prefix: 'attack_right_',
                start: 0,
                end: 6
            }),
            frameRate: 6.5,
            repeat: -1
        });

        // Animaciones guitarra MK2
        this.scene.anims.create({ key: 'idle-down-guitar-mk2', frames: this.anims.generateFrameNames('laude_guitar_mk2', { prefix: 'idle_down_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-up-guitar-mk2', frames: this.anims.generateFrameNames('laude_guitar_mk2', { prefix: 'idle_up_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-right-guitar-mk2', frames: this.anims.generateFrameNames('laude_guitar_mk2', { prefix: 'idle_right_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'run-down-guitar-mk2', frames: this.anims.generateFrameNames('laude_guitar_mk2', { prefix: 'run_down_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-up-guitar-mk2', frames: this.anims.generateFrameNames('laude_guitar_mk2', { prefix: 'run_up_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-right-guitar-mk2', frames: this.anims.generateFrameNames('laude_guitar_mk2', { prefix: 'run_right_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });

        // Animaciones bajo MK2
        this.scene.anims.create({ key: 'idle-down-bass-mk2', frames: this.anims.generateFrameNames('laude_bass_mk2', { prefix: 'idle_down_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-up-bass-mk2', frames: this.anims.generateFrameNames('laude_bass_mk2', { prefix: 'idle_up_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-right-bass-mk2', frames: this.anims.generateFrameNames('laude_bass_mk2', { prefix: 'idle_right_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'run-down-bass-mk2', frames: this.anims.generateFrameNames('laude_bass_mk2', { prefix: 'run_down_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-up-bass-mk2', frames: this.anims.generateFrameNames('laude_bass_mk2', { prefix: 'run_up_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-right-bass-mk2', frames: this.anims.generateFrameNames('laude_bass_mk2', { prefix: 'run_right_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });

        // Animaciones batería MK2
        this.scene.anims.create({ key: 'idle-down-drum-mk2', frames: this.anims.generateFrameNames('laude_drum_mk2', { prefix: 'idle_down_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-up-drum-mk2', frames: this.anims.generateFrameNames('laude_drum_mk2', { prefix: 'idle_up_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-right-drum-mk2', frames: this.anims.generateFrameNames('laude_drum_mk2', { prefix: 'idle_right_', start: 1, end: 4 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'run-down-drum-mk2', frames: this.anims.generateFrameNames('laude_drum_mk2', { prefix: 'run_down_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-up-drum-mk2', frames: this.anims.generateFrameNames('laude_drum_mk2', { prefix: 'run_up_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-right-drum-mk2', frames: this.anims.generateFrameNames('laude_drum_mk2', { prefix: 'run_right_', start: 1, end: 4 }), frameRate: 8, repeat: -1 });

        // Animaciones teclado MK2
        this.scene.anims.create({ key: 'idle-down-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_idle', { prefix: 'idle_down_', start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-up-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_idle', { prefix: 'idle_up_', start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'idle-right-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_idle', { prefix: 'idle_right_', start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.scene.anims.create({ key: 'run-down-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_run', { prefix: 'run_down_', start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-up-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_run', { prefix: 'run_up_', start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'run-right-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_run', { prefix: 'run_right_', start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'attack-down-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_attack', { prefix: 'attack_down_', start: 0, end: 6 }), frameRate: 6.5, repeat: -1 });
        this.scene.anims.create({ key: 'attack-up-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_attack', { prefix: 'attack_up_', start: 0, end: 6 }), frameRate: 6.5, repeat: -1 });
        this.scene.anims.create({ key: 'attack-right-keyboard-mk2', frames: this.anims.generateFrameNames('laude_keyboard_mk2_attack', { prefix: 'attack_right_', start: 0, end: 6 }), frameRate: 6.5, repeat: -1 });

        this.scene.anims.create({
            key: 'cooldown_reset',
            frames: this.anims.generateFrameNames('cooldownResetVisualCue', {
                prefix: 'CooldownResetVisualCue ',
                suffix: '.aseprite',
                start: 0,
                end: 9
            }),
            frameRate: 35,
            repeat: 0
        });

    }




}
