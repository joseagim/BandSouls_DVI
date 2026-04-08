import Phaser from 'phaser';
import Enemy from './enemy';
import BossProjectile from './bossProjectile';

/**
 * Boss "Beethoven".
 *
 * Permanece estático en la escena. Cada 5 segundos ejecuta un patrón de ataque
 * aleatorio leído desde bossPatterns.json. Cada ataque del patrón:
 *   1. Muestra un sprite de alerta (fade in/out) en el carril correspondiente.
 *   2. Al terminar la alerta, lanza un proyectil de derecha a izquierda.
 *
 * Los carriles (1–5) se calculan como:
 *   laneY(pos) = (scene.scale.height / 6) * pos
 */
export default class EnemyBeethoven extends Enemy {

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────────────────────────────────
    constructor(scene, x, y, stats) {
        super(scene, x, y, 'beethoven', stats);

        this.numAttacks = 1;

        // ── Estadísticas propias ──────────────────────────────────────────
        this.attackDamage = stats.attackDamage ?? 20;
        this.attackCooldown = stats.attackCooldown ?? 3000;   // ms entre patrones
        this.canAttack = stats.canAttack ?? true;
        this.is_knockback = false;

        // ── Visual ───────────────────────────────────────────────────────
        this.setScale(4);

        // ── Cuerpo físico ─────────────────────────────────────────────────
        // El boss NO se mueve ni recibe knockback.
        // A escala x2 el sprite ocupa 64×96 px en pantalla.
        // El hitbox usa coordenadas de textura (pre-escala): 15×38, offset (9,10).
        // Phaser escala el hitbox junto con el sprite, así que los valores
        // en setSize/setOffset son siempre en espacio de textura.
        this.body.setSize(15, 38);
        this.body.setOffset(9, 10);
        this.body.setImmovable(true);
        this.body.allowGravity = false;

        // ── Patrones de ataque ────────────────────────────────────────────
        const patternsData = scene.cache.json.get('bossPatterns');
        this.patterns = patternsData ? patternsData.patterns : [];


        // ── Pool de proyectiles ───────────────────────────────────────────
        // Máximo 10 proyectiles simultáneos: cubre los 8 carriles más margen
        // para futuros patrones. Con 5 se perdían silenciosamente los ataques
        // de los carriles 6-8 cuando se lanzaban 8 a la vez.
        this.projectilePool = new BossProjectile(scene, 20, this.attackDamage);

        // ── Pool de alertas ───────────────────────────────────────────────
        // Mismo tamaño que el pool de proyectiles: 10 slots.
        this._alerts = [];
        for (let i = 0; i < 20; i++) {
            const alert = scene.add.image(0, 0, 'beethoven_alert');
            alert.setVisible(false);
            alert.setAlpha(0);
            alert.setDepth(10);
            alert.setScale(3);
            alert._inUse = false;   // flag explícito de disponibilidad del slot
            this._alerts.push(alert);
        }

        // ── Timers activos (se guardan para poder cancelarlos en die()) ────
        this._activeTimers = [];

        // ── Timer principal de ciclo ──────────────────────────────────────
        this._cycleTimer = null;

        this.isDead = false;
        this.setDepth(5);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SPAWN (reutilización desde el pool)
    // ─────────────────────────────────────────────────────────────────────────
    spawn(_x, _y) {
        // El boss siempre aparece en el centro de la pantalla (en coordenadas de mundo)
        const cam = this.scene.cameras.main;
        const centerX = cam.scrollX + this.scene.scale.width / 2;
        const centerY = cam.scrollY + this.scene.scale.height / 2;
        super.spawn(centerX, centerY);

        // Resetear escala por si la animación de muerte la modificó
        this.setScale(4);
        this.setAlpha(1);

        this.isDead = false;


        // Notificar vida inicial al HUD
        this.scene.game.events.emit('bossHealthUpdate', this.life, this.maxHP);

        // Arrancar el primer ciclo de ataque
        this._startCycle();

        // Notificar a la escena para que registre los overlaps del proyectil
        this.scene.game.events.emit('beethovenSpawned', this);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CICLO DE ATAQUE
    // ─────────────────────────────────────────────────────────────────────────
    _startCycle() {
        this._cycleTimer = this.scene.time.delayedCall(
            this.attackCooldown,
            () => {
                if (!this.active || this.isDead) return;
                this._executeRandomPattern();
                this._startCycle(); // programa el siguiente ciclo
            }
        );
    }

    _executeRandomPattern() {
        if (!this.patterns.length) return;
        const pattern = Phaser.Utils.Array.GetRandom(this.patterns);

        for (const attack of pattern.attacks) {
            console.log("[Cargar] Ataque " + this.numAttacks + " | Pos: " + attack.pos);
            const t = this.scene.time.delayedCall(attack.wait, () => {
                if (!this.active || this.isDead) return;
                this._scheduleAttack(attack);
            });
            this._activeTimers.push(t);
        }
        this.numAttacks++;
    }

    _scheduleAttack(attack) {
        const laneY = this._laneY(attack.pos);

        // Constantes de timing (alert nunca será < 100ms)
        const FADE_IN = 30;  // ms para aparecer
        const FADE_OUT = 30;  // ms para desaparecer
        const REST = 20;  // ms de reposo antes del disparo
        // hold = tiempo que el sprite se mantiene completamente visible
        const hold = Math.max(0, attack.alert - FADE_IN - FADE_OUT - REST);

        // ── 1. Mostrar alerta ─────────────────────────────────────────────
        const alertSprite = this._getInactiveAlert();
        if (alertSprite) {
            alertSprite._inUse = true;   // marcar como ocupado
            const cam = this.scene.cameras.main;
            const screenW = this.scene.scale.width;
            // Anchura visual del sprite (textura × escala)
            const alertW = alertSprite.width * alertSprite.scaleX;
            const alertX = cam.scrollX + screenW - 20 - alertW / 2;
            const alertY = cam.scrollY + laneY;

            alertSprite.setPosition(alertX, alertY);
            alertSprite.setVisible(true);
            alertSprite.setAlpha(0);
            console.log("[Atacar] Pos: " + attack.pos);

            // Fase 1: fade in (30 ms)
            this.scene.tweens.add({
                targets: alertSprite,
                alpha: 1,
                duration: FADE_IN,
                onComplete: () => {
                    // Fase 2: hold — el sprite está completamente visible
                    const holdT = this.scene.time.delayedCall(hold, () => {
                        // Fase 3: fade out (30 ms)
                        this.scene.tweens.add({
                            targets: alertSprite,
                            alpha: 0,
                            duration: FADE_OUT,
                            onComplete: () => {
                                alertSprite.setVisible(false);
                                alertSprite._inUse = false;  // liberar slot
                            }
                        });
                    });
                    this._activeTimers.push(holdT);
                }
            });
        }

        // ── 2. Disparar tras attack.alert ms desde el inicio ──────────────
        // Secuencia: FADE_IN(30) + hold + FADE_OUT(30) + REST(20) = attack.alert
        const fireT = this.scene.time.delayedCall(attack.alert, () => {
            if (!this.active || this.isDead) return;
            this.projectilePool.fire(laneY);
        });
        this._activeTimers.push(fireT);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    _laneY(pos) {
        // Pantalla dividida en 8 carriles: pos va de 1 a 8
        return (this.scene.scale.height / 9) * pos;
    }

    _getInactiveAlert() {
        // Usa _inUse en vez de visible: resiste interrupciones de tweens
        return this._alerts.find(a => !a._inUse) || null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OVERRIDES
    // ─────────────────────────────────────────────────────────────────────────

    /** El boss no se mueve. */
    move(_dt) { }

    /** El boss no recibe knockback. */
    knockback() { }

    /** preUpdate: sólo gestiona el flip del sprite y actualiza proyectiles. */
    preUpdate(t, dt) {
        // Llamamos a Phaser.GameObjects.Sprite.preUpdate directamente,
        // saltándonos la lógica de movimiento de Enemy.
        Phaser.GameObjects.Sprite.prototype.preUpdate.call(this, t, dt);

        if (!this.active || this.isDead) return;

        // Flip hacia el jugador
        if (this.scene.player) {
            this.flipX = (this.scene.player.x < this.x);
        }

        // Actualizar el pool de proyectiles (detectar salida por borde izquierdo)
        this.projectilePool.update();
    }

    /** Ataque por contacto: el boss no hace daño cuerpo a cuerpo (sólo proyectiles). */
    attack(_player) { }

    /** Sobreescribimos getDamage para emitir el evento de vida al HUD. */
    getDamage(dmg) {
        super.getDamage(dmg);
        // Clampeamos life a 0 para la UI (super ya llama a die() si ≤ 0)
        this.scene.game.events.emit('bossHealthUpdate', Math.max(0, this.life), this.maxHP);
    }

    /** Morir: cancelar timers, limpiar proyectiles, alertas y reproducir animación de muerte. */
    die() {
        if (this.isDead) return;

        // Marcamos muerto inmediatamente para que el ciclo de ataques se detenga
        this.isDead = true;

        // Cancelar ciclo principal
        if (this._cycleTimer) {
            this._cycleTimer.remove();
            this._cycleTimer = null;
        }
        // Cancelar todos los timers de ataques en curso
        for (const timer of this._activeTimers) {
            if (timer && !timer.hasDispatched) timer.remove();
        }
        this._activeTimers = [];

        // Limpiar proyectiles y alertas inmediatamente
        this.projectilePool.deactivateAll();
        for (const alert of this._alerts) {
            this.scene.tweens.killTweensOf(alert);
            alert.setVisible(false);
            alert.setAlpha(0);
            alert._inUse = false;   // liberar slot para la próxima invocación
        }

        // Notificar al HUD (vida = 0)
        this.scene.game.events.emit('bossHealthUpdate', 0, this.maxHP);
        this.scene.game.events.emit('bossDefeated');

        // Deshabilitar colisiones inmediatamente para que no siga dañando
        if (this.body) {
            this.body.checkCollision.none = true;
            this.body.stop();
        }

        // ── Animación de muerte: se aleja hacia atrás (encoge + fade) durante 2s ──
        const DEATH_DURATION = 2000;
        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: DEATH_DURATION,
            ease: 'Cubic.easeIn',   // acelera al final, da sensación de alejarse
            onComplete: () => {
                // Desactivar el sprite y la física una vez terminada la animación
                this.setActive(false);
                this.setVisible(false);
                if (this.body) this.body.enable = false;
            }
        });
    }
}
