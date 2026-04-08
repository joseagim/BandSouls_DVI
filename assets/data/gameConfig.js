const gameConfig = {
    enemyStats: {
        shadow: {
            life: 20,
            speed: 100,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 30,
            attackRange: 80,
            attackRadius: 20,
            attackCooldown: 1000,
            canAttack: true,
            hasDamaged: false,
            is_knockback: false,
        },

        thief: {
            life: 20,
            speed: 100,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 30,
            attackRange: 80,
            attackRadius: 20,
            attackCooldown: 1000,
            canAttack: true,
            hasDamaged: false,
            is_knockback: false,
        },

        kamikaze: {
            life: 1, // Vida muy baja para que muera al primer golpe
            speed: 150,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 50,
            attackRange: 50,
            attackRadius: 100,  // Radio de explosión
            attackCooldown: 2000,
            canAttack: true,
            hasDamaged: false,
            is_knockback: false,
        },

        redVelvet: {
            life: 500,
            speed: 20,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 50,
            attackRange: 80,
            attackRadius: 20,
            attackCooldown: 1000,
            canAttack: true,
            hasDamaged: false,
            is_knockback: false,
        },

        beethoven: {
            life: 300,
            speed: 0,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 20,      // daño de sus proyectiles
            collisionDamage: 5,   // daño por contacto
            attackRange: 0,
            attackRadius: 0,
            attackCooldown: 3000,  // ms entre patrones
            canAttack: true,
            hasDamaged: false,
            is_knockback: false,
        },

    },

    playerBaseStats: {
        life: 100,
        speed: 150,
        defenseMod: 1,
        attackMod: 1,
        dashSpeed: 2000,
        dashDuration: 50,
        dashCooldown: 1000,
        regenDelay: 3000,
    },

    // This tells the pool for the wave manager which enemies to keep track of
    poolData: [
        { shadow: [] },
        { thief: [] },
        { kamikaze: [] },
        { redVelvet: [] },
        { beethoven: [] },
    ],

    waves: [
        {
            waveNumber: 1,
            enemies: [
                { type: "beethoven", count: 1, spawnDelay: 0 }
            ],
            delay: 3000,
        },
        {
            waveNumber: 2,
            enemies: [
                { type: "shadow", count: 3, spawnDelay: 3000 },
                { type: "thief", count: 1, spawnDelay: 3000 },
                { type: "kamikaze", count: 2, spawnDelay: 4000 }
            ],
            delay: 5000,
        },
        {
            waveNumber: 3,
            enemies: [
                { type: "beethoven", count: 1, spawnDelay: 0 }
            ],
            delay: 5000,
        },
        {
            waveNumber: 4,
            enemies: [
                { type: "shadow", count: 5, spawnDelay: 2000 },
                { type: "thief", count: 3, spawnDelay: 3000 }
            ],
            delay: 3000,
        },
    ],

    //...

};

export default gameConfig;