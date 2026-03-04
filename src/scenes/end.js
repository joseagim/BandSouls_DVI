import Phaser from 'phaser'

/**
 * Escena de fin de juego. Cuando se han recogido todas las estrellas, se presenta un
 * texto que indica que el juego se ha acabado.
 * Si se pulsa cualquier tecla, se vuelve a iniciar el juego.
 */
export default class End extends Phaser.Scene {
  /**
   * Constructor de la escena
   */
  constructor() {
    super({ key: 'end' });
  }

  /**
   * Creación de la escena. Tan solo contiene el texto que indica que el juego se ha acabado
   */
  create() {
    this.add.image(640,368,'death');
    this.input.keyboard.on('keydown-SPACE', function (_event) { 
      this.scene.start('boot');
    }, this);
  }

}