const gameConfig = {
    enemyStats: {
        shadow: {
            life: 20,
            speed: 100,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 10,
            attackRange: 80,
            attackRadius: 20,
            attackCooldown: 1000,
            canAttack: true,
            hasDamaged: false,
            is_knockback: false,
        },

        redVelvet: {
            life: 500,
            speed: 20,
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

    },

    playerBaseStats: {
    life: 100,
    speed: 150,
    defenseMod: 1,
    attackMod: 1,
    dashSpeed: 2000,
    dashDuration: 50,
    dashCooldown: 1000,
    },

    // This tells the pool for the wave manager which enemies to keep track of
    poolData: [
        {shadow: [] },
        {redVelvet: [] },
    ],

    waves: [
        {
        waveNumber: 1,
        enemies: [{ type: "shadow", count: 1, spawnDelay: 2000 }],
        delay: 3000,
        },
        {
        waveNumber: 2,
        enemies: [{ type: "shadow", count: 3, spawnDelay: 3000 }],
        delay: 5000,
        },
        {
        waveNumber: 3,
        enemies: [{ type: "shadow", count: 100, spawnDelay: 500 }],
        delay: 5000,
        },
    ],

    //...

};

export default gameConfig;