const gameConfig = {
    enemyStats: {
        shadow: {
            life: 20,
            speed: 100,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 40,
            attackRange: 80,
            attackRadius: 20,
            attackCooldown: 1000,
            canAttack: true,
            hasDamaged: false,
            is_knockback: false,
        },

        redVelvet: {
            life: 100,
            speed: 40,
            defenseMod: 1,
            attackMod: 1,
            rangedAttackDamage: 50,
            meleeAttackDamage: 20,
            rangedAttackRange: 300,
            meleeAttackRange: 150,
            attackRadius: 20,
            rangedAttackCooldown: 5000,
            meleeAttackCooldown: 2500,
            canAttackRanged: true,
            canAttackMelee: true,
            hasDamaged: false,
            is_knockback: false,
        },

        thief: {
            life: 20,
            speed: 100,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 40,
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

        beethoven: {
            life: 300,
            speed: 0,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 10,      // daño de sus proyectiles
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
            speedMult: 0.75,
            cooldownMult: 1,
            enemies: [
                { type: "shadow", count: 4, spawnDelay: 2000 },
                { type: "shadow", count: 4, spawnDelay: 3000 },
            ],
            delay: 3000,
        },
        {
            waveNumber: 2,
            speedMult: 0.75,
            cooldownMult: 1,
            enemies: [
                { type: "shadow", count: 5, spawnDelay: 3000 },
                { type: "shadow", count: 5, spawnDelay: 2000 },
                { type: "kamikaze", count: 2, spawnDelay: 4000 }
            ],
            delay: 5000,
        },
        {
            waveNumber: 3,
            speedMult: 0.75,
            cooldownMult: 0.8,
            enemies: [
                { type: "shadow", count: 8, spawnDelay: 2000 },
                { type: "thief", count: 5, spawnDelay: 3000 },
                { type: "kamikaze", count: 3, spawnDelay: 5000 }
            ],
            delay: 20000,
        },
        {
            waveNumber: 4,
            speedMult: 1,
            cooldownMult: 0.8,
            enemies: [
                { type: "shadow", count: 8, spawnDelay: 3000 },
                { type: "shadow", count: 8, spawnDelay: 2000 },
                { type: "kamikaze", count: 4, spawnDelay: 3000 },
            ],
            delay: 3000,
        },
        {
            waveNumber: 5,
            speedMult: 1,
            cooldownMult: 0.8,
            enemies: [
                { type: "shadow", count: 6, spawnDelay: 3000 },
                { type: "shadow", count: 3, spawnDelay: 2000 },
                { type: "thief", count: 5, spawnDelay: 3000 },
                { type: "kamikaze", count: 3, spawnDelay: 4000 },
                { type: "redVelvet", count: 1, spawnDelay: 6000 }
            ],
            delay: 3000,
        },
        {
            waveNumber: 6,
            speedMult: 1,
            cooldownMult: 0.8,
            enemies: [
                { type: "shadow", count: 8, spawnDelay: 3000 },
                { type: "shadow", count: 4, spawnDelay: 2000 },
                { type: "thief", count: 7, spawnDelay: 3000 },
                { type: "kamikaze", count: 5, spawnDelay: 4000 },
                { type: "redVelvet", count: 2, spawnDelay: 6000 }
            ],
            delay: 20000,
        },
        {
            waveNumber: 7,
            speedMult: 1,
            cooldownMult: 0.8,
            enemies: [
                { type: "shadow", count: 8, spawnDelay: 2000 },
                { type: "thief", count: 5, spawnDelay: 3000 },
                { type: "thief", count: 5, spawnDelay: 2500 },
                { type: "thief", count: 5, spawnDelay: 3500 },
                { type: "kamikaze", count: 5, spawnDelay: 5000 },
                { type: "redVelvet", count: 3, spawnDelay: 6000 }
            ],
            delay: 3000,
        },
        {
            waveNumber: 8,
            speedMult: 1.2,
            cooldownMult: 0.8,
            enemies: [
                { type: "shadow", count: 8, spawnDelay: 2000 },
                { type: "thief", count: 7, spawnDelay: 2500 },
                { type: "thief", count: 7, spawnDelay: 3000 },
                { type: "thief", count: 7, spawnDelay: 3500 },
                { type: "kamikaze", count: 8, spawnDelay: 5000 },
                { type: "redVelvet", count: 3, spawnDelay: 6000 }
            ],
            delay: 3000,
        },
        {
            waveNumber: 9,
            speedMult: 1.2,
            cooldownMult: 0.7,
            enemies: [
                { type: "shadow", count: 10, spawnDelay: 2000 },
                { type: "thief", count: 7, spawnDelay: 2500 },
                { type: "thief", count: 7, spawnDelay: 3000 },
                { type: "thief", count: 7, spawnDelay: 3500 },
                { type: "kamikaze", count: 8, spawnDelay: 5000 },
                { type: "redVelvet", count: 3, spawnDelay: 6000 }
            ],
            delay: 20000,
        },
        {
            waveNumber: 10,
            enemies: [
                { type: "beethoven", count: 1, spawnDelay: 0 }
            ],
            delay: 3000,
        },
    ],

    shopWaves: [3, 6, 9],

    //...

};

export default gameConfig;