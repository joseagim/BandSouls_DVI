import Phaser from 'phaser';

export default class Pickup extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y, config) {
        const textureKey = Pickup._ensureTexture(scene, config);
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setImmovable(true);
        this.body.allowGravity = false;

        this.pickupConfig = config;
        this.setScale(1.2);
        this.setDepth(5);

        if (config.tint) this.setTint(config.tint);

        // bob flotante
        this._baseY = y;
        scene.tweens.add({
            targets: this,
            y: y - 8,
            duration: 900,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });

        // desvanece y destruye si nadie lo recoge
        this._expireTimer = scene.time.delayedCall(12000, () => this._fadeAndDestroy());
    }

    static _ensureTexture(scene, config) {
        if (config.pickupType === 'weapon') return `${config.slot}-icon`;

        const key = `pickup-${config.id}`;
        if (!scene.textures.exists(key)) {
            const gfx = scene.make.graphics({ add: false });
            gfx.fillStyle(config.tint ?? 0xffffff, 1);
            gfx.fillCircle(10, 10, 10);
            gfx.generateTexture(key, 20, 20);
            gfx.destroy();
        }
        return key;
    }

    collect(player) {
        if (!this.active) return;
        this.setActive(false).setVisible(false);
        this._expireTimer?.remove();
        if (this.body) this.body.enable = false;

        const cfg = this.pickupConfig;
        if (cfg.pickupType === 'weapon') {
            this._collectWeapon(player, cfg);
        } else {
            this._collectPowerup(player, cfg);
        }

        player.scene.game.events.emit('pickupCollected', cfg);
        this.destroy();
    }

    _collectWeapon(player, cfg) {
        const slots = player.scene.cache.json.get('data').pickupConfig.weaponSlots;
        const index = slots[cfg.slot];
        if (index === undefined) return;

        player.gunManager.unlockWeapon(index);
        player.gunManager.switchTo(index);

        // persistir entre niveles
        const unlocked = player.scene.registry.get('unlockedWeapons') || [];
        if (!unlocked.includes(cfg.slot)) {
            unlocked.push(cfg.slot);
            player.scene.registry.set('unlockedWeapons', unlocked);
        }
    }

    _collectPowerup(player, cfg) {
        if (cfg.instant) {
            if (cfg.stat === 'life') {
                player.life = Math.min(player.life + cfg.value, player.maxHP);
                player.updateHealth();
            } else {
                player[cfg.stat] += cfg.value;
            }
        } else {
            player[cfg.stat] += cfg.value;
            if (cfg.stat === 'life') player.updateHealth();

            player.scene.time.delayedCall(cfg.duration, () => {
                if (player.active) {
                    player[cfg.stat] -= cfg.value;
                    if (cfg.stat === 'life') player.updateHealth();
                }
            });
        }
    }

    _fadeAndDestroy() {
        if (!this.active) return;
        this.scene?.tweens.add({
            targets: this,
            alpha: 0,
            duration: 500,
            onComplete: () => { if (this.active) this.destroy(); },
        });
    }
}
