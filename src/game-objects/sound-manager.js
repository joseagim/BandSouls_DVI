class SoundManager {

     static instance = null;

    constructor(scene) {
        if(SoundManager.instance) {
            return SoundManager.instance;
        }
        SoundManager.instance = this;
        this.scene = scene;
        this.sounds = {};
        this.music = null;
        this.currentMusic = null;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.masterVolume = 1.0;
        this.muted = false;
        
        // Categorías de sonidos
        this.categories = {
            MUSIC: 'music',
            SFX: 'sfx',
            UI: 'ui',
            AMBIENT: 'ambient'
        };
    }
    static getInstance(scene = null) {
        if(!SoundManager.instance && scene) {
            SoundManager.instance = new SoundManager(scene);
        }
        return SoundManager.instance;
    }

    /**
     * Cargar un sonido individual
     */
    addSound(key, config = {}) {
        const defaultConfig = {
            volume: this.sfxVolume,
            loop: false,
            rate: 1,
            detune: 0,
            seek: 0,
            loopDelay: 0,
            pan: 0,
            category: this.categories.SFX
        };

        this.sounds[key] = { ...defaultConfig, ...config };
    }

    /**
     * Cargar múltiples sonidos a la vez
     */
    addSounds(soundsConfig) {
        Object.entries(soundsConfig).forEach(([key, config]) => {
            this.addSound(key, config);
        });
    }

    /**
     * Reproducir un sonido
     */
    play(key, config = {}) {
        if (this.muted) return null;

        const soundConfig = this.sounds[key];
        if (!soundConfig) {
            console.warn(`Sonido "${key}" no encontrado`);
            return null;
        }

        // Mezclar configuración base con la configuración específica
        const playConfig = {
            ...soundConfig,
            ...config,
            volume: this.calculateVolume(soundConfig.category, config.volume || soundConfig.volume)
        };

        // Si el sonido ya está sonando y no debe superponerse
        if (playConfig.restrict && this.isPlaying(key)) {
            return null;
        }

        // LÓGICA PARA EVITAR DUPLICADOS (Especialmente para caminar/bucles)
        let sound = this.scene.sound.get(key);
        
        if (!sound) {
            sound = this.scene.sound.add(key, playConfig);
        }

        if (!sound.isPlaying) {
            sound.play(playConfig);
        }

        // Si es música, guardar referencia
        if (soundConfig.category === this.categories.MUSIC) {
            this.currentMusic = sound;
            this.setupMusicEvents(sound);
        }

        return sound;
    }

    /**
     * Calcular volumen basado en categorías
     */
    calculateVolume(category, baseVolume) {
        let volume = baseVolume * this.masterVolume;

        switch(category) {
            case this.categories.MUSIC:
                volume *= this.musicVolume;
                break;
            case this.categories.SFX:
            case this.categories.UI:
            case this.categories.AMBIENT:
                volume *= this.sfxVolume;
                break;
        }

        return Math.min(1, Math.max(0, volume));
    }

    /**
     * Configurar eventos para la música
     */
    setupMusicEvents(music) {
        music.on('loop', () => {
            this.scene.events.emit('musicLooped', music.key);
        });

        music.on('complete', () => {
            this.scene.events.emit('musicComplete', music.key);
            this.currentMusic = null;
        });
    }

    /**
     * Reproducir música de fondo (con fade)
     */
    playMusic(key, fadeIn = 1000, loop = true) {
        // Si ya está sonando la misma música, no hacer nada
        if (this.currentMusic && this.currentMusic.key === key && this.currentMusic.isPlaying) {
            return this.currentMusic;
        }

        // Detener música actual con fade out
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.fadeOutMusic(500);
        }

        // Pequeño delay para el fade out
        this.scene.time.delayedCall(500, () => {
            const music = this.play(key, {
                loop: loop,
                volume: 0,
                category: this.categories.MUSIC
            });

            if (music) {
                // Fade in
                this.scene.tweens.add({
                    targets: music,
                    volume: this.calculateVolume(this.categories.MUSIC, this.sounds[key].volume || 0.5),
                    duration: fadeIn,
                    ease: 'Linear'
                });
            }
        });

        return this.currentMusic;
    }

    /**
     * Detener música con fade out
     */
    fadeOutMusic(duration = 1000) {
        if (!this.currentMusic) return;

        this.scene.tweens.add({
            targets: this.currentMusic,
            volume: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                if (this.currentMusic) {
                    this.currentMusic.stop();
                    this.currentMusic = null;
                }
            }
        });
    }

    /**
     * Reproducir sonido con variación aleatoria (útil para pasos, golpes, etc)
     */
    playRandom(key, variations = 3, config = {}) {
        const randomIndex = Phaser.Math.Between(1, variations);
        const variationKey = `${key}${randomIndex}`;
        
        // Verificar si existe la variación
        if (this.scene.sound.get(variationKey)) {
            return this.play(variationKey, config);
        } else {
            return this.play(key, config);
        }
    }

    /**
     * Verificar si un sonido está sonando
     */
    isPlaying(key) {
        const sound = this.scene.sound.get(key);
        return sound && sound.isPlaying;
    }

    /**
     * Detener un sonido específico
     */
    stop(key) {
        
        const sound = this.scene.sound.get(key);
        if (sound) {
            console.log(`Stopping sound: ${key}`);
            sound.stop();
        }
    }

    /**
     * Detener todos los sonidos
     */
    stopAll() {
        this.scene.sound.stopAll();
        this.currentMusic = null;
    }

    /**
     * Pausar todos los sonidos
     */
    pauseAll() {
        this.scene.sound.pauseAll();
    }

    /**
     * Reanudar todos los sonidos
     */
    resumeAll() {
        this.scene.sound.resumeAll();
    }

    /**
     * Silenciar/Activar sonido
     */
    setMute(mute) {
        this.muted = mute;
        this.scene.sound.setMute(mute);
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.setMute(!this.muted);
        return this.muted;
    }

    /**
     * Setear volumen maestro
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    /**
     * Setear volumen de música
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateCategoryVolume(this.categories.MUSIC);
    }

    /**
     * Setear volumen de efectos
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateCategoryVolume(this.categories.SFX);
        this.updateCategoryVolume(this.categories.UI);
        this.updateCategoryVolume(this.categories.AMBIENT);
    }

    /**
     * Actualizar volumen de una categoría
     */
    updateCategoryVolume(category) {
        this.scene.sound.getAllPlaying().forEach(sound => {
            const soundConfig = this.sounds[sound.key];
            if (soundConfig && soundConfig.category === category) {
                sound.setVolume(this.calculateVolume(category, soundConfig.volume));
            }
        });
    }

    /**
     * Actualizar todos los volúmenes
     */
    updateAllVolumes() {
        this.scene.sound.getAllPlaying().forEach(sound => {
            const soundConfig = this.sounds[sound.key];
            if (soundConfig) {
                sound.setVolume(this.calculateVolume(soundConfig.category, soundConfig.volume));
            }
        });
    }

    /**
     * Guardar preferencias de audio
     */
    savePreferences() {
        const preferences = {
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            muted: this.muted
        };
        
        localStorage.setItem('audioPreferences', JSON.stringify(preferences));
    }

    /**
     * Cargar preferencias de audio
     */
    loadPreferences() {
        const saved = localStorage.getItem('audioPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                this.setMasterVolume(preferences.masterVolume);
                this.setMusicVolume(preferences.musicVolume);
                this.setSFXVolume(preferences.sfxVolume);
                this.setMute(preferences.muted);
            } catch (e) {
                console.warn('Error cargando preferencias de audio');
            }
        }
    }

       /**
     * Reproducir sonido con pitch aleatorio
     */
    playWithPitch(key, minPitch = 0.8, maxPitch = 1.2, config = {}) {
        const pitch = Phaser.Math.FloatBetween(minPitch, maxPitch);
        return this.play(key, { ...config, rate: pitch });
    }
}

export default SoundManager;