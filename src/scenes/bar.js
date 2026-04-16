import Phaser from "phaser";

export default class Bar extends Phaser.GameObjects.Container {
    constructor(scene, x, y, borderKey, barKey) {
        super(scene, x, y);

        this.frame = scene.add.image(0, 0, borderKey).setOrigin(0);
        this.bar = scene.add.image(4, 4, barKey).setOrigin(0);

        this.add([this.frame, this.bar]);
        scene.add.existing(this);

        this._percentage = 1;
        this.bar.setCrop(0, 0, this.bar.width, this.bar.height);
    }

    setValue(percentage) {
        this._percentage = percentage;
        const newWidth = this.bar.width * percentage;
        this.bar.setCrop(0, 0, newWidth, this.bar.height);
    }

    setBarTexture(key) {
        if (this.bar.texture.key === key) return;
        this.bar.setTexture(key);
        const newWidth = this.bar.width * this._percentage;
        this.bar.setCrop(0, 0, newWidth, this.bar.height);
    }
}