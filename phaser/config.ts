import Phaser from "phaser"

export function createPhaserConfig(scene: Phaser.Scene | Phaser.Scene[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "phaser-game",
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#000000",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    transparent: true,
    scene: scene,
  }
}
