# BandSouls — Sistema de niveles y transiciones

> **¿Qué es esto?** Este documento describe cómo están conectados los niveles jugables, cuándo aparece cada portal, cómo se cambia de escena y qué estado se transfiere entre ellas. Léelo antes de tocar cualquier cosa relacionada con oleadas, portales o cambio de nivel.

---

## 1. Mapa de escenas jugables

```
Boot (carga de assets)
  └── level_fondo   ← Zona 1 (ciudad). Oleadas 1-4.
        ├── shop         ← Tienda (pausa entre oleadas)
        │     └── vuelve a level_fondo (o level_2)
        └── level_2      ← Zona 3 (bosque). Oleadas post-boss.
              └── level_fondo  ← retorno bidireccional

[PENDIENTE de implementar correctamente]
  level_boss        ← Zona 2 (boss Beethoven). Oleada 5.
```

> **Nota importante:** `level_boss.js` existe y tiene lógica de portal de tienda, pero actualmente la oleada 5 (Beethoven) está definida en `gameConfig.js` dentro de `waves[]` y se juega en `level_fondo`. El boss **no se carga en `level_boss`** todavía — la transición hacia ese nivel no está implementada.

---

## 2. Archivos clave

| Archivo | Rol |
|---|---|
| `assets/data/gameConfig.js` | Define oleadas, `shopWaves`, `nextLevelWaves` |
| `src/game-objects/wave-manager.js` | Lee esas listas y emite los eventos de portal |
| `src/scenes/level.js` | Clase base de todos los niveles jugables |
| `src/scenes/level_fondo.js` | Zona 1 — gestiona portales de tienda y de paso al nivel 2 |
| `src/scenes/level_boss.js` | Zona boss — solo portal de tienda implementado |
| `src/scenes/level2.js` | Zona 3 — portal de tienda + portal de retorno a Zona 1 |
| `src/scenes/shop.js` | Tienda — vuelve a `this.fromScene` al salir |

---

## 3. Cómo se decide cuándo aparece un portal

Todo parte de `gameConfig.js`:

```js
shopWaves:      [3, 6, 9],   // tras completar estas oleadas → portal de tienda
nextLevelWaves: [
    { wave: 4, nextScene: 'level_boss' },  // tras oleada 4 → sala del boss
    { wave: 5, nextScene: 'level_2' },     // tras boss → zona 3
],
```

`WaveManager.enemyDies()` comprueba, cuando `enemies <= 0`, en qué situación está `currentWave`:

```js
// wave-manager.js — enemyDies()
const nextLevelEntry = this.nextLevelWaves.find(e => e.wave === this.currentWave);
if (nextLevelEntry) {
    // Emite el objeto completo para que la escena sepa a dónde ir
    this.scene.game.events.emit('nextLevelTime', nextLevelEntry);
    // { wave: 4, nextScene: 'level_boss' }

} else if (this.shopWaves.includes(this.currentWave)) {
    this.scene.game.events.emit('finishWave', this.waveDelay);
    this.scene.game.events.emit('shopTime', this.currentWave);
    this.scene.time.delayedCall(this.waveDelay, () => this.startNextWave());

} else {
    // Oleada normal: esperar waveDelay y arrancar la siguiente
    this.scene.game.events.emit('finishWave', this.waveDelay);
    this.scene.time.delayedCall(this.waveDelay, () => this.startNextWave());
}
```

**Importante:** cuando se emite `nextLevelTime`, el WaveManager **no llama a `startNextWave()`**. La siguiente oleada solo se inicia cuando el jugador vuelve de la tienda o del nivel siguiente (ver sección 5).

---

## 4. Flujo completo de un portal de tienda

```
[Oleada shopWave termina]
    → WaveManager emite 'shopTime'
    → level_fondo / level2 escucha 'shopTime' → _spawnShopPortal()
        Portal aparece en el mapa (sprite 'portal', animación 'portalAnim')

[Jugador se acerca al portal (< 80 px)]
    → Timer de 3 segundos (jugador parpadea)
    → Al completarse:
        registry.set('savedWave', waveManager.currentWave)
        registry.set('ultiCooldown', { ... tiempos restantes de ulti ... })
        registry.set('playerState', { life, hasShield, shieldHP, weapons, currentWeaponIndex })
        registry.set('spawnPosition', { x: portal.x, y: portal.y })
        scene.start('shop', { from: this.scene.key })   ← guarda el nivel de origen

[Jugador sale de la tienda (portal en shop)]
    → shop descuenta el tiempo de tienda de los cooldowns de ulti
    → scene.start(this.fromScene)   ← vuelve al mismo nivel de origen
        → level_fondo / level2 restaura estado desde 'playerState' y 'savedWave'
```

