"use client"

import dynamic from "next/dynamic"

// Динамический импорт игрового компонента с отключенным SSR
const GameComponent = dynamic(() => import("../components/GameComponent"), {
  ssr: false,
})

export default function Home() {
  return (
    <main className="w-full h-screen bg-gray-900 overflow-hidden">
      <GameComponent />
    </main>
  )
}
