import type Phaser from "phaser"

export interface Position {
  x: number
  y: number
}

export type NpcType = "snowman" | "strawman" | "paperman" | "balloonman"

export interface NpcData {
  id: string
  type: NpcType
  sprite: Phaser.Physics.Arcade.Sprite
  speed: number
  nextMoveTime: number
}
