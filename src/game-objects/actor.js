import Phaser from "phaser";

export default class actor extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, tag, stats) {
        super(scene, x, y, tag);	

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        // Queremos que el enemigo no se salga de los límites del mundo
        this.body.setCollideWorldBounds();

        this.tag = tag;

        // Estadísticas
        this.maxHP = stats.life;
        this.life = stats.life;
        this.speed = stats.speed;
        this.defenseMod = stats.defenseMod;
        this.attackMod = stats.attackMod;
    }

    updateScore() {
        this.label.text = this.tag + ' HP: ' + this.life + '/' + this.maxHP;
    }

    getDamage(dmg) {
        this.life -= dmg;
        if (this.life <= 0) this.die();
        this.updateScore();
        console.log("RECOBE DAÑO");
    }

    die() {
        console.error("ESTAS LLAMANDO A DIE DE CLASE ABSTRACTA");
    }

    attack() {
        console.error("ESTAS LLAMANDO A ATAQUE DE CLASE ABSTRACTA");
    }
}