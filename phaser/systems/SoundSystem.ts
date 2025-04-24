import type Phaser from "phaser"

export default class SoundSystem {
  private scene: Phaser.Scene
  private sounds: Map<string, Phaser.Sound.BaseSound | null> = new Map()
  private music: Phaser.Sound.BaseSound | null = null
  private soundsEnabled = true
  private soundsLoaded = false
  private loadingInProgress = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Обновляем метод preload для загрузки новых звуков
  preload(): void {
    try {
      // Предварительно загружаем основные звуки и музыку
      this.scene.load.audio("click", "assets/sounds/mouse-click-290204.mp3")
      this.scene.load.audio("town-theme", "assets/sounds/town-theme-1-113018.mp3")
      this.scene.load.audio("ambient", "assets/sounds/watermill-in-the-old-town-loopable-325123.mp3")
      this.scene.load.audio("game-over", "assets/sounds/game-over-160612.mp3")
      this.scene.load.audio("level-up", "assets/sounds/level-passed-143039.mp3")
      this.scene.load.audio("bonus", "assets/sounds/game-bonus-144751.mp3")
      this.scene.load.audio("collect-points", "assets/sounds/collect-points-190037.mp3")
      this.scene.load.audio("balloon-pop", "assets/sounds/balloon-pop-48030.mp3")
      this.scene.load.audio("balloon-pop-alt", "assets/sounds/balloonpop-83760.mp3")
      this.scene.load.audio("fire-crackling", "assets/sounds/fire-cracklingwav-14834.mp3")
      this.scene.load.audio("fire-crackling-alt", "assets/sounds/crackling-fire-sound-effect-226119.mp3")
      this.scene.load.audio("fire-breath", "assets/sounds/fire-breath-6922.mp3")
      this.scene.load.audio("woosh", "assets/sounds/deep-and-cinematic-woosh-sound-effect-318325.mp3")
      this.scene.load.audio("scream", "assets/sounds/80s-scream-255968.mp3")
      this.scene.load.audio("footsteps-concrete", "assets/sounds/concrete-footsteps-2wav-14794.mp3")
      this.scene.load.audio("footsteps-gravel", "assets/sounds/footsteps-dirt-gravel-6823.mp3")
    } catch (error) {
      console.error("Ошибка при предзагрузке звуков:", error)
    }
  }

  // Обновляем метод loadSounds для загрузки и инициализации новых звуков
  loadSounds(): void {
    if (this.soundsLoaded || this.loadingInProgress) return

    try {
      this.loadingInProgress = true

      // Создаем заглушки для всех звуков (null вместо реального звука)
      const soundKeys = [
        "click",
        "footsteps-concrete",
        "footsteps-gravel",
        "scream",
        "balloon-pop",
        "balloon-pop-alt",
        "flame-whoosh",
        "woosh",
        "fire-breath",
        "fire-crackling",
        "fire-crackling-alt",
        "paper-burn",
        "melting-ice",
        "melting-snow",
        "bonus",
        "collect-points",
        "level-up",
        "game-over",
      ]

      // Инициализируем все звуки как null
      for (const key of soundKeys) {
        this.sounds.set(key, null)
      }

      // Загружаем звуки безопасно
      this.safeLoadSound("click", 0.5)
      this.safeLoadSound("footsteps-concrete", 0.3)
      this.safeLoadSound("footsteps-gravel", 0.3)
      this.safeLoadSound("scream", 0.5)
      this.safeLoadSound("balloon-pop", 1.0)
      this.safeLoadSound("balloon-pop-alt", 0.8)
      this.safeLoadSound("woosh", 0.5)
      this.safeLoadSound("fire-breath", 0.6)
      this.safeLoadSound("fire-crackling", 0.4)
      this.safeLoadSound("fire-crackling-alt", 0.4)
      this.safeLoadSound("paper-burn", 0.5, "assets/sounds/paper-burn-6927.mp3")
      this.safeLoadSound("melting-ice", 0.5, "assets/sounds/melting-ice-78189.mp3")
      this.safeLoadSound("melting-snow", 0.5, "assets/sounds/melting-snow-dripping-from-trees-51118.mp3")
      this.safeLoadSound("bonus", 0.5)
      this.safeLoadSound("collect-points", 0.5)
      this.safeLoadSound("level-up", 0.5)
      this.safeLoadSound("game-over", 0.7)
      this.safeLoadSound("flame-whoosh", 0.4, "assets/sounds/short-fire-whoosh_1-317280.mp3")

      // Загружаем музыку безопасно
      this.safeLoadMusic("town-theme", 0.4)
      this.safeLoadSound("ambient", 0.2, undefined, true)

      this.soundsLoaded = true
      this.loadingInProgress = false
    } catch (error) {
      console.error("Ошибка при инициализации звуковой системы:", error)
      this.soundsEnabled = false
      this.loadingInProgress = false
    }
  }

