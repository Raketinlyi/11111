import Phaser from "phaser"

export default class SoundSystem {
  private scene: Phaser.Scene
  private sounds: Map<string, Phaser.Sound.BaseSound | null> = new Map()
  private music: Phaser.Sound.BaseSound | null = null
  private soundsEnabled = true
  private soundsLoaded = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  preload(): void {
    // Предварительно загружаем основные звуки
    this.scene.load.audio("balloon-pop", ["assets/sounds/balloon-pop.ogg", "assets/sounds/balloon-pop.mp3"])
    this.scene.load.audio("town-music2", ["assets/sounds/town-music2.ogg", "assets/sounds/town-music2.mp3"])
  }

  // Изменим метод loadSounds(), чтобы не запускать музыку автоматически
  loadSounds(): void {
    if (this.soundsLoaded) return

    try {
      // Создаем заглушки для всех звуков (null вместо реального звука)
      const soundKeys = ["footsteps-1", "footsteps-2", "scream", "balloon-pop", "flame-whoosh-1", "flame-whoosh-2"]

      // Инициализируем все звуки как null
      for (const key of soundKeys) {
        this.sounds.set(key, null)
      }

      // Пытаемся загрузить только нужные звуки асинхронно
      this.loadSoundAsync("footsteps-1", 0.2)
      this.loadSoundAsync("footsteps-2", 0.2)
      this.loadSoundAsync("scream", 0.4)
      this.loadSoundAsync("balloon-pop", 1.0)
      this.loadSoundAsync("flame-whoosh-1", 0.3)
      this.loadSoundAsync("flame-whoosh-2", 0.3)

      // Загружаем музыку, но не запускаем её автоматически
      try {
        this.music = this.scene.sound.add("town-music2", { loop: true, volume: 0.3 })
        console.log("Музыка town-music2 успешно загружена")
      } catch (e) {
        console.warn("Не удалось загрузить музыку town-music2:", e)
        this.music = null
      }

      this.soundsLoaded = true
    } catch (error) {
      console.error("Ошибка при инициализации звуковой системы:", error)
      this.soundsEnabled = false
    }
  }

  private loadSoundAsync(key: string, defaultVolume: number): void {
    try {
      // Создаем временный загрузчик
      const loader = this.scene.load.audio(key, [`assets/sounds/${key}.ogg`, `assets/sounds/${key}.mp3`])

      // Обработчик успешной загрузки
      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        try {
          const sound = this.scene.sound.add(key)
          this.sounds.set(key, sound)
          console.log(`Звук ${key} успешно загружен`)
        } catch (e) {
          console.warn(`Не удалось создать звук ${key} после загрузки:`, e)
          // Оставляем null в качестве заглушки
        }
      })

      // Обработчик ошибки загрузки
      this.scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: any) => {
        console.warn(`Не удалось загрузить ${key}, звук будет отключен`)
      })

      // Запускаем загрузку
      this.scene.load.start()
    } catch (error) {
      console.error(`Ошибка при загрузке звука ${key}:`, error)
      // Оставляем null в качестве заглушки
    }
  }

  playSfx(key: string, volume = 1): void {
    try {
      if (!this.soundsEnabled) return

      const sound = this.sounds.get(key)
      if (sound) {
        sound.play({ volume })
      } else {
        console.warn(`Звук ${key} не найден`)
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
    if (!enabled && this.music && this.music.isPlaying) {
      this.music.stop()
    } else if (enabled && this.music && !this.music.isPlaying) {
      this.music.play({ volume: 0.3, loop: true })
    }
  }

  // Метод для проверки, включены ли звуки
  isSoundsEnabled(): boolean {
    return this.soundsEnabled
  }
}
