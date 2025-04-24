"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { createPhaserConfig } from "../phaser/config"
import GameScene from "../phaser/scene"
import SoundControl from "./SoundControl"

export default function GameComponent() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    // Создаем игру только на клиенте
    if (typeof window !== "undefined" && !gameRef.current) {
      const config = createPhaserConfig([new GameScene()])
      gameRef.current = new Phaser.Game(config)

      // Сохраняем ссылку на игру в глобальном объекте
      if (typeof window !== "undefined") {
        ;(window as any).__PHASER_GAME__ = gameRef.current
      }
    }

    // Очистка при размонтировании
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null

        // Удаляем ссылку на игру из глобального объекта
        if (typeof window !== "undefined") {
          ;(window as any).__PHASER_GAME__ = null
        }
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <SoundControl />
      <div id="phaser-game" className="w-full h-full" />
    </div>
  )
}
