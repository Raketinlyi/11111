import Phaser from "phaser"
import ParticleSystem from "./systems/ParticleSystem"
import SoundSystem from "./systems/SoundSystem"
import type { NpcData, NpcType } from "../types/game"

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private npcs: Map<string, NpcData> = new Map()
  public particleSystem!: ParticleSystem
  public soundSystem!: SoundSystem
  private targetPosition: Phaser.Math.Vector2 | null = null
  private isMoving = false
  private worldBounds!: { width: number; height: number }
  private npcTypes: NpcType[] = ["snowman", "strawman", "paperman", "balloonman"]
  private score = 0
  private scoreText!: Phaser.GameObjects.Text
  private playArea!: Phaser.Geom.Polygon
  private playAreaGraphics!: Phaser.GameObjects.Graphics
  private burningNpcs: Set<string> = new Set()
  private assetsLoaded = false
  private isMobile = false
  private allTexturesLoaded = false
  private allSoundsLoaded = false
  private retryCount = 0
  private maxRetries = 3
  private colliders: Phaser.Physics.Arcade.Collider[] = []

  constructor() {
    super({ key: "GameScene" })

    // Экспортируем экземпляр игры в глобальный объект для доступа из компонентов React
    if (typeof window !== "undefined") {
      ;(window as any).__PHASER_GAME__ = this.game
    }
  }

  preload(): void {
    try {
      // Определяем, является ли устройство мобильным
      this.isMobile = this.detectMobile()

      // Создаем текст загрузки
      const loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Загрузка...", {
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      loadingText.setOrigin(0.5)
      loadingText.setDepth(100)

      // Загрузка изображений с обработкой ошибок
      this.loadImageWithRetry("town-background", "assets/images/town-background-new.png")
      this.loadImageWithRetry("candle-character", "assets/images/candle-character.png")
      this.loadImageWithRetry("classic-snowman", "assets/images/classic-snowman.png")
      this.loadImageWithRetry("straw-man", "assets/images/straw-man.png")
      this.loadImageWithRetry("paper-man", "assets/images/paper-man.png")
      this.loadImageWithRetry("balloon-man", "assets/images/balloon-man.png")
      this.loadImageWithRetry("fire-particle", "assets/images/fire-particle.png")
      this.loadImageWithRetry("snow-particle", "assets/images/snow-particle.png")
      this.loadImageWithRetry("water-particle", "assets/images/water-particle.png")
      this.loadImageWithRetry("smoke-particle", "assets/images/smoke-particle.png")
      this.loadImageWithRetry("spark-particle", "assets/images/spark-particle.png")
      this.loadImageWithRetry("ember-particle", "assets/images/ember-particle.png")
      this.loadImageWithRetry("ash-particle", "assets/images/ash-particle.png")

      // Инициализация звуковой системы
      this.soundSystem = new SoundSystem(this)
      this.soundSystem.preload()

      // Обработчик ошибок загрузки
      this.load.on("loaderror", (fileObj: any) => {
        console.error("Ошибка загрузки файла:", fileObj.key)

        // Пробуем загрузить файл повторно
        if (this.retryCount < this.maxRetries) {
          this.retryCount++
          console.log(`Повторная попытка загрузки ${fileObj.key} (${this.retryCount}/${this.maxRetries})`)
          this.loadImageWithRetry(fileObj.key, fileObj.url)
        }
      })

      // Обработчик завершения загрузки
      this.load.on("complete", () => {
        this.allTexturesLoaded = true
        loadingText.setText("Загрузка звуков...")

        // Проверяем, все ли текстуры загружены
        const requiredTextures = [
          "town-background",
          "candle-character",
          "classic-snowman",
          "straw-man",
          "paper-man",
          "balloon-man",
          "fire-particle",
          "snow-particle",
          "water-particle",
          "smoke-particle",
          "spark-particle",
          "ember-particle",
          "ash-particle",
        ]

        let allLoaded = true
        for (const texture of requiredTextures) {
          if (!this.textures.exists(texture)) {
            allLoaded = false
            console.error(`Текстура ${texture} не загружена`)
          }
        }

        if (allLoaded) {
          this.assetsLoaded = true
          loadingText.destroy()
        } else {
          loadingText.setText("Ошибка загрузки текстур\nНажмите для повторной попытки")
          loadingText.setInteractive()
          loadingText.on("pointerdown", () => {
            this.scene.restart()
          })
        }
      })
    } catch (error) {
      console.error("Ошибка при загрузке ресурсов:", error)
    }
  }

  private loadImageWithRetry(key: string, path: string): void {
    try {
      // Проверяем, загружена ли уже текстура
      if (this.textures.exists(key)) {
        console.log(`Текстура ${key} уже загружена`)
        return
      }

      // Загружаем текстуру
      this.load.image(key, path)
    } catch (error) {
      console.error(`Ошибка при загрузке текстуры ${key}:`, error)
    }
  }

  create(): void {
    try {
      // Определяем размеры мира
      this.worldBounds = {
        width: this.scale.width,
        height: this.scale.height,
      }

      // Проверяем, загружены ли все необходимые текстуры
      if (!this.textures.exists("town-background")) {
        console.error("Фон не загружен, пытаемся загрузить повторно")
        this.loadImageWithRetry("town-background", "assets/images/town-background-new.png")
        this.load.start()
        return
      }

      // Добавляем фон
      const background = this.add.image(this.worldBounds.width / 2, this.worldBounds.height / 2, "town-background")

      // Масштабируем фон, чтобы он заполнил экран
      const scaleX = this.worldBounds.width / background.width
      const scaleY = this.worldBounds.height / background.height
      const scale = Math.max(scaleX, scaleY)
      background.setScale(scale)

      // Определяем область площади (точно по дороге, обведенной красным фломастером)
      this.definePlayArea()

      // Инициализируем системы
      this.particleSystem = new ParticleSystem(this)
      this.particleSystem.create()

      // Инициализируем звуковую систему
      this.soundSystem.loadSounds()

      // Проверяем, загружена ли текстура свечки
      if (!this.textures.exists("candle-character")) {
        console.error("Текстура свечки не загружена, пытаемся загрузить повторно")
        this.loadImageWithRetry("candle-character", "assets/images/candle-character.png")
        this.load.start()
        return
      }

      // Создаем игрока (свечку)
      this.player = this.physics.add.sprite(
        this.worldBounds.width / 2,
        this.worldBounds.height * 0.8, // Размещаем игрока ниже на дороге
        "candle-character",
      )
      this.player.setScale(0.45)
      this.player.setCollideWorldBounds(true)
      this.player.setDepth(10)

      // Добавляем эффект пламени для свечки
      this.createPlayerFlameEffect()

      // Создаем NPC
      this.createNpcs()

      // Настраиваем обработчик кликов для перемещения
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Воспроизводим звук клика
        this.soundSystem.playSfx("click", 0.5)

        // Проверяем, находится ли точка клика в пределах игровой области
        if (this.isPointInPlayArea(pointer.worldX, pointer.worldY)) {
          this.targetPosition = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
          this.isMoving = true
        }
      })

      // Настраиваем коллизии между игроком и NPC
      this.setupCollisions()

      // Добавляем счетчик очков
      this.scoreText = this.add.text(16, 16, "Счет: 0", {
        fontSize: "32px",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 4,
      })
      this.scoreText.setScrollFactor(0)
      this.scoreText.setDepth(20)

      // Добавляем счетчик сожженных NPC
      const burnedText = this.add.text(16, 60, "Сожжено: 0/4", {
        fontSize: "24px",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 3,
      })
      burnedText.setScrollFactor(0)
      burnedText.setDepth(20)

      // Обновляем счетчик сожженных NPC при изменении счета
      this.registry.events.on("changedata", (_, key, value) => {
        if (key === "burnedCount") {
          burnedText.setText(`Сожжено: ${value}/4`)
        }
      })

      // Инициализируем счетчик сожженных NPC
      this.registry.set("burnedCount", 0)

      // Если это мобильное устройство, добавляем кнопки управления
      if (this.isMobile) {
        this.addMobileControls()
      }
    } catch (error) {
      console.error("Ошибка при создании сцены:", error)

      // Показываем сообщение об ошибке и кнопку перезагрузки
      const errorText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "Произошла ошибка\nНажмите для перезагрузки",
        {
          fontSize: "32px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
          align: "center",
        },
      )
      errorText.setOrigin(0.5)
      errorText.setDepth(100)
      errorText.setInteractive()
      errorText.on("pointerdown", () => {
        this.scene.restart()
      })
    }
  }

  // Обновляем метод update для использования новых звуков шагов
  update(time: number, delta: number): void {
    try {
      // Проверяем, загружены ли все ресурсы
      if (!this.assetsLoaded) return

      // Перемещение игрока к точке клика
      if (this.isMoving && this.targetPosition) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.targetPosition.x,
          this.targetPosition.y,
        )

        if (distance > 5) {
          // Анимация покачивания свечки при движении
          const wobbleAmount = Math.sin(time / 100) * 2
          this.player.angle = wobbleAmount

          // Перемещаем игрока
          this.physics.moveTo(this.player, this.targetPosition.x, this.targetPosition.y, 200)

          // Воспроизводим звук шагов с интервалом, чередуя разные типы шагов
          if (Math.floor(time / 300) % 4 === 0) {
            this.soundSystem.playSfx("footsteps-concrete", 0.2)
          } else if (Math.floor(time / 300) % 4 === 1) {
            this.soundSystem.playSfx("footsteps-gravel", 0.2)
          } else if (Math.floor(time / 300) % 4 === 2) {
            this.soundSystem.playSfx("footsteps-concrete", 0.2)
          } else {
            this.soundSystem.playSfx("footsteps-gravel", 0.2)
          }
        } else {
          this.player.body.reset(this.targetPosition.x, this.targetPosition.y)
          this.player.angle = 0
          this.isMoving = false
          this.targetPosition = null
        }
      }

      // Обновление движения NPC
      this.npcs.forEach((npc) => {
        // Если NPC горит, не обновляем его движение
        if (this.burningNpcs.has(npc.id)) return

        if (time > npc.nextMoveTime) {
          this.moveNpcRandomly(npc)
          npc.nextMoveTime = time + Phaser.Math.Between(3000, 7000) // Увеличиваем интервал между движениями
        }

        // Анимация движения в зависимости от типа NPC
        this.animateNpc(npc, time)

        // Проверяем, находится ли NPC в пределах игровой области
        if (!this.isPointInPlayArea(npc.sprite.x, npc.sprite.y)) {
          // Если NPC вышел за пределы игровой области, возвращаем его обратно
          this.moveNpcToSafePosition(npc)
        }

        // Избегаем свечку, но не слишком явно
        this.avoidPlayer(npc, time)
      })
    } catch (error) {
      console.error("Ошибка в методе update:", error)
    }
  }

  private detectMobile(): boolean {
    // Проверяем, является ли устройство мобильным
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth <= 800 && window.innerHeight <= 600)
    )
  }

  private addMobileControls(): void {
    try {
      // Создаем виртуальный джойстик для управления
      const joystickRadius = Math.min(this.worldBounds.width, this.worldBounds.height) * 0.15

      // Создаем фон для джойстика
      const joystickBg = this.add.circle(
        this.worldBounds.width * 0.15,
        this.worldBounds.height * 0.8,
        joystickRadius,
        0x000000,
        0.3,
      )
      joystickBg.setDepth(30)
      joystickBg.setScrollFactor(0)

      // Создаем ручку джойстика
      const joystickHandle = this.add.circle(
        this.worldBounds.width * 0.15,
        this.worldBounds.height * 0.8,
        joystickRadius * 0.5,
        0xffffff,
        0.5,
      )
      joystickHandle.setDepth(31)
      joystickHandle.setScrollFactor(0)

      // Делаем джойстик интерактивным
      joystickBg.setInteractive()

      // Обработчики событий для джойстика
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.x < this.worldBounds.width * 0.3) {
          // Клик в левой части экрана - управление джойстиком
          const distance = Phaser.Math.Distance.Between(joystickBg.x, joystickBg.y, pointer.x, pointer.y)

          if (distance <= joystickRadius * 1.5) {
            // Перемещаем ручку джойстика
            joystickHandle.x = pointer.x
            joystickHandle.y = pointer.y

            // Вычисляем направление
            const angle = Phaser.Math.Angle.Between(joystickBg.x, joystickBg.y, pointer.x, pointer.y)

            // Вычисляем целевую точку для игрока
            const targetX = this.player.x + Math.cos(angle) * 100
            const targetY = this.player.y + Math.sin(angle) * 100

            // Проверяем, находится ли точка в пределах игровой области
            if (this.isPointInPlayArea(targetX, targetY)) {
              this.targetPosition = new Phaser.Math.Vector2(targetX, targetY)
              this.isMoving = true
            }
          }
        } else {
          // Клик в правой части экрана - обычное перемещение
          if (this.isPointInPlayArea(pointer.worldX, pointer.worldY)) {
            this.targetPosition = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
            this.isMoving = true
            this.soundSystem.playSfx("click", 0.5)
          }
        }
      })

      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown && pointer.x < this.worldBounds.width * 0.3) {
          // Перемещение с зажатым пальцем в левой части экрана
          const distance = Phaser.Math.Distance.Between(joystickBg.x, joystickBg.y, pointer.x, pointer.y)

          // Ограничиваем перемещение ручки джойстика
          if (distance <= joystickRadius) {
            joystickHandle.x = pointer.x
            joystickHandle.y = pointer.y
          } else {
            // Нормализуем позицию
            const angle = Phaser.Math.Angle.Between(joystickBg.x, joystickBg.y, pointer.x, pointer.y)
            joystickHandle.x = joystickBg.x + Math.cos(angle) * joystickRadius
            joystickHandle.y = joystickBg.y + Math.sin(angle) * joystickRadius
          }

          // Вычисляем направление
          const angle = Phaser.Math.Angle.Between(joystickBg.x, joystickBg.y, joystickHandle.x, joystickHandle.y)

          // Вычисляем целевую точку для игрока
          const targetX = this.player.x + Math.cos(angle) * 100
          const targetY = this.player.y + Math.sin(angle) * 100

          // Проверяем, находится ли точка в пределах игровой области
          if (this.isPointInPlayArea(targetX, targetY)) {
            this.targetPosition = new Phaser.Math.Vector2(targetX, targetY)
            this.isMoving = true
          }
        }
      })

      this.input.on("pointerup", () => {
        // Возвращаем ручку джойстика в центр
        joystickHandle.x = joystickBg.x
        joystickHandle.y = joystickBg.y
      })
    } catch (error) {
      console.error("Ошибка при добавлении мобильных элементов управления:", error)
    }
  }

  private definePlayArea(): void {
    try {
      // Определяем игровую область точно по дороге, обведенной красным фломастером
      // Координаты точек многоугольника (настроены под конкретное изображение)
      const centerX = this.worldBounds.width / 2
      const centerY = this.worldBounds.height / 2

      // Создаем многоугольник, который точно следует за дорогой, обведенной красным
      // Обновленные координаты с учетом запрошенных изменений:
      // - опустить верхнюю грань на 12 см (5 см + 7 см) (увеличиваем значения Y для верхних точек)
      // - опустить нижнюю грань на 3 см (увеличиваем значения Y для нижних точек)
      // - расширить по бокам на 15 см (увеличиваем значения X для крайних точек)

      // Коэффициенты для преобразования сантиметров в пиксели (примерно)
      const cmToPixelsX = this.worldBounds.width * 0.01 // 1 см примерно 1% ширины экрана
      const cmToPixelsY = this.worldBounds.height * 0.01 // 1 см примерно 1% высоты экрана

      const points = [
        // Левая нижняя часть (начиная с нижней левой точки, двигаясь против часовой стрелки)
        // Расширяем влево на 15 см и вниз на 3 см
        new Phaser.Geom.Point(
          centerX - this.worldBounds.width * 0.45 - 15 * cmToPixelsX,
          centerY + this.worldBounds.height * 0.45 + 3 * cmToPixelsY,
        ),

        // Левая сторона (поднимаемся вверх)
        // Расширяем влево на 15 см
        new Phaser.Geom.Point(
          centerX - this.worldBounds.width * 0.4 - 15 * cmToPixelsX,
          centerY + this.worldBounds.height * 0.3,
        ),
        new Phaser.Geom.Point(
          centerX - this.worldBounds.width * 0.35 - 15 * cmToPixelsX,
          centerY + this.worldBounds.height * 0.15,
        ),
        new Phaser.Geom.Point(centerX - this.worldBounds.width * 0.3 - 15 * cmToPixelsX, centerY),

        // Верхняя левая часть (обходим левый дом)
        // Опускаем верхнюю грань на 12 см и расширяем влево на 15 см
        new Phaser.Geom.Point(
          centerX - this.worldBounds.width * 0.25 - 15 * cmToPixelsX,
          centerY - this.worldBounds.height * 0.1 + 12 * cmToPixelsY,
        ),

        // Верхняя центральная часть (обходим ночной клуб)
        // Опускаем верхнюю грань на 12 см
        new Phaser.Geom.Point(
          centerX - this.worldBounds.width * 0.15,
          centerY - this.worldBounds.height * 0.15 + 12 * cmToPixelsY,
        ),
        new Phaser.Geom.Point(centerX, centerY - this.worldBounds.height * 0.15 + 12 * cmToPixelsY),
        new Phaser.Geom.Point(
          centerX + this.worldBounds.width * 0.15,
          centerY - this.worldBounds.height * 0.15 + 12 * cmToPixelsY,
        ),

        // Верхняя правая часть (обходим правый дом)
        // Опускаем верхнюю грань на 12 см и расширяем вправо на 15 см
        new Phaser.Geom.Point(
          centerX + this.worldBounds.width * 0.25 + 15 * cmToPixelsX,
          centerY - this.worldBounds.height * 0.1 + 12 * cmToPixelsY,
        ),

        // Правая сторона (спускаемся вниз)
        // Расширяем вправо на 15 см
        new Phaser.Geom.Point(centerX + this.worldBounds.width * 0.3 + 15 * cmToPixelsX, centerY),
        new Phaser.Geom.Point(
          centerX + this.worldBounds.width * 0.35 + 15 * cmToPixelsX,
          centerY + this.worldBounds.height * 0.15,
        ),
        new Phaser.Geom.Point(
          centerX + this.worldBounds.width * 0.4 + 15 * cmToPixelsX,
          centerY + this.worldBounds.height * 0.3,
        ),

        // Правая нижняя часть
        // Расширяем вправо на 15 см и вниз на 3 см
        new Phaser.Geom.Point(
          centerX + this.worldBounds.width * 0.45 + 15 * cmToPixelsX,
          centerY + this.worldBounds.height * 0.45 + 3 * cmToPixelsY,
        ),

        // Нижняя часть (соединяем с начальной точкой)
        // Расширяем вниз на 3 см
        new Phaser.Geom.Point(
          centerX + this.worldBounds.width * 0.3,
          centerY + this.worldBounds.height * 0.48 + 3 * cmToPixelsY,
        ),
        new Phaser.Geom.Point(centerX, centerY + this.worldBounds.height * 0.5 + 3 * cmToPixelsY),
        new Phaser.Geom.Point(
          centerX - this.worldBounds.width * 0.3,
          centerY + this.worldBounds.height * 0.48 + 3 * cmToPixelsY,
        ),
      ]

      this.playArea = new Phaser.Geom.Polygon(points)

      // Визуализируем границы игровой области (делаем более заметными)
      this.playAreaGraphics = this.add.graphics()
      this.playAreaGraphics.lineStyle(3, 0xff0000, 0.5) // Красная линия, более толстая и заметная
      this.playAreaGraphics.strokePoints(points, true)
      this.playAreaGraphics.setDepth(1)
    } catch (error) {
      console.error("Ошибка при определении игровой области:", error)
    }
  }

  private isPointInPlayArea(x: number, y: number): boolean {
    try {
      return this.playArea.contains(x, y)
    } catch (error) {
      console.error("Ошибка при проверке точки в игровой области:", error)
      return true // По умолчанию разрешаем движение
    }
  }

  private moveNpcToSafePosition(npc: NpcData): void {
    try {
      // Находим центр игровой области
      const centerX = this.worldBounds.width / 2
      const centerY = this.worldBounds.height / 2 + this.worldBounds.height * 0.3 // Сдвигаем центр ниже

      // Перемещаем NPC к центру игровой области
      this.physics.moveTo(npc.sprite, centerX, centerY, npc.speed)
    } catch (error) {
      console.error("Ошибка при перемещении NPC в безопасную позицию:", error)
    }
  }

  // Обновляем метод createPlayerFlameEffect для использования новых звуков огня
  private createPlayerFlameEffect(): void {
    try {
      // Проверяем, загружены ли все необходимые текстуры
      if (
        !this.textures.exists("fire-particle") ||
        !this.textures.exists("spark-particle") ||
        !this.textures.exists("smoke-particle")
      ) {
        console.error("Не все текстуры для эффекта пламени загружены")
        return
      }

      // Создаем улучшенный эффект пламени для свечки
      // Основное пламя (более яркое и живое)
      const mainFlame = this.add.particles({
        key: "fire-particle",
        x: this.player.x,
        y: this.player.y - 20,
        emitting: true,
        lifespan: 800,
        speed: { min: 30, max: 60 },
        angle: { min: 260, max: 280 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.9, end: 0 },
        frequency: 20,
        blendMode: Phaser.BlendModes.ADD,
        follow: this.player,
        followOffset: { x: 0, y: -20 },
        tint: 0xffcc00, // Желтый цвет пламени
      })

      // Внутреннее пламя (более белое)
      const innerFlame = this.add.particles({
        key: "fire-particle",
        x: this.player.x,
        y: this.player.y - 22,
        emitting: true,
        lifespan: 600,
        speed: { min: 20, max: 40 },
        angle: { min: 265, max: 275 },
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.8, end: 0 },
        frequency: 25,
        blendMode: Phaser.BlendModes.ADD,
        follow: this.player,
        followOffset: { x: 0, y: -22 },
        tint: 0xffffcc, // Белый цвет пламени
      })

      // Искры от пламени
      const sparks = this.add.particles({
        key: "spark-particle",
        x: this.player.x,
        y: this.player.y - 20,
        emitting: true,
        lifespan: 500,
        speed: { min: 10, max: 30 },
        angle: { min: 230, max: 310 },
        scale: { start: 0.1, end: 0 },
        alpha: { start: 1, end: 0 },
        frequency: 200,
        blendMode: Phaser.BlendModes.ADD,
        follow: this.player,
        followOffset: { x: 0, y: -20 },
      })

      // Легкий дым
      const smoke = this.add.particles({
        key: "smoke-particle",
        x: this.player.x,
        y: this.player.y - 25,
        emitting: true,
        lifespan: 1000,
        speed: { min: 5, max: 15 },
        angle: { min: 260, max: 280 },
        scale: { start: 0.1, end: 0.2 },
        alpha: { start: 0.2, end: 0 },
        frequency: 300,
        blendMode: Phaser.BlendModes.SCREEN,
        follow: this.player,
        followOffset: { x: 0, y: -25 },
      })

      // Эффект свечения вокруг свечки
      const glow = this.add.particles({
        key: "fire-particle",
        x: this.player.x,
        y: this.player.y,
        emitting: true,
        lifespan: 1000,
        speed: { min: 5, max: 10 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.2, end: 0 },
        frequency: 100,
        blendMode: Phaser.BlendModes.ADD,
        follow: this.player,
        tint: 0xff8800, // Оранжевое свечение
      })

      // Периодически воспроизводим звук пламени
      this.time.addEvent({
        delay: 2000,
        callback: () => {
          // Чередуем разные звуки пламени для разнообразия
          const randomSound = Math.random()
          if (randomSound < 0.3) {
            this.soundSystem.playSfx("flame-whoosh", 0.3)
          } else if (randomSound < 0.6) {
            this.soundSystem.playSfx("fire-breath", 0.3)
          } else {
            this.soundSystem.playSfx("woosh", 0.2)
          }
        },
        loop: true,
      })
    } catch (error) {
      console.error("Ошибка при создании эффекта пламени игрока:", error)
    }
  }

  private createNpcs(): void {
    try {
      // Проверяем, загружены ли все необходимые текстуры
      const requiredTextures = ["classic-snowman", "straw-man", "paper-man", "balloon-man"]
      for (const texture of requiredTextures) {
        if (!this.textures.exists(texture)) {
          console.error(`Текстура ${texture} не загружена`)
          return
        }
      }

      // Очищаем существующих NPC, если они есть
      this.npcs.forEach((npc) => {
        npc.sprite.destroy()
      })
      this.npcs.clear()
      this.burningNpcs.clear()

      // Создаем по одному NPC каждого типа в пределах игровой области (на дороге)
      const positions = [
        { x: this.worldBounds.width * 0.3, y: this.worldBounds.height * 0.7 }, // Левая часть дороги
        { x: this.worldBounds.width * 0.7, y: this.worldBounds.height * 0.7 }, // Правая часть дороги
        { x: this.worldBounds.width * 0.4, y: this.worldBounds.height * 0.6 }, // Центр-левая часть дороги
        { x: this.worldBounds.width * 0.6, y: this.worldBounds.height * 0.6 }, // Центр-правая часть дороги
      ]

      this.npcTypes.forEach((type, index) => {
        const id = `npc-${type}-${index}`
        const pos = positions[index]

        let spriteKey = ""
        let scale = 0.6

        switch (type) {
          case "snowman":
            spriteKey = "classic-snowman"
            scale = 0.45
            break
          case "strawman":
            spriteKey = "straw-man"
            scale = 0.45
            break
          case "paperman":
            spriteKey = "paper-man"
            scale = 0.6
            break
          case "balloonman":
            spriteKey = "balloon-man"
            scale = 0.45
            break
        }

        const sprite = this.physics.add.sprite(pos.x, pos.y, spriteKey)
        sprite.setScale(scale)
        sprite.setDepth(5)

        const npcData: NpcData = {
          id,
          type,
          sprite,
          speed: this.getNpcSpeed(type),
          nextMoveTime: 0,
        }

        this.npcs.set(id, npcData)
      })

      // Обновляем коллизии
      this.setupCollisions()

      // Сбрасываем счетчик сожженных NPC
      this.registry.set("burnedCount", 0)

      // Воспроизводим звук нового уровня
      this.soundSystem.playSfx("level-up", 0.5)
    } catch (error) {
      console.error("Ошибка при создании NPC:", error)
    }
  }

  private getNpcSpeed(type: NpcType): number {
    try {
      // Разная скорость для разных типов NPC
      switch (type) {
        case "snowman":
          return Phaser.Math.Between(30, 50) // Медленный
        case "strawman":
          return Phaser.Math.Between(40, 60) // Средний
        case "paperman":
          return Phaser.Math.Between(50, 70) // Быстрый
        case "balloonman":
          return Phaser.Math.Between(60, 80) // Самый быстрый
        default:
          return 50
      }
    } catch (error) {
      console.error("Ошибка при получении скорости NPC:", error)
      return 50 // Возвращаем значение по умолчанию
    }
  }

  private moveNpcRandomly(npc: NpcData): void {
    try {
      // Находим случайную точку в пределах игровой области
      let targetX, targetY
      let attempts = 0
      const maxAttempts = 10

      do {
        // Генерируем случайную точку в пределах мировых границ
        targetX = Phaser.Math.Between(this.worldBounds.width * 0.2, this.worldBounds.width * 0.8)
        targetY = Phaser.Math.Between(this.worldBounds.height * 0.5, this.worldBounds.height * 0.9) // Расширяем по вертикали
        attempts++
      } while (!this.isPointInPlayArea(targetX, targetY) && attempts < maxAttempts)

      // Если не удалось найти точку в пределах игровой области, используем центр
      if (attempts >= maxAttempts) {
        targetX = this.worldBounds.width / 2
        targetY = this.worldBounds.height * 0.7 // Центр дороги
      }

      // Перемещаем NPC к случайной точке
      this.physics.moveTo(npc.sprite, targetX, targetY, npc.speed)

      // Останавливаем NPC через некоторое время
      const distance = Phaser.Math.Distance.Between(npc.sprite.x, npc.sprite.y, targetX, targetY)
      const duration = (distance / npc.speed) * 1000

      this.time.delayedCall(duration, () => {
        if (npc.sprite && npc.sprite.active && npc.sprite.body) {
          npc.sprite.body.reset(npc.sprite.x, npc.sprite.y)
        }
      })
    } catch (error) {
      console.error("Ошибка при случайном перемещении NPC:", error)
    }
  }

  private avoidPlayer(npc: NpcData, time: number): void {
    try {
      // Проверяем расстояние до игрока
      const distanceToPlayer = Phaser.Math.Distance.Between(npc.sprite.x, npc.sprite.y, this.player.x, this.player.y)

      // Если игрок слишком близко (но не слишком явно избегаем)
      if (distanceToPlayer < 150 && Math.random() < 0.01) {
        // Находим направление от игрока
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y)

        // Находим точку в противоположном от игрока направлении
        const targetX = npc.sprite.x + Math.cos(angle) * 100
        const targetY = npc.sprite.y + Math.sin(angle) * 100

        // Проверяем, находится ли точка в пределах игровой области
        if (this.isPointInPlayArea(targetX, targetY)) {
          // Перемещаем NPC в противоположном от игрока направлении
          this.physics.moveTo(npc.sprite, targetX, targetY, npc.speed)

          // Обновляем время следующего движения
          npc.nextMoveTime = time + Phaser.Math.Between(2000, 4000)
        }
      }
    } catch (error) {
      console.error("Ошибка при избегании игрока NPC:", error)
    }
  }

  private animateNpc(npc: NpcData, time: number): void {
    try {
      // Анимация движения в зависимости от типа NPC
      if (!npc.sprite.body || (!npc.sprite.body.velocity.x && !npc.sprite.body.velocity.y)) {
        return // Если NPC не движется, не анимируем
      }

      switch (npc.type) {
        case "snowman":
          // Плавное покачивание
          npc.sprite.angle = Math.sin(time / 200) * 2
          break
        case "strawman":
          // Дрожащее движение
          npc.sprite.x += Math.sin(time / 50) * 0.3
          break
        case "paperman":
          // Колебание вверх-вниз
          npc.sprite.y += Math.sin(time / 100) * 0.5
          break
        case "balloonman":
          // Плавное парение
          npc.sprite.y += Math.sin(time / 150) * 0.7
          npc.sprite.angle = Math.sin(time / 300) * 3
          break
      }
    } catch (error) {
      console.error("Ошибка при анимации NPC:", error)
    }
  }

  // Добавляем метод для настройки коллизий
  private setupCollisions(): void {
    try {
      // Удаляем старые коллизии
      this.colliders.forEach((collider) => {
        if (collider) collider.destroy()
      })
      this.colliders = []

      // Настраиваем коллизии между игроком и NPC
      const npcSprites = Array.from(this.npcs.values()).map((npc) => npc.sprite)
      if (npcSprites.length > 0) {
        const collider = this.physics.add.overlap(this.player, npcSprites, this.handleNpcCollision, undefined, this)
        this.colliders.push(collider)
      }
    } catch (error) {
      console.error("Ошибка при настройке коллизий:", error)
    }
  }

  // Обновляем метод handleNpcCollision для использования новых звуков
  private handleNpcCollision = (
    player: Phaser.GameObjects.GameObject,
    npcSprite: Phaser.GameObjects.GameObject,
  ): void => {
    try {
      // Находим данные NPC по спрайту
      let targetNpc: NpcData | undefined
      let targetId: string | undefined

      this.npcs.forEach((npc, id) => {
        if (npc.sprite === npcSprite) {
          targetNpc = npc
          targetId = id
        }
      })

      if (targetNpc && targetId && !this.burningNpcs.has(targetId)) {
        // Добавляем NPC в список горящих
        this.burningNpcs.add(targetId)

        // Отключаем физику для предотвращения повторных коллизий
        if (targetNpc.sprite.body) {
          targetNpc.sprite.body.enable = false
        }

        // Увеличиваем счетчик сожженных NPC
        const burnedCount = this.registry.get("burnedCount") || 0
        this.registry.set("burnedCount", burnedCount + 1)

        // Создаем эффекты в зависимости от типа NPC
        switch (targetNpc.type) {
          case "snowman":
            // Эффект таяния снеговика
            this.particleSystem.createMeltEffect(targetNpc.sprite.x, targetNpc.sprite.y)

            // Воспроизводим звук таяния снега
            this.soundSystem.playSfx("melting-snow", 0.6)
            this.soundSystem.playSfx("melting-ice", 0.4)

            // Анимация таяния (более медленная)
            this.tweens.add({
              targets: targetNpc.sprite,
              scaleY: 0.1,
              y: targetNpc.sprite.y + targetNpc.sprite.height * 0.4,
              alpha: 0,
              duration: 5000, // Увеличиваем длительность
              ease: "Sine.easeIn",
              onUpdate: (tween, target) => {
                // Эффект таяния - постепенное изменение цвета
                const progress = tween.progress
                if (progress < 0.3) {
                  target.setTint(0xffffff) // Белый
                } else if (progress < 0.6) {
                  target.setTint(0xccffff) // Голубоватый
                } else {
                  target.setTint(0x99ffff) // Более голубой
                }
              },
              onComplete: () => {
                if (targetNpc?.sprite) {
                  targetNpc.sprite.destroy()
                }
                this.npcs.delete(targetId!)
                this.burningNpcs.delete(targetId!)
                this.checkAllNpcsDestroyed()
              },
            })

            this.score += 10
            this.soundSystem.playSfx("collect-points", 0.5)
            break

          case "strawman":
            // Эффект горения соломенного человечка (более интенсивный)
            this.particleSystem.createBurningEffect(targetNpc.sprite.x, targetNpc.sprite.y, "straw")

            // Воспроизводим звук "крика" и горения для соломенного человечка
            this.soundSystem.playSfx("scream", 0.4)
            this.soundSystem.playSfx("fire-crackling-alt", 0.5)
            this.soundSystem.playSfx("fire-breath", 0.4)

            // Анимация горения (более медленная)
            this.tweens.add({
              targets: targetNpc.sprite,
              scaleX: "*=0.8",
              scaleY: "*=0.7",
              alpha: 0,
              duration: 6000, // Увеличиваем длительность
              ease: "Power2",
              onUpdate: (tween, target) => {
                // Эффект дрожания при горении
                if (target.alpha > 0.3) {
                  target.x += Math.random() * 2 - 1
                  target.y += Math.random() * 1 - 0.5

                  // Эффект обугливания (постепенное потемнение)
                  const progress = tween.progress
                  if (progress < 0.2) {
                    target.setTint(0xffcc00) // Желтый
                  } else if (progress < 0.4) {
                    target.setTint(0xff9900) // Оранжевый
                  } else if (progress < 0.6) {
                    target.setTint(0xff6600) // Темно-оранжевый
                  } else if (progress < 0.8) {
                    target.setTint(0x993300) // Коричневый
                  } else {
                    target.setTint(0x333333) // Темно-серый
                  }
                }
              },
              onComplete: () => {
                if (targetNpc?.sprite) {
                  targetNpc.sprite.destroy()
                }
                this.npcs.delete(targetId!)
                this.burningNpcs.delete(targetId!)
                this.checkAllNpcsDestroyed()
              },
            })

            this.score += 15
            this.soundSystem.playSfx("collect-points", 0.5)
            break

          case "paperman":
            // Эффект горения бумажного человечка (более интенсивный)
            this.particleSystem.createBurningEffect(targetNpc.sprite.x, targetNpc.sprite.y, "paper")

            // Воспроизводим звук горения бумаги
            this.soundSystem.playSfx("paper-burn", 0.6)
            this.soundSystem.playSfx("fire-crackling", 0.5)

            // Анимация быстрого сгорания (более медленная)
            this.tweens.add({
              targets: targetNpc.sprite,
              scaleX: "*=0.7",
              scaleY: "*=0.5",
              alpha: 0,
              duration: 5500, // Увеличиваем длительность
              ease: "Power3",
              onUpdate: (tween, target) => {
                // Эффект сморщивания бумаги
                if (target.alpha > 0.2) {
                  // Быстрое изменение цвета
                  const progress = tween.progress
                  if (progress < 0.2) {
                    target.setTint(0xffffcc) // Светло-желтый
                  } else if (progress < 0.4) {
                    target.setTint(0xffcc00) // Желтый
                  } else if (progress < 0.6) {
                    target.setTint(0xff6600) // Оранжевый
                  } else if (progress < 0.8) {
                    target.setTint(0x993300) // Коричневый
                  } else {
                    target.setTint(0x222222) // Почти черный
                  }
                }
              },
              onComplete: () => {
                if (targetNpc?.sprite) {
                  targetNpc.sprite.destroy()
                }
                this.npcs.delete(targetId!)
                this.burningNpcs.delete(targetId!)
                this.checkAllNpcsDestroyed()
              },
            })

            this.score += 20
            this.soundSystem.playSfx("collect-points", 0.5)
            break

          case "balloonman":
            // Эффект взрыва шарика (более интенсивный)
            this.particleSystem.createExplosionEffect(targetNpc.sprite.x, targetNpc.sprite.y)

            // Воспроизводим звук взрыва шарика (громче и четче)
            // Чередуем разные звуки взрыва шарика
            if (Math.random() > 0.5) {
              this.soundSystem.playSfx("balloon-pop", 1.0)
            } else {
              this.soundSystem.playSfx("balloon-pop-alt", 0.9)
            }

            // Добавляем звук свиста для эффекта
            this.soundSystem.playSfx("woosh", 0.4)

            // Мгновенное исчезновение с небольшим увеличением перед взрывом
            this.tweens.add({
              targets: targetNpc.sprite,
              scaleX: "*=1.3",
              scaleY: "*=1.3",
              duration: 200, // Немного увеличиваем длительность
              ease: "Sine.easeOut",
              onComplete: () => {
                // Мгновенное исчезновение
                if (targetNpc?.sprite) {
                  targetNpc.sprite.destroy()
                }
                this.npcs.delete(targetId!)
                this.burningNpcs.delete(targetId!)
                this.checkAllNpcsDestroyed()
              },
            })

            this.score += 25
            this.soundSystem.playSfx("collect-points", 0.5)
            break
        }

        // Обновляем счет
        this.scoreText.setText(`Счет: ${this.score}`)
      }
    } catch (error) {
      console.error("Ошибка при обработке столкновения с NPC:", error)
    }
  }

  // Добавим новый метод для проверки, все ли NPC уничтожены
  private checkAllNpcsDestroyed(): void {
    try {
      if (this.npcs.size === 0) {
        // Все NPC уничтожены, создаем новых через некоторое время
        // Но только если игра не закончена
        if (this.score < 100) {
          // Можно настроить условие окончания игры
          this.time.delayedCall(3000, () => {
            this.createNpcs()
          })
        } else {
          // Игра закончена, показываем сообщение о победе
          const winText = this.add.text(
            this.worldBounds.width / 2,
            this.worldBounds.height / 2,
            "Победа!\nНажмите для новой игры",
            {
              fontSize: "48px",
              color: "#fff",
              stroke: "#000",
              strokeThickness: 6,
              align: "center",
            },
          )
          winText.setOrigin(0.5)
          winText.setDepth(30)

          // Воспроизводим звук окончания игры
          this.soundSystem.playSfx("game-over", 0.7)

          // Добавляем обработчик клика для перезапуска игры
          this.input.once("pointerdown", () => {
            this.scene.restart()
          })
        }
      }
    } catch (error) {
      console.error("Ошибка при проверке уничтожения всех NPC:", error)
    }
  }
}
