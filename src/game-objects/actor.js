import Phaser from "phaser";

export default class actor extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, tag, stats) {
        super(scene, x, y, tag);	

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        // Queremos que el enemigo no se salga de los límites del mundo
        this.body.setCollideWorldBounds();

        // Estadísticas
        this.life = stats.life;
        this.speed = stats.speed;
        this.defenseMod = stats.defenseMod;
        this.attackMod = stats.attackMod;
    }

    getDamage(dmg) {
        this.life -= dmg;
        if (this.life <= 0) this.die();
        console.log('HP left: %d', this.life);
    }

    die() {
        console.error("ESTAS LLAMANDO A DIE DE CLASE ABSTRACTA");
    }

    attack() {
        console.error("ESTAS LLAMANDO A ATAQUE DE CLASE ABSTRACTA");
    }
}