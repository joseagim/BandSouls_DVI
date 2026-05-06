# Boss Beethoven — Referencia técnica

> **Para IAs:** Este documento describe el estado actual (mayo 2026) de la implementación del boss Beethoven en BandSouls. Léelo entero antes de modificar cualquier archivo del boss.

---

## 1. Mapa de archivos

```
src/game-objects/enemies/
  bossBeethoven.js            ← Clase principal del boss
  bossBeethovenProjectile.js  ← Pool de proyectiles

src/game-objects/
  enemy-factory.js            ← Registro 'beethoven' → EnemyBeethoven
  pool.js                     ← Pool genérico de enemigos (spawnInactive)
  spawner.js                  ← Punto de entrada del spawn desde WaveManager
  wave-manager.js             ← Controla oleadas; llama enemyDies() al morir el boss

src/scenes/
  boot.js                     ← Carga de assets (líneas 112-117 y 276-279)
  level.js                    ← Registra overlap proyectil↔jugador, efectos de cámara
  hud.js                      ← Barra de vida del boss (líneas 121-191)

assets/data/
  gameConfig.js               ← Stats del boss (líneas 55-66), poolData, waves

assets/bosses/beethoven/
  beethoven.png               ← Sprite estático 32×48 px
  alert.png                   ← Sprite de advertencia (imagen estática)
  attack.png                  ← Spritesheet animado 224×32 px × 5 frames (vertical)
  attack.json                 ← Atlas con frames attack_0…attack_4
  bossPatterns.json           ← Patrones activos usados en el juego
  bossPatterns2.json          ← Patrones alternativos (no cargados actualmente)
  BOSS.md                     ← Este archivo
```

---

## 2. Jerarquía de clases

```
Phaser.GameObjects.Sprite
  └── actor.js          (vida, stats base, getDamage → die)
        └── Enemy        (spawn, die base, knockback, move, preUpdate con pathfinding)
              └── EnemyBeethoven   ← BOSS PRINCIPAL
                    │
                    └── usa: BossProjectile  (NO hereda de Enemy)
```

**Actor** — provee `this.life`, `this.maxHP`, `this.speed`, `getDamage(dmg)` (llama `die()` si life ≤ 0).  
**Enemy** — provee `spawn(x,y)` base (resetea vida y body), `die()` base (llama `scene.enemyDies(this)`), `knockback()`.  
**EnemyBeethoven** — sobreescribe todo lo relevante; el boss NO se mueve ni recibe knockback.

---

## 3. Stats (gameConfig.js)

```js
beethoven: {
    life:            300,
    speed:           0,
    attackDamage:    10,      // daño de proyectiles
    collisionDamage: 5,       // daño por contacto directo
    attackRange:     0,
    attackRadius:    0,
    attackCooldown:  3000,    // ms entre ejecuciones de patrón
    canAttack:       true,
    hasDamaged:      false,
    is_knockback:    false,
}
```

Pool: `{ beethoven: [] }` en `poolData`. Oleada 10 (waveNumber 10):
```js
{ type: "beethoven", count: 1, spawnDelay: 0 }
```

---

## 4. Flujo de vida completo

```
WaveManager.startNextWave()  (oleada 10)
    → spawner.spawnMultiple({ type:'beethoven', count:1, spawnDelay:0 })
        → pool.spawnInactive('beethoven')
            → EnemyFactory.createElement('beethoven')  [si pool vacío]
              → new EnemyBeethoven(scene, 0, 0, stats)   ← constructor
        → spawner.spawn(x, y, 'beethoven')
            → enemy.spawn(x, y)                          ← spawn()
                → super.spawn(centerX, centerY)          ← Enemy.spawn
                → _startCycle()                          ← arranca el timer
                → game.events.emit('beethovenSpawned', this)

Cada attackCooldown ms:
    _startCycle callback
        → _executeRandomPattern()
            → for each attack: delayedCall(attack.wait) → _scheduleAttack(attack)
                → _getInactiveAlert() → mostrar alerta (fade in/hold/fade out)
                → delayedCall(attack.alert) → projectilePool.fire(laneY)
        → _startCycle()  [auto-reprograma el siguiente ciclo]

Boss muere (life ≤ 0):
    actor.getDamage → die()
        → isDead = true
        → cancela _cycleTimer + _activeTimers
        → projectilePool.deactivateAll()
        → oculta alertas, mata tweens
        → game.events.emit('bossHealthUpdate', 0, max)
        → game.events.emit('bossDefeated')
        → scene.enemyDies(this)   ← WaveManager.enemyDies() → siguiente oleada
        → tween de muerte (encoge + fade, 2s, Cubic.easeIn)
        → al terminar: setActive(false), setVisible(false), body.enable=false
```