---

## 5. Flujo completo del portal de paso al nivel siguiente (nextLevelWaves)

### Qué ocurre al terminar la oleada 4 (en level_fondo)

```
[Oleada 4 termina]
    → WaveManager emite 'nextLevelTime'
    → level_fondo escucha 'nextLevelTime' → _spawnNextLevelPortal() + _spawnShopPortal()
        - Portal de tienda (portal estándar) en el centro del mapa
        - Portal de nivel (sprite 'portal_level') en posición fija (130, 620)

[Jugador se acerca al portal de nivel (< 80 px)]
    → Timer de 3 segundos (jugador parpadea)
    → Al completarse:
        registry.set('savedWave', waveManager.currentWave)
        registry.set('ultiCooldown', { ... })
        registry.set('playerState', { life, hasShield, shieldHP, weapons, currentWeaponIndex })
        registry.set('spawnPosition', { x: 60, y: 60 })  ← spawn en nivel 2
        scene.start('level_2')                            ← HARDCODED aquí
```

**El nivel de destino está hardcodeado en `level_fondo.js` línea 240:**
```js
this.scene.start('level_2');
```

### Cooldown de 20 segundos al llegar

En `level_2`, el portal de retorno tiene un cooldown de 20 segundos para evitar que el jugador vuelva inmediatamente:
```js
// level2.js
this._returnPortalLocked = !!this._pendingPlayerState;
if (this._returnPortalLocked) {
    this.time.delayedCall(20000, () => { this._returnPortalLocked = false; });
}
```

---

## 6. Portal de retorno (level_2 → level_fondo)

`level_2` tiene un portal permanente en la posición `(60, 60)` que siempre está visible (sprite `portal_level`). Al usarlo:

```
[Jugador usa portal de retorno en level_2]
    → Timer de 3 segundos
    → Al completarse:
        registry.set('savedWave', waveManager.currentWave - 1)  ← oleada anterior
        registry.set('levelCrossState', {
            life, hasShield, shieldHP, weapons, currentWeaponIndex,
            remainingEnemies: { tipo: cantidad }   ← enemigos vivos en level_2
        })
        registry.set('spawnPosition', { x: 130, y: 620 })  ← posición del portal de nivel en level_fondo
        scene.start('level_fondo')
```

Al volver a `level_fondo`, `getStartingWave()` detecta que `savedWave` coincide con un valor de `nextLevelWaves` y en lugar de iniciar una oleada nueva:
- Restaura la oleada actual
- Spawnea los enemigos que quedaban en level_2 (`_restoreCrossState`)
- Pone el portal de nivel disponible inmediatamente (con cooldown de 20s si viene de level_2)

---

## 7. Cómo level_fondo decide en qué oleada empezar

```js
// level_fondo.js — getStartingWave()
getStartingWave() {
    const saved = this.registry.get('savedWave');
    if (saved != null) {
        this.registry.remove('savedWave');
        const nextLevelWaves = this.cache.json.get('data').nextLevelWaves ?? [];
        if (nextLevelWaves.includes(saved)) {
            // Venimos de level_2 o de tienda post-boss → no iniciar nueva oleada,
            // restaurar estado con portales ya abiertos
            this.waveManager.currentWave = saved;
            // ... emite eventos de HUD y spawna portales
            return null;  // ← null = no llamar a startNextWave()
        }
        return saved;  // oleada guardada normal (vuelta de tienda)
    }
    return 0;  // inicio de partida nueva
}
```

La misma lógica simplificada en `level2.js` y `level_boss.js`:
```js
getStartingWave() {
    const saved = this.registry.get('savedWave');
    if (saved != null) { this.registry.remove('savedWave'); return saved; }
    return 0;
}
```

---

## 8. Estado guardado en el registry de Phaser

