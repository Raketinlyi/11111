"use client"

import { useEffect, useState } from "react"
import { VolumeX, Volume2 } from "lucide-react"

export default function SoundControl() {
  const [isMuted, setIsMuted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Проверяем, есть ли сохраненное состояние звука
    const savedMuteState = localStorage.getItem("soundMuted")
    if (savedMuteState) {
      setIsMuted(savedMuteState === "true")
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (!isInitialized) return

    // Сохраняем состояние звука
    localStorage.setItem("soundMuted", isMuted.toString())

    // Находим игровой экземпляр Phaser и управляем звуком
    const toggleGameSound = () => {
      // Получаем доступ к игре через глобальный объект window
      const gameInstance = (window as any).__PHASER_GAME__
      if (gameInstance && gameInstance.scene && gameInstance.scene.scenes) {
        const gameScene = gameInstance.scene.scenes.find((scene: any) => scene.key === "GameScene")
        if (gameScene && gameScene.soundSystem) {
          gameScene.soundSystem.toggleSounds(!isMuted)
        }
      }
    }

    toggleGameSound()
  }, [isMuted, isInitialized])

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <button
      onClick={toggleMute}
      className="fixed top-4 right-4 z-50 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
      aria-label={isMuted ? "Включить звук" : "Выключить звук"}
    >
      {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
    </button>
  )
}