> ⚠️ **Bug histórico corregido:** `pool.spawnInactive()` llamaba a `element.spawn()` SIN coordenadas y luego `spawner.spawn()` lo llamaba de nuevo. Esto hacía que `_startCycle()` se ejecutase dos veces. Está arreglado: `pool.spawnInactive()` ya NO llama a `spawn()`.

---

## 5. Constructor — propiedades internas

| Propiedad | Tipo | Descripción |
|---|---|---|
| `attackDamage` | number | Daño de proyectiles (de stats) |
| `collisionDamage` | number | Daño por contacto directo (de stats) |
| `attackCooldown` | number | Ms entre patrones (de stats, por defecto 3000) |
| `canAttack` | bool | Puede atacar (de stats) |
| `is_knockback` | bool | Siempre false; el boss es inmóvil |
| `patterns[]` | array | Patrones leídos de `bossPatterns` (cache JSON) |
| `projectilePool` | BossProjectile | Pool de 20 proyectiles |
| `_alerts[]` | Phaser.Image[] | Pool de 20 sprites de alerta |
| `_activeTimers[]` | TimerEvent[] | Timers en curso (se cancelan en die()) |
| `_cycleTimer` | TimerEvent | Timer del ciclo principal |
| `isDead` | bool | Flag para evitar doble die() |

**Cuerpo físico (hitbox en espacio de textura, escala ×4):**
- `setSize(15, 38)` → en pantalla: 60×152 px
- `setOffset(9, 10)`
- `setImmovable(true)`, `setPushable(false)`, `allowGravity = false`

---

## 6. Sistema de carriles

La pantalla se divide en **9 secciones iguales**. Los carriles son las posiciones **1 a 8**.

```js
_laneY(pos) {
    // Usa el menor entre el alto del mundo (mapa) y el alto del canvas:
    // - Mapa grande (> canvas): usa scale.height → mismo comportamiento que antes.
    // - Mapa pequeño (< canvas, cámara estática): usa worldH → carriles dentro del mapa.
    const worldH     = this.scene.physics.world.bounds.height;
    const effectiveH = Math.min(worldH, this.scene.scale.height);
    return (effectiveH / 9) * pos;
}
```

`laneY` es un offset en **espacio de pantalla** (relativo al borde superior visible).
Al posicionar alertas y proyectiles se convierte a coordenadas de mundo con:
```js
worldY = cam.scrollY + laneY
```

Con `effectiveH = 736` (mapa mayor o igual al canvas), alturas de ejemplo:

| Carril (pos) | Y en pantalla |
|---|---|
| 1 | ~82 px |
| 2 | ~164 px |
| 3 | ~245 px |
| 4 | ~327 px |
| 5 | ~409 px |
| 6 | ~491 px |
| 7 | ~572 px |
| 8 | ~654 px |

Si el mapa es más pequeño (p.ej. 400 px), `effectiveH = 400` y los carriles se comprimen proporcionalmente, manteniéndose siempre dentro de los límites del nivel.

---

## 7. Sistema de alertas

Cada ataque programa una secuencia visual en el borde derecho de la pantalla:

```
Timing (alert = ms de duración total de la advertencia):
  t=0           → fade in (30ms): alpha 0→1
  t=30          → hold (alert - 80ms): completamente visible
  t=alert-50    → fade out (30ms): alpha 1→0
  t=alert-20    → setVisible(false), libera slot (_inUse = false)
  t=alert       → 🔥 projectilePool.fire(laneY)
```

**Pool de alertas:** 20 sprites `Phaser.Image` creados en el constructor.  
Cada uno tiene `_inUse` (bool) como flag de disponibilidad.  
`_getInactiveAlert()` busca el primero con `!_inUse`. Si el pool está agotado, el ataque se ejecuta igualmente (sin alerta visual).

**Posición X de la alerta:**
```js
alertX = cam.scrollX + screenW - 20 - (alertSprite.width * alertSprite.scaleX) / 2
```
La alerta está centrada en el borde derecho, con 20 px de margen.

