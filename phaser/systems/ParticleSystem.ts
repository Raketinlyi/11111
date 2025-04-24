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
      // Снежинки разлетаются в стороны (более заметные)
      const snowParticles = this.scene.add.particles({
        key: "snow-particle",
        x: x,
        y: y,
        emitting: true,
        lifespan: 4500, // Увеличиваем время жизни
        speed: { min: 60, max: 140 }, // Увеличиваем скорость
        scale: { start: 0.4, end: 0 }, // Увеличиваем размер
        alpha: { start: 1.0, end: 0 }, // Увеличиваем непрозрачность
        gravityY: 60, // Увеличиваем гравитацию
        frequency: 35, // Чаще испускаем частицы
        quantity: 3, // Больше частиц за раз
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 }, // Разлетаются во все стороны
        tint: [0xffffff, 0xeeeeff, 0xddddff], // Добавляем вариации цвета
      })

      // Капли воды стекают вниз (более заметные)
      const waterParticles = this.scene.add.particles({
        key: "water-particle",
        x: x,
        y: y + 10,
        emitting: true,
        lifespan: 4000, // Увеличиваем время жизни
        speed: { min: 25, max: 70 }, // Увеличиваем скорость
        scale: { start: 0.5, end: 0 }, // Увеличиваем размер
        alpha: { start: 0.9, end: 0 }, // Увеличиваем непрозрачность
        gravityY: 250, // Усиливаем падение вниз
        frequency: 70, // Чаще испускаем частицы
        quantity: 2, // Больше частиц за раз
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 80, max: 100 }, // В основном вниз
        tint: [0xaaddff, 0x99ccff, 0x88bbff], // Добавляем вариации цвета
      })

      // Добавляем брызги воды при ударе о землю
      const splashParticles = this.scene.add.particles({
        key: "water-particle",
        x: x,
        y: y + 50, // Ниже основного эффекта
        emitting: true,
        lifespan: 1000,
        speed: { min: 30, max: 80 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.7, end: 0 },
        gravityY: 100,
        frequency: 200,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 30, max: 150 }, // В стороны и вверх
        tint: 0xaaddff,
      })

      // Пар поднимается вверх (более заметный)
      const steamParticles = this.scene.add.particles({
        key: "smoke-particle", // Используем текстуру дыма для пара
        x: x,
        y: y,
        emitting: true,
        lifespan: 4500, // Увеличиваем время жизни
        speed: { min: 15, max: 40 }, // Увеличиваем скорость
        scale: { start: 0.3, end: 0.15 }, // Увеличиваем размер
        alpha: { start: 0.5, end: 0 }, // Увеличиваем непрозрачность
        gravityY: -60, // Усиливаем подъем вверх
        frequency: 100, // Чаще испускаем частицы
        quantity: 2, // Больше частиц за раз
        tint: [0xccffff, 0xddffff, 0xeeffff], // Добавляем вариации цвета
        blendMode: Phaser.BlendModes.SCREEN,
        angle: { min: 250, max: 290 }, // В основном вверх
      })

      // Останавливаем эмиссию через некоторое время
      this.scene.time.delayedCall(3500, () => {
        if (snowParticles && snowParticles.emitters) {
          snowParticles.emitters.first.stop()
        }
        if (waterParticles && waterParticles.emitters) {
          waterParticles.emitters.first.stop()
        }
        if (splashParticles && splashParticles.emitters) {
          splashParticles.emitters.first.stop()
        }
        if (steamParticles && steamParticles.emitters) {
          steamParticles.emitters.first.stop()
        }
      })

      // Удаляем эффекты через некоторое время
      this.scene.time.delayedCall(5500, () => {
        if (snowParticles) snowParticles.destroy()
        if (waterParticles) waterParticles.destroy()
        if (splashParticles) splashParticles.destroy()
        if (steamParticles) steamParticles.destroy()
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
      const intensity = type === "straw" ? 2.0 : 1.7 // Увеличиваем интенсивность
      const duration = type === "straw" ? 6000 : 5500 // Сохраняем длительность

      // Цвета для разных материалов (более яркие)
      const fireColor =
        type === "straw"
          ? [0xffcc00, 0xffdd00, 0xff9900] // Солома - более желтый огонь с вариациями
          : [0xffffcc, 0xffeecc, 0xffddaa] // Бумага - более белый огонь с вариациями

      const smokeColor = type === "straw" ? 0x666666 : 0xaaaaaa // Сохраняем цвета дыма

      // Огонь (больше и интенсивнее)
      const fireParticles = this.scene.add.particles({
        key: "fire-particle",
        x: x,
        y: y,
        emitting: true,
        lifespan: duration / 2,
        speed: { min: 70 * intensity, max: 130 * intensity }, // Увеличиваем скорость
        scale: { start: 0.7 * intensity, end: 0 }, // Увеличиваем размер
        alpha: { start: 1.0, end: 0 }, // Увеличиваем непрозрачность
        gravityY: -60, // Усиливаем подъем огня
        frequency: 8, // Чаще испускаем частицы
        quantity: 4, // Больше частиц за раз
        tint: fireColor,
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 240, max: 300 }, // В основном вверх
      })

      // Добавляем ядро пламени (очень яркое)
      const coreParticles = this.scene.add.particles({
        key: "fire-particle",
        x: x,
        y: y - 5,
        emitting: true,
        lifespan: duration / 3,
        speed: { min: 50 * intensity, max: 100 * intensity },
        scale: { start: 0.5 * intensity, end: 0 },
        alpha: { start: 1.0, end: 0 },
        gravityY: -70,
        frequency: 15,
        quantity: 2,
        tint: type === "straw" ? 0xffffff : 0xffffff, // Белое ядро для обоих типов
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 250, max: 290 },
      })

      // Дым (более объемный)
      const smokeParticles = this.scene.add.particles({
        key: "smoke-particle",
        x: x,
        y: y - 20,
        emitting: true,
        lifespan: duration,
        speed: { min: 25, max: 45 }, // Увеличиваем скорость
        scale: { start: 0.4, end: 0.8 }, // Увеличиваем размер
        alpha: { start: 0.6, end: 0 }, // Увеличиваем непрозрачность
        gravityY: -35, // Усиливаем подъем дыма
        frequency: 25, // Чаще испускаем частицы
        quantity: 2, // Больше частиц за раз
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
        lifespan: 1200, // Увеличиваем время жизни
        speed: { min: 90 * intensity, max: 170 * intensity }, // Увеличиваем скорость
        scale: { start: 0.5 * intensity, end: 0 }, // Увеличиваем размер
        alpha: { start: 1, end: 0 },
        gravityY: 120, // Увеличиваем гравитацию
        frequency: 50, // Чаще испускаем частицы
        quantity: 3, // Больше искр
        tint: [0xffffff, 0xffff00, 0xffaa00], // Добавляем вариации цвета
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Угли (более яркие)
      const emberParticles = this.scene.add.particles({
        key: "ember-particle",
        x: x,
        y: y + 10,
        emitting: true,
        lifespan: 2000,
        speed: { min: 25, max: 70 }, // Увеличиваем скорость
        scale: { start: 0.3, end: 0 }, // Увеличиваем размер
        alpha: { start: 0.9, end: 0 }, // Увеличиваем непрозрачность
        gravityY: 60, // Увеличиваем гравитацию
        frequency: 100,
        quantity: 2, // Больше углей
        tint: [0xff6600, 0xff4400, 0xff2200], // Добавляем вариации цвета
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
        if (fireParticles && fireParticles.emitters) {
          fireParticles.emitters.first.stop()
        }
        if (coreParticles && coreParticles.emitters) {
          coreParticles.emitters.first.stop()
        }
        if (sparkParticles && sparkParticles.emitters) {
          sparkParticles.emitters.first.stop()
        }
      })

      this.scene.time.delayedCall(duration * 0.9, () => {
        if (emberParticles && emberParticles.emitters) {
          emberParticles.emitters.first.stop()
        }
        if (smokeParticles && smokeParticles.emitters) {
          smokeParticles.emitters.first.stop()
        }
        if (ashParticles && ashParticles.emitters) {
          ashParticles.emitters.first.stop()
        }
      })

      // Удаляем эффекты через некоторое время
      this.scene.time.delayedCall(duration + 1000, () => {
        if (fireParticles) fireParticles.destroy()
        if (coreParticles) coreParticles.destroy()
        if (smokeParticles) smokeParticles.destroy()
        if (sparkParticles) sparkParticles.destroy()
        if (emberParticles) emberParticles.destroy()
        if (ashParticles) ashParticles.destroy()
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
      // Яркая вспышка (увеличенная)
      const flashParticle = this.scene.add.particles({
        key: "spark-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 350, // Увеличиваем время жизни
        speed: { min: 0, max: 15 }, // Увеличиваем скорость
        scale: { start: 3.0, end: 0 }, // Увеличиваем размер
        alpha: { start: 1, end: 0 },
        tint: 0xffffff,
        blendMode: Phaser.BlendModes.ADD,
        quantity: 2, // Больше частиц
      })

      // Добавляем вторичную вспышку для большей яркости
      const secondaryFlash = this.scene.add.particles({
        key: "fire-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 250,
        speed: { min: 0, max: 10 },
        scale: { start: 2.0, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0xffffaa,
        blendMode: Phaser.BlendModes.ADD,
        quantity: 3,
      })

      // Разлетающиеся осколки (больше и ярче)
      const sparkParticles = this.scene.add.particles({
        key: "spark-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 900, // Увеличиваем время жизни
        speed: { min: 180, max: 350 }, // Увеличиваем скорость
        scale: { start: 0.8, end: 0 }, // Увеличиваем размер
        alpha: { start: 1, end: 0 },
        gravityY: 120, // Увеличиваем гравитацию
        quantity: 120, // Больше частиц
        tint: [0xffffff, 0xffffaa, 0xffff77], // Добавляем вариации цвета
        blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Цветные частицы (как кусочки шарика)
      const colorParticles = this.scene.add.particles({
        key: "ember-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 1200, // Увеличиваем время жизни
        speed: { min: 120, max: 250 }, // Увеличиваем скорость
        scale: { start: 0.6, end: 0 }, // Увеличиваем размер
        alpha: { start: 1.0, end: 0 }, // Увеличиваем непрозрачность
        gravityY: 180, // Увеличиваем гравитацию
        quantity: 100, // Больше частиц
        tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0xff8800, 0x00ffff], // Больше цветов
        blendMode: Phaser.BlendModes.NORMAL,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Дым от взрыва (более объемный)
      const smokeParticles = this.scene.add.particles({
        key: "smoke-particle",
        x: x,
        y: y,
        emitting: false,
        lifespan: 1500, // Увеличиваем время жизни
        speed: { min: 40, max: 80 }, // Увеличиваем скорость
        scale: { start: 0.5, end: 1.2 }, // Увеличиваем размер
        alpha: { start: 0.8, end: 0 }, // Увеличиваем непрозрачность
        gravityY: -60, // Усиливаем подъем дыма
        quantity: 20, // Больше частиц
        blendMode: Phaser.BlendModes.SCREEN,
        angle: { min: 0, max: 360 }, // Во все стороны
      })

      // Запускаем эффекты в определенной последовательности
      if (flashParticle && flashParticle.emitters) {
        flashParticle.emitters.first.explode()
      }
      if (secondaryFlash && secondaryFlash.emitters) {
        secondaryFlash.emitters.first.explode(3) // Запускаем вторичную вспышку
      }
      if (sparkParticles && sparkParticles.emitters) {
        sparkParticles.emitters.first.explode()
      }

      // Небольшая задержка перед цветными частицами
      this.scene.time.delayedCall(50, () => {
        if (colorParticles && colorParticles.emitters) {
          colorParticles.emitters.first.explode()
        }
      })

      // Дым с небольшой задержкой
      this.scene.time.delayedCall(100, () => {
        if (smokeParticles && smokeParticles.emitters) {
          smokeParticles.emitters.first.explode()
        }
      })

      // Удаляем эффекты через некоторое время
      this.scene.time.delayedCall(1800, () => {
        if (flashParticle) flashParticle.destroy()
        if (secondaryFlash) secondaryFlash.destroy()
        if (sparkParticles) sparkParticles.destroy()
        if (colorParticles) colorParticles.destroy()
        if (smokeParticles) smokeParticles.destroy()
      })
    } catch (error) {
      console.error("Ошибка при создании эффекта взрыва:", error)
    }
  }
}
