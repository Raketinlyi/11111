import Phaser from "phaser"

export default class ParticleSystem {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  preload(): void {
    // Загрузка текстур для частиц выполняется в основной сцене
  }

  create(): void {
    // В Phaser 3.60+ система частиц была полностью переработана
    // Мы будем создавать эффекты по требованию
  }

  createMeltEffect(x: number, y: number): void {
    try {
      // Проверяем наличие необходимых текстур
      if (
        !this.scene.textures.exists("snow-particle") ||
        !this.scene.textures.exists("water-particle") ||
        !this.scene.textures.exists("smoke-particle")
      ) {
        console.error("Не все текстуры для эффекта таяния загружены")
        return
      }

      // Эффект таяния для снеговика (снег + вода + пар)
      // Снежинки разлетаются в стороны
      const snowParticles = this.scene.add.particles({
        key: "snow-particle",
        x: x,
        y: y,
        emitting: true,
        lifespan: 4000,
        speed: { min: 50, max: 120 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.9, end: 0 },
        gravityY: 50,
        frequency: 40,
        quantity: 2,
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 }, // Разлетаются во все стороны
      })

      // Капли воды стекают вниз
      const waterParticles = this.scene.add.particles({
        key: "water-particle",
        x: x,
        y: y + 10,
        emitting: true,
        lifespan: 3500,
        speed: { min: 20, max: 60 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        gravityY: 200, // Сильнее падают вниз
        frequency: 80,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 80, max: 100 }, // В основном вниз
      })

      // Пар поднимается вверх
      const steamParticles = this.scene.add.particles({
        key: "smoke-particle", // Используем текстуру дыма для пара
        x: x,
        y: y,
        emitting: true,
        lifespan: 4000,
        speed: { min: 10, max: 30 },
        scale: { start: 0.2, end: 0.1 },
        alpha: { start: 0.4, end: 0 },
        gravityY: -50, // Легкий подъем вверх
        frequency: 120,
        quantity: 1,
        tint: 0xccffff, // Голубоватый оттенок для пара
        blendMode: Phaser.BlendModes.SCREEN,
        angle: { min: 250, max: 290 }, // В основном вверх
      })

      // Останавливаем эмиссию через некоторое время
      this.scene.time.delayedCall(3000, () => {
        snowParticles.stop()
        waterParticles.stop()
        steamParticles.stop()
      })

      // Удаляем эффекты через некоторое время
      this.scene.time.delayedCall(5000, () => {
        snowParticles.destroy()
        waterParticles.destroy()
        steamParticles.destroy()
      })
    } catch (error) {
      console.error("Ошибка при создании эффекта таяния:", error)
    }
  }

  createBurningEffect(x: number, y: number, type: "straw" | "paper"): void {
    try {
      // Проверяем наличие необходимых текстур
      if (
        !this.scene.textures.exists("fire-particle") ||
        !this.scene.textures.exists("smoke-particle") ||
        !this.scene.textures.exists("spark-particle") ||
        !this.scene.textures.exists("ember-particle") ||
        !this.scene.textures.exists("ash-particle")
      ) {
        console.error("Не все текстуры для эффекта горения загружены")
        return
      }

      // Эффект горения для соломы и бумаги
      const intensity = type === "straw" ? 1.8 : 1.5 // Увеличиваем интенсивность
      const duration = type === "straw" ? 6000 : 5500 // Увеличиваем длительность

      // Цвета для разных материалов
      const fireColor = type === "straw" ? 0xffcc00 : 0xffffcc // Солома - более желтый огонь, бумага - более белый
      const smokeColor = type === "straw" ? 0x666666 : 0xaaaaaa // Солома - более темный дым, бумага - более светлый

      // Огонь (больше и интенсивнее)
      const fireParticles = this.scene.add.particles({
        key: "fire-particle",
        x: x,
        y: y,
        emitting: true,
        lifespan: duration / 2,
        speed: { min: 60 * intensity, max: 120 * intensity },
        scale: { start: 0.6 * intensity, end: 0 }, // Увеличиваем размер
        alpha: { start: 0.9, end: 0 },
        gravityY: -50, // Огонь поднимается вверх
        frequency: 10, // Чаще испускаем частицы
        quantity: 3, // Больше частиц за раз
        tint: fireColor,
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 240, max: 300 }, // В основном вверх
      })

      // Дым
      const smokeParticles = this.scene.add.particles({
        key: "smoke-particle",
        x: x,
        y: y - 20,
        emitting: true,
        lifespan: duration,
        speed: { min: 20, max: 40 },
        scale: { start: 0.3, end: 0.6 },
        alpha: { start: 0.5, end: 0 },
        gravityY: -30,
        frequency: 30,
        quantity: 1,
        tint: smokeColor,
        blendMode: Phaser.BlendModes.SCREEN,
        angle: { min: 250, max: 290 }, // В основном вверх
      })

      // Искры (больше и ярче)
      const sparkParticles = this.scene.add.particles({
        key: "spark-particle",
        x: x,
        y: y,
        emitting: true,
        lifespan: 1000,
        speed: { min: 80 * intensity, max: 150 * intensity },
        scale: { start: 0.4 * intensity, end: 0 }, // Увеличиваем размер
        alpha: { start: 1, end: 0 },
        gravityY: 100,
        frequency: 60,
        quantity: 2, // Больше искр
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Угли
      const emberParticles = this.scene.add.particles({
        key: "ember-particle",
        x: x,
        y: y + 10,
        emitting: true,
        lifespan: 2000,
        speed: { min: 20, max: 60 },
        scale: { start: 0.25, end: 0 }, // Увеличиваем размер
        alpha: { start: 0.8, end: 0 },
        gravityY: 50,
        frequency: 120,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Пепел
      const ashParticles = this.scene.add.particles({
        key: "ash-particle",
        x: x,
        y: y + 15,
        emitting: true,
        lifespan: duration,
        speed: { min: 10, max: 30 },
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0.6, end: 0 },
        gravityY: type === "straw" ? 20 : -10, // Для соломы падает, для бумаги легко поднимается
        frequency: 100,
        quantity: 1,
        blendMode: Phaser.BlendModes.NORMAL,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Останавливаем эмиссию через некоторое время
      this.scene.time.delayedCall(duration * 0.7, () => {
        fireParticles.stop()
        sparkParticles.stop()
      })

      this.scene.time.delayedCall(duration * 0.9, () => {
        emberParticles.stop()
        smokeParticles.stop()
        ashParticles.stop()
      })

      // Удаляем эффекты через некоторое время
      this.scene.time.delayedCall(duration + 1000, () => {
        fireParticles.destroy()
        smokeParticles.destroy()
        sparkParticles.destroy()
        emberParticles.destroy()
        ashParticles.destroy()
      })
    } catch (error) {
      console.error("Ошибка при создании эффекта горения:", error)
    }
  }

  createExplosionEffect(x: number, y: number): void {
    try {
      // Проверяем наличие необходимых текстур
      if (
        !this.scene.textures.exists("spark-particle") ||
        !this.scene.textures.exists("ember-particle") ||
        !this.scene.textures.exists("smoke-particle")
      ) {
        console.error("Не все текстуры для эффекта взрыва загружены")
        return
      }

      // Эффект взрыва для шарика - яркий и быстрый
      // Яркая вспышка
      const flashParticle = this.scene.add.particles({
        key: "spark-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 300,
        speed: { min: 0, max: 10 },
        scale: { start: 2.5, end: 0 }, // Увеличиваем размер
        alpha: { start: 1, end: 0 },
        tint: 0xffffff,
        blendMode: Phaser.BlendModes.ADD,
        quantity: 1,
      })

      // Разлетающиеся осколки (больше и ярче)
      const sparkParticles = this.scene.add.particles({
        key: "spark-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 800,
        speed: { min: 150, max: 300 },
        scale: { start: 0.7, end: 0 }, // Увеличиваем размер
        alpha: { start: 1, end: 0 },
        gravityY: 100,
        quantity: 100, // Больше частиц
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Цветные частицы (как кусочки шарика)
      const colorParticles = this.scene.add.particles({
        key: "ember-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 1000,
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 }, // Увеличиваем размер
        alpha: { start: 0.9, end: 0 },
        gravityY: 150,
        quantity: 80, // Больше частиц
        tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff], // Разноцветные частицы
        blendMode: Phaser.BlendModes.NORMAL,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Дым от взрыва
      const smokeParticles = this.scene.add.particles({
        key: "smoke-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 1200,
        speed: { min: 30, max: 60 },
        scale: { start: 0.4, end: 1 },
        alpha: { start: 0.7, end: 0 },
        gravityY: -50,
        quantity: 15,
        blendMode: Phaser.BlendModes.SCREEN,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Запускаем эффекты в определенной последовательности
      flashParticle.explode()
      sparkParticles.explode()
      colorParticles.explode()

      // Дым с небольшой задержкой
      this.scene.time.delayedCall(100, () => {
        smokeParticles.explode()
      })

      // Удаляем эффекты через некоторое время
      this.scene.time.delayedCall(1500, () => {
        flashParticle.destroy()
        sparkParticles.destroy()
        colorParticles.destroy()
        smokeParticles.destroy()
      })
    } catch (error) {
      console.error("Ошибка при создании эффекта взрыва:", error)
    }
  }
}