---

## 8. BossProjectile (pool de proyectiles)

**Archivo:** `src/game-objects/enemies/bossBeethovenProjectile.js`  
**No hereda de Enemy.** Es una clase de servicio independiente.

### Constructor
```js
new BossProjectile(scene, poolSize=20, damage)
```
Crea `poolSize` sprites de física estática. La animación `beethoven_attack_anim` se crea una sola vez (guard con `scene.anims.exists`).

### Asset
- Spritesheet: `attack.png` (224×32 px por frame, 5 frames en eje Y)
- Atlas: `attack.json` (frames: `attack_0` … `attack_4`)
- Animación: 10 fps, repeat -1

### Hitbox del proyectil (en espacio de textura, escala ×4)
- `setSize(206, 14)` → en pantalla: 824×56 px
- `setOffset(9, 9)`

### Métodos públicos

| Método | Descripción |
|---|---|
| `fire(laneY)` | Activa un sprite libre, lo posiciona fuera de pantalla por la derecha, lanza con `setVelocity(-600, 0)` |
| `deactivateAll()` | Desactiva todos los activos (se llama en die()) |
| `update()` | Desactiva sprites cuyo borde derecho ha salido por la izquierda |

### Posición de spawn
```js
startX = cam.scrollX + screenW + (sprite.width * sprite.scaleX) / 2
// El borde IZQUIERDO del sprite coincide con el borde derecho de pantalla → entra sin parpadeo
```

### Colisión con el jugador (registrada en level.js)
```js
this.game.events.on('beethovenSpawned', (boss) => {
    this.physics.add.overlap(
        this.player,
        boss.projectilePool.physicsGroup,
        (player, projectile) => {
            if (!player.invincible && projectile.active)
                player.getDamage(projectile.damage);
        },
        null, this
    );
});
```
> ⚠️ **Bug histórico corregido:** Este listener usaba `.on()` (acumulativo entre reinicios). Ahora usa `.on()` pero es seguro porque el boss solo se spawna una vez y el HUD limpia sus propios listeners en `shutdown`. Si en el futuro el boss puede spawnearse varias veces, cambiar a `.once()` o limpiar en `scene.shutdown`.

---

## 9. bossPatterns.json (patrones activos)

Archivo cargado en Boot.js:
```js
// Boot.js preload():
this.cache.json.add('bossPatterns', bossPatterns)
// (importado directamente como módulo JS, no con this.load.json)
```

Accedido en el constructor del boss:
```js
scene.cache.json.get('bossPatterns')
```

### Estructura del JSON
```json
{
  "patterns": [
    {
      "id": "nombre_unico",
      "description": "Descripción para devs",
      "attacks": [
        { "wait": 0,   "alert": 1000, "pos": 3 },
        { "wait": 700, "alert": 600,  "pos": 5 }
      ]
    }
  ]
}
```

- `wait`: ms desde el inicio del patrón hasta programar este ataque (relativo, NO acumulativo).
- `alert`: duración total de la advertencia visual en ms (mínimo recomendado: 100ms).
- `pos`: carril de 1 a 8.

### Patrones activos en bossPatterns.json

Todos los patrones actuales tienen `alert=1000ms` y `wait=0` (simultáneos), bloqueando 6 o 7 de los 8 carriles:

| ID | Carriles bloqueados | Carriles libres | Escape |
|---|---|---|---|
| `single_2` | 1,3,4,5,6,7,8 | **2** | Solo carril 2 |
| `single_7` | 1,2,3,4,5,6,8 | **7** | Solo carril 7 |
| `single_3` | 1,2,4,5,6,7,8 | **3** | Solo carril 3 |
| `single_6` | 1,2,3,4,5,7,8 | **6** | Solo carril 6 |
| `double_1_8` | 2,3,4,5,6,7 | **1 y 8** | Extremos |
| `double_2_7` | 1,3,4,5,6,8 | **2 y 7** | - |
| `double_3_7` | 1,2,4,5,6,8 | **3 y 7** | - |
| `double_2_6` | 1,3,4,5,7,8 | **2 y 6** | - |
| `extra_4_8` | 1,2,3,5,6,7 | **4 y 8** | - |
| `extra_1_5` | 2,3,4,6,7,8 | **1 y 5** | - |