El `game.registry` actúa como memoria persistente entre escenas. Estas son las claves usadas para las transiciones:

| Clave | Tipo | Cuándo se escribe | Cuándo se lee |
|---|---|---|---|
| `savedWave` | `number` | Al entrar a tienda o al usar portal de nivel | En `getStartingWave()` de la escena destino |
| `playerState` | `object` | Al entrar a tienda (portal de tienda o de nivel desde level_fondo) | En `level.js create()` → `_restorePlayerState()` |
| `levelCrossState` | `object` | Al volver de level_2 a level_fondo | En `level.js create()` → `_restoreCrossState()` |
| `spawnPosition` | `{x,y}` | Al entrar a tienda o al usar portal de nivel | En `level.js create()` (posición inicial del jugador) |
| `ultiCooldown` | `object` | Al entrar a tienda | En `level.js create()` y `shop.js` (descuenta tiempo) |
| `unlockedWeapons` | `string[]` | Cuando se desbloquea un arma (pickup) | En `level.js _initWeaponLocks()` |
| `level2Unlocked` | `bool` | Al spawnear el portal de nivel en level_fondo | No leído actualmente (reservado para HUD) |
| `trinkets` | `object[]` | Al comprar en tienda | En `hud.js` para mostrar iconos |
| `score` | `number` | Al matar enemigos | En HUD y tienda |

---

## 9. Dónde cambiar el nivel de destino del portal de nivel

En `gameConfig.js`, array `nextLevelWaves`:

```js
nextLevelWaves: [
    { wave: 4, nextScene: 'level_boss' },  // ← cambiar nextScene para redirigir
    { wave: 5, nextScene: 'level_2' },
],
```

Cada escena que gestiona portales de nivel (`level_fondo`, `level_boss`) escucha el evento `nextLevelTime` y recibe el objeto completo. Guarda `nextScene` internamente en `this._nextScene` y lo usa al activar el portal. Si `_nextScene` es `null` o `undefined`, hay un fallback hardcodeado en cada escena.

---

## 10. Estado actual vs. intención de diseño

| Zona | Archivo | Key de escena | Estado |
|---|---|---|---|
| Zona 1 (ciudad) | `level_fondo.js` | `'level_fondo'` | ✅ Funcional. Oleadas 1-4, portal de tienda, portal a Zona 3 |
| Zona 2 (boss) | `level_boss.js` | `'level_boss'` | ⚠️ Parcial. Tiene lógica de tienda pero no se accede desde ningún portal |
| Zona 3 (bosque) | `level2.js` | `'level_2'` | ✅ Funcional. Portal de tienda + retorno a Zona 1 |
| Tienda | `shop.js` | `'shop'` | ✅ Funcional. Vuelve siempre a `fromScene` |

**Problema pendiente:** `level_boss` debería estar entre Zona 1 y Zona 3. El flujo correcto sería:

```
level_fondo → (nextLevelWaves[4]) → level_boss → (bossDefeated) → level_2
```

Pero actualmente `scene.start('level_2')` salta directamente Zona 1 → Zona 3, y el boss está en la oleada 5 de `level_fondo`.

---

## 11. Guía rápida para añadir una nueva zona

1. **Crear la escena** extendiendo `Level`:
   ```js
   export default class MiNuevaZona extends Level {
       constructor() { super('mi_zona'); }
       create() {
           // cargar tilemap, configurar física, llamar super.create()
           // escuchar 'shopTime' para portal de tienda
           // añadir portal de salida con scene.start('zona_destino')
       }
       getStartingWave() {
           const saved = this.registry.get('savedWave');
           if (saved != null) { this.registry.remove('savedWave'); return saved; }
           return 0;
       }
   }
   ```

2. **Registrar la escena en `boot.js`** (array de escenas de Phaser).

3. **Definir las oleadas** en `gameConfig.js → waves[]`. Las oleadas se comparten entre todos los niveles — el nivel que esté activo las carga todas.

4. **Añadir `nextLevelWaves`** en `gameConfig.js` con el número de oleada que dispara el portal.

5. **Cambiar la línea `scene.start`** en la zona anterior para apuntar a la nueva zona.

6. **Guardar `playerState` y `spawnPosition`** antes de hacer `scene.start`, igual que hacen `level_fondo` y `level_2`.
