/**
 * Clase que representa un objeto/trinket del juego.
 * Contiene datos del item y métodos para aplicar buffs/debuffs al jugador.
 */
export default class Item {
    /**
     * @param {Object} data - Datos del item del JSON
     */
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.buffs = data.buffs || {};
        this.debuffs = data.debuffs || {};
        this.price = data.price;
        this.weight = data.weight;
        this.purchased = false;
        this.image = data.image;
    }

    /**
     * Aplica los buffs y debuffs de este item al jugador.
     * Los modificadores aditivos se suman/restan directamente a las stats del jugador.
     * @param {Player} player
     */
    applyTo(player) {
        // Aplicar buffs
        for (const [stat, value] of Object.entries(this.buffs)) {
            if (player[stat] !== undefined) {
                player[stat] += value;
            }
        }
        // Aplicar debuffs
        for (const [stat, value] of Object.entries(this.debuffs)) {
            if (player[stat] !== undefined) {
                player[stat] += value;
            }
        }

        // Actualizar la vida máxima si se ha cambiado 'life'
        if (this.buffs.life !== undefined || this.debuffs.life !== undefined) {
            const lifeDelta = (this.buffs.life || 0) + (this.debuffs.life || 0);
            player.maxHP += lifeDelta;
            // Asegurar que la vida actual no supere la nueva máxima
            if (player.life > player.maxHP) {
                player.life = player.maxHP;
            }
            player.updateHealth();
        }
    }

    /**
     * Revierte los buffs y debuffs de este item sobre el jugador.
     * @param {Player} player
     */
    removeFrom(player) {
        for (const [stat, value] of Object.entries(this.buffs)) {
            if (player[stat] !== undefined) {
                player[stat] -= value;
            }
        }
        for (const [stat, value] of Object.entries(this.debuffs)) {
            if (player[stat] !== undefined) {
                player[stat] -= value;
            }
        }

        if (this.buffs.life !== undefined || this.debuffs.life !== undefined) {
            const lifeDelta = (this.buffs.life || 0) + (this.debuffs.life || 0);
            player.maxHP -= lifeDelta;
            if (player.life > player.maxHP) player.life = player.maxHP;
            player.updateHealth();
        }
    }

    /**
     * Genera el texto de buffs/debuffs para mostrar en el panel de info.
     * @returns {string}
     */
    getStatsText() {
        const lines = [];

        for (const [stat, value] of Object.entries(this.buffs)) {
            const sign = value >= 0 ? '+' : '';
            lines.push(`${sign}${value} ${Item.statDisplayName(stat)}`);
        }

        for (const [stat, value] of Object.entries(this.debuffs)) {
            const sign = value >= 0 ? '+' : '';
            lines.push(`${sign}${value} ${Item.statDisplayName(stat)}`);
        }

        return lines.join('\n');
    }

    /**
     * Devuelve un nombre legible para una stat.
     * @param {string} stat
     * @returns {string}
     */
    static statDisplayName(stat) {
        const names = {
            attackMod: 'ATK',
            defenseMod: 'DEF',
            speed: 'SPD',
            life: 'HP',
            dashSpeed: 'Dash SPD',
            dashCooldown: 'Dash CD',
            dashDuration: 'Dash DUR'
        };
        return names[stat] || stat;
    }

    /**
     * Selección aleatoria ponderada de `count` items únicos del pool.
     * @param {Item[]} pool - Array de Items disponibles
     * @param {number} count - Número de items a seleccionar
     * @returns {Item[]}
     */
    static pickWeighted(pool, count) {
        const available = [...pool];
        const picked = [];

        for (let i = 0; i < count && available.length > 0; i++) {
            const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
            let roll = Math.random() * totalWeight;

            for (let j = 0; j < available.length; j++) {
                roll -= available[j].weight;
                if (roll <= 0) {
                    picked.push(available[j]);
                    available.splice(j, 1);
                    break;
                }
            }
        }

        return picked;
    }
}