> **Nota:** `bossPatterns2.json` contiene 5 patrones alternativos más complejos (temporales, escalonados). No está cargado actualmente. Para usarlo, cambiar el import en Boot.js.

### Selección de patrón
```js
// _executeRandomPattern() — selección completamente aleatoria (sin filtro anti-repetición)
const pattern = Phaser.Utils.Array.GetRandom(this.patterns);
```
> No hay lógica de `lastPatternId`. Puede repetirse el mismo patrón consecutivamente.

---

## 10. Integración con Level.js

```js
// level.js — create()

// 1. Registra overlap proyectil → jugador al spawnearse el boss
this.game.events.on('beethovenSpawned', (boss) => {
    this.physics.add.overlap(
        this.player,
        boss.projectilePool.physicsGroup,
        (player, projectile) => {
            if (!player.invincible && projectile.active) {
                // sonido y cooldown anti-spam get_hit
                player.getDamage(projectile.damage);
            }
        },
        null, this
    );
    // Efecto de cámara: zoom out al 100% en 1.5s
    this.tweens.add({ targets: this.cameras.main, zoom: 1, duration: 1500, ease: 'Sine.easeInOut' });
});

// 2. Efecto de cámara al morir el boss
this.game.events.on('bossDefeated', () => {
    this.tweens.add({ targets: this.cameras.main, zoom: 1.5, duration: 1000 });
});
```

**scene.enemyDies(enemy)** — método en Level que llama a `waveManager.enemyDies()` para decrementar el contador y avanzar a la oleada 11 cuando el boss muere.

---

## 11. Integración con HUD.js

El HUD escucha dos eventos globales para la barra de vida del boss:

```
game.events.emit('bossHealthUpdate', currentLife, maxLife)
    → Muestra el container, recalcula ancho, cambia color:
      pct > 0.5  → rojo  (#ff2222)
      pct > 0.25 → naranja (#ff8800)
      pct ≤ 0.25 → rojo intenso (#ff0000)

game.events.emit('bossDefeated')
    → Oculta el container tras 2000ms
```

