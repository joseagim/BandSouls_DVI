import Phaser from 'phaser';
import Arma from './arma';
import actor from './actor';
import Guitar from './guitar';
import Drum from './drum';
import Bass from './bass';
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
        this.mouseClick = this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.button === 0 && this.canAttack) {
                if (this.arma === this.bajo) {
                    this.arma.startCharge();
                    //this.soundManager.playWithPitch('bajo_attk');
                    this.isAttacking = true;
                } else if (this.arma === this.drum) {
                    this.arma.startAttack();
                    this.soundManager.playWithPitch('drum_attk');
                } else {
                    this.soundManager.playWithPitch('guitar_attk');

                    //this.soundManager.playWithPitch('teclado_attk');
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

        this.guitar = new Guitar(this.scene, this.x, this.y, this);
        this.bajo = new Bass(this.scene, this.x, this.y, this);
        this.drum = new Drum(this.scene, this.x, this.y, this);

        this.gunManager = new GunManager(this.scene, this, [
            { weapon: this.guitar, iconKey: 'guitar-icon' },
            { weapon: this.drum,   iconKey: 'drum-icon' },
            { weapon: this.bajo,   iconKey: 'bass-icon' },
        ]);

        this.soundManager = SoundManager.getInstance(this.scene);
        this.playingMovementSound = false;

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

        let isHorizontal = false;
        this.updateVisualCues();
        
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

        if (this.keyA.isDown) {
            isHorizontal = true;
            this.lastDirection = 'left';
            this.body.setVelocityX(-this.speed);

        } else if (this.keyD.isDown) {
            isHorizontal = true;
            this.lastDirection = 'right';
            this.body.setVelocityX(this.speed);
        }


        if (this.keyW.isDown) {
            isHorizontal = false;
            this.lastDirection = 'up';
            this.body.setVelocityY(-this.speed);
        } else if (this.keyS.isDown) {
            isHorizontal = false;
            this.lastDirection = 'down';
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
        this.scene.events.emit('updateHealth', this);
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

        // velocidad en función del vector dirección del jugador
        this.body.velocity.normalize().scale(this.dashSpeed);
        this.invincible = true;
        
        // ease out del dash
        this.scene.time.delayedCall(1/4 * this.dashDuration, () => {
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
        });
    }

    stopDash() {
        this.isDashing = false;
        this.invincible = false;
        if (this.body) {
            this.body.setVelocity(0, 0); // Opcional: frenar en seco al terminar
        }
    }

    getDamage(dmg) {
        super.getDamage(dmg);
        this.scene.cameras.main.shake(50, 0.01);

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

    updateAnimation() {
        // para evitar todo el rato this.body.velocity
        const vel = this.body.velocity;
        const suffix = this.arma.getAnimSuffix();

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

        this.scene.anims.create({
            key: 'cooldown_reset',
            frames: this.anims.generateFrameNames('cooldownResetVisualCue', {
                prefix: 'CooldownResetVisualCue ',
                suffix: '.aseprite',
                start: 0,
                end: 9
            }),
            frameRate:   35,
            repeat: 0     
        });

    }




}
