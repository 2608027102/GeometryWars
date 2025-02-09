class SoundManager {
    constructor() {
        // 音效库
        this.sounds = {};
        
        // 用于跟踪同时播放的音效数量
        this.playingSounds = {
            shoot: 0,
            explosion: 0
        };
        
        // 最大同时播放数
        this.maxConcurrent = {
            shoot: 3,
            explosion: 5
        };
        
        // 音频上下文
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported');
        }

        // 添加加载状态追踪
        this.loadedSounds = new Set();
    }

    async init() {
        console.log('Initializing sound system...');
        // 尝试加载音效
        const soundPaths = {
            shoot: './sounds/shoot.wav',
            explosion: './sounds/explosion.wav',
            powerup: './sounds/powerup.wav',
            damage: './sounds/damage.wav',
            gameOver: './sounds/gameover.wav',
            bgm: './sounds/bgm.wav'
        };

        try {
            await this.loadSounds(soundPaths);
            console.log('Sound initialization complete');
        } catch (error) {
            console.error('Sound initialization failed:', error);
            throw error;
        }
    }

    async loadSounds(soundPaths) {
        const loadPromises = [];
        console.log('Loading sounds from paths:', soundPaths);

        for (const [name, path] of Object.entries(soundPaths)) {
            try {
                console.log(`Attempting to load sound: ${name} from ${path}`);
                const audio = new Audio();
                
                const loadPromise = new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', () => {
                        console.log(`Successfully loaded sound: ${name}`);
                        this.loadedSounds.add(name);
                        resolve();
                    }, { once: true });
                    
                    audio.addEventListener('error', (e) => {
                        console.error(`Failed to load sound: ${name} from ${path}`, e);
                        reject(new Error(`Failed to load sound: ${name}`));
                    }, { once: true });
                });

                audio.src = path;
                
                // 设置特殊属性
                if (name === 'bgm') {
                    audio.loop = true;
                }
                
                // 设置默认音量
                const volumes = {
                    shoot: 0.3,
                    explosion: 0.4,
                    powerup: 0.5,
                    damage: 0.5,
                    gameOver: 0.6,
                    bgm: 0.3
                };
                audio.volume = volumes[name] || 0.5;

                // 预加载音频
                audio.load();
                
                // 存储音频对象
                this.sounds[name] = {
                    element: audio,
                    pool: [audio]
                };

                // 为频繁播放的音效创建多个实例
                if (this.maxConcurrent[name]) {
                    for (let i = 1; i < this.maxConcurrent[name]; i++) {
                        const clone = audio.cloneNode();
                        clone.load();
                        this.sounds[name].pool.push(clone);
                    }
                }

                loadPromises.push(loadPromise);
            } catch (error) {
                console.error(`Error setting up sound: ${name}`, error);
            }
        }

        // 等待所有音频加载完成
        await Promise.all(loadPromises);
    }

    play(soundName) {
        if (!this.sounds[soundName] || !this.loadedSounds.has(soundName)) {
            console.log(`Sound not loaded: ${soundName}`);
            return;
        }

        try {
            const soundData = this.sounds[soundName];
            const availableAudio = soundData.pool.find(audio => 
                audio.paused || audio.ended
            );

            if (availableAudio) {
                availableAudio.currentTime = 0;
                const playPromise = availableAudio.play();
                if (playPromise) {
                    playPromise.catch(e => {
                        console.error(`Sound play failed: ${soundName}`, e);
                    });
                }
            }
        } catch (error) {
            console.error(`Error playing sound: ${soundName}`, error);
        }
    }

    startBGM() {
        if (!this.sounds.bgm || !this.loadedSounds.has('bgm')) {
            console.log('BGM not loaded');
            return;
        }

        const bgm = this.sounds.bgm.element;
        bgm.currentTime = 0;
        const playPromise = bgm.play();
        if (playPromise) {
            playPromise.catch(e => {
                console.error("BGM play failed:", e);
            });
        }
    }

    stopBGM() {
        if (this.sounds.bgm) {
            const bgm = this.sounds.bgm.element;
            bgm.pause();
            bgm.currentTime = 0;
        }
    }

    setVolumes(volumes) {
        for (const [key, volume] of Object.entries(volumes)) {
            if (this.sounds[key]) {
                this.sounds[key].pool.forEach(audio => {
                    audio.volume = volume;
                });
            }
        }
    }
} 