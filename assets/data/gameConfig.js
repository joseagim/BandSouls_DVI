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
            life: 200,
            speed: 40,
            defenseMod: 1,
            attackMod: 1,
            attackDamage: 30,
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
        enemies: [{ type: "shadow", count: 1, spawnDelay: 2000 }, { type: "redVelvet", count: 1, spawnDelay: 2000 }],
        delay: 3000,
        },
        {
        waveNumber: 2,
        enemies: [{ type: "shadow", count: 3, spawnDelay: 3000 }],
        delay: 5000,
        },
    ],

    //...

};

export default gameConfig;