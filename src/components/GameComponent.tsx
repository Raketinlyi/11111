"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { createPhaserConfig } from "@/phaser/config"
import GameScene from "@/phaser/scene"

export default function GameComponent() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    // Создаем игру только на клиенте
    if (typeof window !== "undefined" && !gameRef.current) {
      const config = createPhaserConfig([new GameScene()])
      gameRef.current = new Phaser.Game(config)
    }

    // Очистка при размонтировании
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return <div id="phaser-game" className="w-full h-full" />
}
