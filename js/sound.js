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
    }

    async init() {
        // 尝试加载音效
        await this.loadSounds({
            shoot: 'sounds/shoot.wav',
            explosion: 'sounds/explosion.wav',
            powerup: 'sounds/powerup.wav',
            damage: 'sounds/damage.wav',
            gameOver: 'sounds/gameover.wav',
            bgm: 'sounds/bgm.mp3'
        });
    }

    async loadSounds(soundPaths) {
        for (const [name, path] of Object.entries(soundPaths)) {
            try {
                const audio = new Audio();
                
                // 创建一个 Promise 来检查音频是否可以加载
                await new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                    audio.addEventListener('error', () => reject(), { once: true });
                    audio.src = path;
                });

                // 如果加载成功，添加到音效库
                this.sounds[name] = audio;
                
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

            } catch (error) {
                console.log(`Failed to load sound: ${name}`);
            }
        }
    }

    play(soundName) {
        // 如果声音不存在，直接返回
        if (!this.sounds[soundName]) return;

        try {
            const sound = this.sounds[soundName];
            
            // 对于需要限制并发的音效
            if (this.maxConcurrent[soundName]) {
                if (this.playingSounds[soundName] >= this.maxConcurrent[soundName]) {
                    return;
                }
                this.playingSounds[soundName]++;
                
                // 播放完成后减少计数
                sound.addEventListener('ended', () => {
                    this.playingSounds[soundName]--;
                }, { once: true });
            }

            // 克隆音频对象以支持重叠播放
            const soundClone = sound.cloneNode();
            soundClone.play().catch(e => {
                console.log(`Sound play failed: ${soundName}`, e);
            });
        } catch (error) {
            console.log(`Error playing sound: ${soundName}`, error);
        }
    }

    startBGM() {
        if (this.sounds.bgm) {
            this.sounds.bgm.play().catch(e => {
                console.log("BGM play failed:", e);
            });
        }
    }

    stopBGM() {
        if (this.sounds.bgm) {
            this.sounds.bgm.pause();
            this.sounds.bgm.currentTime = 0;
        }
    }

    setVolumes(volumes) {
        for (const [key, volume] of Object.entries(volumes)) {
            if (this.sounds[key]) {
                this.sounds[key].volume = volume;
            }
        }
    }
} 