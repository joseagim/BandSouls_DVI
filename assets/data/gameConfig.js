const gameConfig = {
    shadowBaseStats: {
    life: 20,
    speed: 100,
    defenseMod: 1,
    attackMod: 1,
    attackDamage: 10,
    attackRange: 80,
    attackRadius: 20,
    attackCooldown: 1000,
    },

    playerBaseStats: {
    life: 100,
    speed: 150,
    defenseMod: 1,
    attackMod: 1,
    dashSpeed: 2000,
    dashDuration: 25,
    dashCooldown: 1000,
    },

    waves: [
        {
        waveNumber: 1,
        enemies: [{ type: "basic", count: 1, spawnDelay: 2000 }],
        delay: 3000,
        },
        {
        waveNumber: 2,
        enemies: [{ type: "basic", count: 3, spawnDelay: 3000 }],
        delay: 5000,
        },
        {
        waveNumber: 3,
        enemies: [{ type: "basic", count: 100, spawnDelay: 500 }],
        delay: 5000,
        },
    ],

    //...

};

export default gameConfig;