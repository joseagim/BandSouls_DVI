import Phaser from 'phaser';

/**
 * Proyectil del Boss Beethoven.
 * Se genera en el borde derecho de la pantalla a la altura de un carril (laneY)
 * y vuela hacia la izquierda hasta salir del borde izquierdo.
 *
 * No extiende Enemy/actor porque no recibe daño ni forma parte del pool de enemigos.
 * La escena registra un overlap entre el grupo de físicas de este pool y el jugador.
 */
export default class BossProjectile {

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       poolSize  Número máximo de proyectiles simultáneos
     * @param {number}       damage    Daño que hace al jugador al contacto
     */
    constructor(scene, poolSize, damage) {
        this.scene = scene;
        this.damage = damage;
        this.speed = 600; // px/s, hacia la izquierda

        // Grupo de físicas que la escena usará para registrar overlaps con el jugador
        this.physicsGroup = scene.physics.add.group({ runChildUpdate: true });

        // Pool de sprites animados
        this.pool = [];
        for (let i = 0; i < poolSize; i++) {
            const sprite = scene.add.sprite(0, 0, 'beethoven_attack');
            sprite.setActive(false);
            sprite.setVisible(false);
            sprite.setScale(3.2); // x4 * 0.8 = x3.2
            scene.physics.add.existing(sprite);
            sprite.body.enable = false;
            sprite.body.allowGravity = false;
            // Hitbox en espacio de textura (Phaser lo multiplica por la escala):
            // 206×14 a escala 1 → 824×56 px en pantalla a escala 4.
            sprite.body.setSize(206, 14);
            sprite.body.setOffset(9, 9);
            // Referencia al daño para el callback de overlap
            sprite.damage = damage;
            this.physicsGroup.add(sprite);
            this.pool.push(sprite);
        }

        // Crear la animación del proyectil (sólo si no existe ya)
        if (!scene.anims.exists('beethoven_attack_anim')) {
            scene.anims.create({
                key: 'beethoven_attack_anim',
                frames: scene.anims.generateFrameNames('beethoven_attack', {
                    prefix: 'attack_',
                    start: 0,
                    end: 4
                }),
                frameRate: 10,  // 100ms por frame
                repeat: -1
            });
        }
    }

    /**
     * Dispara un proyectil en el carril dado.
     * El proyectil aparece en el borde derecho de la pantalla (con margen) y
     * vuela hacia la izquierda.
     *
     * @param {number} laneY  Coordenada Y central del carril
     * @returns {boolean} true si se pudo disparar, false si el pool está agotado
     */
    fire(laneY, dir = 'right') {
        const sprite = this.pool.find(s => !s.active);
        if (!sprite) return false;

        const cam = this.scene.cameras.main;
        const halfW = (sprite.width * sprite.scaleX) / 2;

        let startX;
        if (dir === 'left') {
            startX = cam.worldView.left - halfW;  // entra desde la izquierda
            sprite.body.setVelocity(this.speed, 0);
            sprite.setFlipX(true);
        } else {
            startX = cam.worldView.right + halfW;  // entra desde la derecha
            sprite.body.setVelocity(-this.speed, 0);
            sprite.setFlipX(false);
        }

        const startY = cam.scrollY + laneY;

        sprite._dir = dir; // guardar dirección para usarla en update()

        sprite.setPosition(startX, startY);
        sprite.setActive(true);
        sprite.setVisible(true);
        sprite.body.enable = true;
        sprite.play('beethoven_attack_anim', true);

        return true;
    }

    /**
     * Desactiva todos los proyectiles activos inmediatamente.
     * Se llama cuando el boss muere para no dejar proyectiles huérfanos.
     */
    deactivateAll() {
        for (const sprite of this.pool) {
            if (sprite.active) {
                this._deactivate(sprite);
            }
        }
    }

    /** @private */
    _deactivate(sprite) {
        sprite.body.setVelocity(0, 0);
        sprite.body.enable = false;
        sprite.setActive(false);
        sprite.setVisible(false);
        sprite.stop();
    }

    /**
     * Debe llamarse desde el preUpdate de la escena (o del boss).
     * Desactiva los proyectiles que han salido por el borde izquierdo.
     */
    update() {
        const cam = this.scene.cameras.main;
        const leftEdge = cam.worldView.left;
        const rightEdgeScreen = cam.worldView.right;

        for (const sprite of this.pool) {
            if (!sprite.active) continue;

            const halfW = (sprite.width * sprite.scaleX) / 2;

            if (sprite._dir === 'left') {
                // Va hacia la derecha. Desactivar cuando sale por el borde derecho
                const leftEdgeSprite = sprite.x - halfW;
                if (leftEdgeSprite > rightEdgeScreen) {
                    this._deactivate(sprite);
                }
            } else {
                // Va hacia la izquierda. Desactivar cuando sale por el borde izquierdo
                const rightEdgeSprite = sprite.x + halfW;
                if (rightEdgeSprite < leftEdge) {
                    this._deactivate(sprite);
                }
            }
        }
    }
}
