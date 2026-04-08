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
        this.scene   = scene;
        this.damage  = damage;
        this.speed   = 600; // px/s, hacia la izquierda

        // Grupo de físicas que la escena usará para registrar overlaps con el jugador
        this.physicsGroup = scene.physics.add.group({ runChildUpdate: true });

        // Pool de sprites animados
        this.pool = [];
        for (let i = 0; i < poolSize; i++) {
            const sprite = scene.add.sprite(0, 0, 'beethoven_attack');
            sprite.setActive(false);
            sprite.setVisible(false);
            sprite.setScale(4);   // x4 para que sea visible
            scene.physics.add.existing(sprite);
            sprite.body.enable       = false;
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
    fire(laneY) {
        const sprite = this.pool.find(s => !s.active);
        if (!sprite) return false;

        const cam     = this.scene.cameras.main;
        const screenW = this.scene.scale.width;

        // Ancho visual del proyectil a escala 4: 224 * 4 = 896 px
        // El origen del sprite está en el centro (0.5), así que la mitad = 448 px.
        // Ponemos el centro del sprite a 448 px a la derecha del borde de pantalla,
        // de modo que el BORDE IZQUIERDO del sprite coincida exactamente con el borde
        // derecho de la pantalla → entra suavemente desde fuera.
        const halfW   = (sprite.width * sprite.scaleX) / 2;
        const startX  = cam.scrollX + screenW + halfW;
        const startY  = cam.scrollY + laneY;

        sprite.setPosition(startX, startY);
        sprite.setActive(true);
        sprite.setVisible(true);
        sprite.body.enable = true;
        sprite.body.setVelocity(-this.speed, 0);
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
        const cam      = this.scene.cameras.main;
        const leftEdge = cam.scrollX;  // borde izquierdo de la pantalla

        for (const sprite of this.pool) {
            if (!sprite.active) continue;
            // El sprite tiene origen en el centro (0.5).
            // Su borde DERECHO está en sprite.x + mitadAncho.
            // Solo desactivamos cuando ese borde haya salido completamente
            // por la izquierda, evitando el pop-out visual.
            const halfW      = (sprite.width * sprite.scaleX) / 2;
            const rightEdge  = sprite.x + halfW;
            if (rightEdge < leftEdge) {
                this._deactivate(sprite);

            }
        }
    }
}