**Posición de la barra:** esquina inferior derecha.  
- X: `screenWidth - 280 - 20 = screenWidth - 300`
- Y: `screenHeight - 60`
- Tamaño: 280×18 px
- Etiqueta: `"BEETHOVEN"` en amarillo (#ffcc00) encima de la barra.

El HUD limpia todos sus listeners de `game.events` en su evento `shutdown` (array `_gameEventHandlers`), así que no hay riesgo de acumulación.

---

## 12. preUpdate del boss

```js
preUpdate(t, dt) {
    // Llama DIRECTAMENTE a Phaser.GameObjects.Sprite.preUpdate,
    // saltándose Enemy.preUpdate (que tiene lógica de pathfinding/movimiento).
    Phaser.GameObjects.Sprite.prototype.preUpdate.call(this, t, dt);

    if (!this.active || this.isDead) return;

    // Flip horizontal según la posición del jugador
    if (this.scene.player) {
        this.flipX = (this.scene.player.x < this.x);
    }

    // Avanzar el pool de proyectiles (desactiva los que salen por la izquierda)
    this.projectilePool.update();
}
```

---

## 13. Daño por contacto

```js
attack(player) {
    if (!this.active || this.isDead || player.invincible) return;
    player.getDamage(this.collisionDamage);  // collisionDamage = 5
}
```

Este método lo llama `level.js` desde el overlap genérico `spawner.PhysicsGroup() ↔ player`. No tiene cooldown propio (el cooldown lo gestiona el invincibility frame del jugador).

---

## 14. Boot.js — carga de assets

```js
// Imports (top of file)
import beethovenSprite      from '../../assets/bosses/beethoven/beethoven.png'
import beethovenAlert       from '../../assets/bosses/beethoven/alert.png'
import beethovenAttackSheet from '../../assets/bosses/beethoven/attack.png'
import beethovenAttackAtlas from '../../assets/bosses/beethoven/attack.json'
import bossPatterns         from '../../assets/bosses/beethoven/bossPatterns.json'

// preload()
this.load.image('beethoven',        beethovenSprite);
this.load.image('beethoven_alert',  beethovenAlert);
this.load.atlas('beethoven_attack', beethovenAttackSheet, beethovenAttackAtlas);
this.cache.json.add('bossPatterns', bossPatterns);
// ↑ cache.json.add en vez de load.json porque el JSON se importa como módulo JS
```

---

## 15. Guía: añadir un patrón nuevo

Basta con editar `bossPatterns.json`. **No hay que tocar ningún .js.**

```json
{
  "id": "mi_patron",
  "description": "Descripción para devs",
  "attacks": [
    { "wait": 0,   "alert": 800, "pos": 1 },
    { "wait": 0,   "alert": 800, "pos": 5 },
    { "wait": 1000,"alert": 600, "pos": 3 },
    { "wait": 1000,"alert": 600, "pos": 7 }
  ]
}
```

**Reglas:**
- `alert ≥ 100ms` siempre (el timing fade in/out necesita al menos 80ms).
- Dejar al menos 1 carril libre simultáneamente para que el jugador pueda sobrevivir.
- Ataques con el mismo `wait` se lanzan en paralelo.
- La duración total del patrón = `max(wait) + max(alert)` de sus ataques.
- El pool de alertas y proyectiles tiene 20 slots. No lanzar más de 20 ataques simultáneos.

---

## 16. Guía: modificar comportamiento del boss

### Cambiar daño o cooldown
→ Editar `gameConfig.js`, objeto `beethoven`. No tocar el código JS.

### Cambiar velocidad de proyectiles
→ `bossBeethovenProjectile.js`, línea `this.speed = 600;`

### Añadir lógica de fase (p.ej. acelerar al 50% de vida)
→ Sobreescribir `getDamage()` en `bossBeethoven.js`:
```js
getDamage(dmg) {
    super.getDamage(dmg);  // emite bossHealthUpdate
    if (!this._phase2 && this.life <= this.maxHP * 0.5) {
        this._phase2 = true;
        this.attackCooldown = 1500;
        // cancelar y re-lanzar el ciclo con el nuevo cooldown:
        if (this._cycleTimer) { this._cycleTimer.remove(); this._cycleTimer = null; }
        this._startCycle();
    }
}
```
Resetear `_phase2` a `false` en `spawn()` para reutilización del pool.

### Añadir animación al boss
El boss usa `'beethoven'` como key de imagen estática. Para animarlo:
1. Cambiar `this.load.image` → `this.load.spritesheet` o `this.load.atlas` en Boot.js.
2. Crear la animación en el constructor del boss (`if (!scene.anims.exists(...))`).
3. Llamar `this.play(...)` en `spawn()`.

### Cambiar el número de carriles
Actualmente son 8 carriles con divisor 9. Para cambiar a N carriles:
```js
// bossBeethoven.js
_laneY(pos) {
    return (this.scene.scale.height / (N + 1)) * pos;
}
```
Y actualizar `bossPatterns.json` para que `pos` vaya de 1 a N.

---

## 17. Gotchas y advertencias conocidas

| ⚠️ | Descripción |
|---|---|
| **Pool reuse** | Al morir, el boss se devuelve al pool inactivo. `spawn()` debe resetear TODOS los estados internos (`isDead`, `_phase2`, etc.) porque el objeto se reutiliza. |
| **game.events es global** | Los listeners en `game.events.on()` persisten entre reinicios de escena. El HUD los limpia en `shutdown`. Level.js usa `.on()` (acumulativo); si Level se reinicia varias veces, los listeners se apilan. Considerar usar `.once()` o limpiar en `shutdown`. |
| **bossPatterns.json vs bossPatterns2.json** | Solo `bossPatterns.json` está cargado en Boot.js. `bossPatterns2.json` contiene patrones alternativos que **no están activos**. |
| **collisionDamage sin cooldown** | El boss aplica `collisionDamage` cada frame que el jugador está en contacto (limitado solo por los iframes del jugador). |
| **Alertas con pool agotado** | Si los 20 slots de alerta están ocupados, `_getInactiveAlert()` devuelve `null` y el ataque se ejecuta igualmente (proyectil sin alerta visual). Raramente ocurre con los patrones actuales. |
| **Pathfinding de Enemy** | `preUpdate` llama directamente a `Phaser.GameObjects.Sprite.prototype.preUpdate` para saltarse el pathfinding de `Enemy.preUpdate`, que lanzaría errores porque el boss no tiene `scene.gridWidth/gridHeight`. |