  private safeLoadSound(key: string, defaultVolume: number, path?: string, autoplay = false): void {
    try {
      // Проверяем, существует ли уже звук в кэше
      if (this.scene.cache.audio.exists(key)) {
        try {
          const sound = this.scene.sound.add(key, { loop: autoplay })
          this.sounds.set(key, sound)
          console.log(`Звук ${key} успешно загружен из кэша`)

          if (autoplay && this.soundsEnabled) {
            sound.play({ volume: defaultVolume, loop: true })
          }
        } catch (e) {
          console.warn(`Не удалось создать звук ${key} из кэша:`, e)
        }
      } else if (path) {
        // Если звук не в кэше и указан путь, загружаем его
        this.scene.load.audio(key, path)
        this.scene.load.once(`filecomplete-audio-${key}`, () => {
          try {
            const sound = this.scene.sound.add(key, { loop: autoplay })
            this.sounds.set(key, sound)
            console.log(`Звук ${key} успешно загружен по пути ${path}`)

            if (autoplay && this.soundsEnabled) {
              sound.play({ volume: defaultVolume, loop: true })
            }
          } catch (e) {
            console.warn(`Не удалось создать звук ${key} после загрузки:`, e)
          }
        })
        this.scene.load.start()
      }
    } catch (error) {
      console.error(`Ошибка при безопасной загрузке звука ${key}:`, error)
    }
  }

  private safeLoadMusic(key: string, volume: number): void {
    try {
      // Проверяем, существует ли уже музыка в кэше
      if (this.scene.cache.audio.exists(key)) {
        try {
          this.music = this.scene.sound.add(key, { loop: true })
          console.log(`Музыка ${key} успешно загружена из кэша`)

          if (this.soundsEnabled) {
            this.music.play({ volume, loop: true })
          }
        } catch (e) {
          console.warn(`Не удалось создать музыку ${key} из кэша:`, e)
          this.music = null
        }
      }
    } catch (error) {
      console.error(`Ошибка при безопасной загрузке музыки ${key}:`, error)
      this.music = null
    }
  }

  playSfx(key: string, volume = 1, loop = false): void {
    try {
      if (!this.soundsEnabled) return

      const sound = this.sounds.get(key)
      if (sound) {
        // Проверяем, не воспроизводится ли уже звук с параметром loop
        if (loop && sound.isPlaying) {
          return // Не запускаем повторно зацикленные звуки
        }
        sound.play({ volume, loop })
      } else {
        // Если звук не найден, пробуем загрузить его
        this.safeLoadSound(key, volume, undefined, loop)
      }
    } catch (error) {
      // Просто игнорируем ошибки воспроизведения
      console.warn(`Не удалось воспроизвести звук ${key}:`, error)
    }
  }

  playMusic(key: string, volume = 0.5, loop = true): void {
    try {
      if (!this.soundsEnabled || !this.music) return

      if (!this.music.isPlaying) {
        this.music.play({ volume, loop })
        console.log("Музыка запущена")
      } else {
        console.log("Музыка уже играет")
      }
    } catch (error) {
      console.warn("Не удалось воспроизвести музыку:", error)
    }
  }

  stopMusic(): void {
    try {
      if (!this.soundsEnabled || !this.music) return

      if (this.music.isPlaying) {
        this.music.stop()
      }
    } catch (error) {
      console.warn("Не удалось остановить музыку:", error)
    }
  }

  // Метод для включения/выключения звуков
  toggleSounds(enabled: boolean): void {
    this.soundsEnabled = enabled
    if (!enabled) {
      // Останавливаем музыку
      if (this.music && this.music.isPlaying) {
        this.music.stop()
      }

      // Останавливаем все звуки
      this.sounds.forEach((sound) => {
        if (sound && sound.isPlaying) {
          sound.stop()
        }
      })
    } else if (enabled && this.music && !this.music.isPlaying) {
      // Возобновляем музыку
      this.music.play({ volume: 0.4, loop: true })

      // Возобновляем фоновый амбиент
      const ambient = this.sounds.get("ambient")
      if (ambient && !ambient.isPlaying) {
        ambient.play({ volume: 0.2, loop: true })
      }

      // Возобновляем фоновый звук потрескивания огня
      const fireCrackling = this.sounds.get("fire-crackling")
      if (fireCrackling && !fireCrackling.isPlaying) {
        fireCrackling.play({ volume: 0.2, loop: true })
      }
    }
  }

  // Метод для проверки, включены ли звуки
  isSoundsEnabled(): boolean {
    return this.soundsEnabled
  }
}
