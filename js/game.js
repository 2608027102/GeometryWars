class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.canvas.width = window.innerWidth - 20;
        this.canvas.height = window.innerHeight - 20;
        
        // 游戏状态
        this.isRunning = false;
        this.score = 0;
        
        // 初始化游戏对象
        this.player = null;
        this.enemies = [];
        this.particles = [];
        
        // 绑定窗口调整大小事件
        window.addEventListener('resize', () => this.handleResize());
        
        // 添加敌人生成相关的属性
        this.enemySpawnInterval = 1000; // 每秒生成一个敌人
        this.lastSpawnTime = 0;
        this.difficultyMultiplier = 1;
        this.maxEnemies = 50; // 最大敌人数量
        
        // 将游戏实例存储在全局变量中，以便子弹系统访问画布尺寸
        window.game = this;
        
        this.powerups = [];
        this.lastPowerupTime = 0;
        this.powerupInterval = 10000; // 每10秒生成一个道具
        
        // 添加提示系统
        this.notifications = [];
        this.notificationDuration = 2000; // 提示显示2秒
        
        // 设置游戏循环的更新频率
        this.fps = 144;
        this.frameInterval = 1000 / this.fps;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        
        // 游戏状态
        this.gameState = 'menu'; // 'menu', 'playing', 'gameover'
        
        // 玩家生命值
        this.playerHealth = 200;
        
        // 版本信息
        this.version = '0.0.1';
        this.author = 'WJL';
        
        // 按钮区域
        this.buttons = {
            start: {
                x: this.canvas.width / 2 - 100,
                y: this.canvas.height / 2 - 50,
                width: 200,
                height: 50,
                text: '开始游戏'
            },
            about: {
                x: this.canvas.width / 2 - 100,
                y: this.canvas.height / 2 + 20,
                width: 200,
                height: 50,
                text: '简介'
            },
            restart: {
                x: this.canvas.width / 2 - 100,
                y: this.canvas.height / 2 + 50,
                width: 200,
                height: 50,
                text: '重新开始'
            }
        };
        
        // 绑定点击事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 添加受伤闪烁效果的属性
        this.damageFlashDuration = 500; // 警告显示持续时间（毫秒）
        this.lastDamageTime = 0;
        
        // 添加游戏开始时间
        this.gameStartTime = 0;
        // 添加道具统计
        this.powerupStats = {
            multishot: 0,
            bigshot: 0,
            rapidfire: 0,
            piercing: 0,
            split: 0,
            spread: 0,
            shield: 0
        };
        
        // 游戏时间相关
        this.currentGameTime = 0; // 添加当前游戏时间
        
        // 初始化音效管理器
        this.soundManager = new SoundManager();
        
        // 标记音频是否准备就绪
        this.soundReady = false;
        
        // 初始化音效系统
        this.initSound();
    }

    async initSound() {
        try {
            await this.soundManager.init();
            console.log('Sound system initialized');
            this.soundReady = true;
        } catch (error) {
            console.error('Failed to initialize sound system:', error);
        }
    }

    async init() {
        // 等待音频系统初始化
        await this.initSound();
        
        // 初始化游戏
        this.isRunning = true;
        this.score = 0;
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        
        // 开始游戏循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    handleResize() {
        this.canvas.width = window.innerWidth - 20;
        this.canvas.height = window.innerHeight - 20;
    }

    update() {
        if (this.gameState !== 'playing') {
            // 如果游戏结束，停止背景音乐并播放结束音效
            if (this.gameState === 'gameover' && this.soundReady) {
                this.soundManager.stopBGM();
                // 添加一个标记，确保音效只播放一次
                if (!this.gameOverSoundPlayed) {
                    this.soundManager.play('gameOver');
                    this.gameOverSoundPlayed = true;
                }
            }
            return;
        }
        
        if (!this.isRunning) return;
        
        // 更新玩家（包括子弹）
        this.player.update();
        
        // 检查子弹碰撞
        this.checkBulletCollisions();
        
        // 生成敌人
        this.spawnEnemies();
        
        // 更新敌人
        this.enemies = this.enemies.filter(enemy => {
            enemy.update();
            return true; // 后面添加碰撞检测后，这里会根据碰撞结果返回false来移除敌人
        });
        
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        // 增加难度
        this.updateDifficulty();
        
        // 生成道具
        this.spawnPowerup();
        
        // 更新道具
        this.powerups.forEach(powerup => powerup.update());
        
        // 检查道具碰撞
        this.checkPowerupCollisions();
        
        // 检查玩家碰撞
        this.checkPlayerCollisions();
        
        // 检查玩家生命值
        if (this.playerHealth <= 0) {
            this.gameState = 'gameover';
            this.gameOverSoundPlayed = false; // 重置标记
        }
        
        // 更新游戏时间
        if (this.gameState === 'playing') {
            this.currentGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        }
    }

    draw() {
        if (this.gameState === 'menu') {
            this.drawMenu();
        } else if (this.gameState === 'playing') {
            // 现有的游戏绘制代码
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.player.draw(this.ctx);
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            this.particles.forEach(particle => particle.draw(this.ctx));
            this.powerups.forEach(powerup => powerup.draw(this.ctx));
            
            // 绘制受伤警告效果
            this.drawDamageWarning();
            
            this.drawGameInfo();
            this.drawNotifications();
        } else if (this.gameState === 'gameover') {
            this.drawGameOver();
        }
    }

    drawGameInfo() {
        // 设置文本对齐方式为左对齐
        this.ctx.textAlign = 'left';
        
        // 绘制分数
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`分数: ${this.score}`, 20, 30);
        
        // 绘制血量条
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthBarX = 20;
        const healthBarY = 45;
        const healthPercentage = this.playerHealth / 200; // 200是最大生命值
        
        // 绘制血量条背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // 绘制当前血量
        const gradient = this.ctx.createLinearGradient(healthBarX, 0, healthBarX + healthBarWidth, 0);
        gradient.addColorStop(0, '#ff0000');    // 红色
        gradient.addColorStop(0.5, '#ffff00');  // 黄色
        gradient.addColorStop(1, '#00ff00');    // 绿色
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            healthBarX, 
            healthBarY, 
            healthBarWidth * healthPercentage, 
            healthBarHeight
        );
        
        // 绘制血量条边框
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // 在血量条上显示具体数值
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
            `${this.playerHealth} / 200`, 
            healthBarX + (healthBarWidth - 60) / 2, 
            healthBarY + 15
        );
        
        // 绘制游戏时间
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        const minutes = Math.floor(this.currentGameTime / 60);
        const seconds = this.currentGameTime % 60;
        this.ctx.fillText(
            `游戏时间: ${minutes}分${seconds}秒`, 
            20, 
            90
        );
        
        // 绘制 FPS（右上角）
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`FPS: ${this.currentFps}`, this.canvas.width - 20, 30);

        // 重置为左对齐，绘制道具状态
        this.ctx.textAlign = 'left';
        let y = 120; // 从游戏时间下方开始显示道具状态
        const powerups = this.player.powerups;
        
        for (const [type, count] of Object.entries(powerups)) {
            if (count > 0) {
                const color = this.getPowerupColor(type);
                this.ctx.fillStyle = color;
                
                // 转换道具名称为中文
                const names = {
                    multishot: '多重射击',
                    bigshot: '大型子弹',
                    rapidfire: '快速射击',
                    piercing: '穿透子弹',
                    split: '分裂子弹',
                    spread: '散射',
                    shield: '护盾'
                };
                
                this.ctx.fillText(`${names[type]}: ${count}`, 20, y);
                y += 25;
            }
        }
    }

    drawNotifications() {
        const currentTime = Date.now();
        this.notifications = this.notifications.filter(notification => {
            const age = currentTime - notification.time;
            if (age < this.notificationDuration) {
                // 计算透明度
                const alpha = 1 - (age / this.notificationDuration);
                
                // 设置文本样式
                this.ctx.save();
                this.ctx.fillStyle = notification.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.font = 'bold 24px Arial';
                
                // 在屏幕中央上方显示提示
                const textWidth = this.ctx.measureText(notification.message).width;
                const x = (this.canvas.width - textWidth) / 2;
                const y = 100 + (age / 100); // 文字会缓慢向下移动
                
                // 绘制文本阴影
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText(notification.message, x, y);
                
                this.ctx.restore();
                return true;
            }
            return false;
        });
    }

    drawMenu() {
        // 绘制菜单界面
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制标题
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Geometry Wars', this.canvas.width / 2, this.canvas.height / 3);

        // 绘制按钮
        this.drawButton(this.buttons.start);
        this.drawButton(this.buttons.about);
    }

    drawGameOver() {
        // 绘制半透明黑色背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 设置文本样式
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        
        // 绘制游戏结束标题
        this.ctx.font = '48px Arial';
        this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 4);

        // 绘制游戏统计信息
        this.ctx.font = '24px Arial';
        let y = this.canvas.height / 3;
        const lineHeight = 35;

        // 游戏时间（使用最终的游戏时间，而不是继续计算）
        const minutes = Math.floor(this.currentGameTime / 60);
        const seconds = this.currentGameTime % 60;
        this.ctx.fillText(
            `游戏时间: ${minutes}分${seconds}秒`, 
            this.canvas.width / 2, 
            y += lineHeight
        );

        // 最终分数
        this.ctx.fillText(
            `最终得分: ${this.score}`, 
            this.canvas.width / 2, 
            y += lineHeight
        );

        // 道具统计
        y += lineHeight;
        this.ctx.fillText('道具统计:', this.canvas.width / 2, y);
        
        const powerupNames = {
            multishot: '多重射击',
            bigshot: '大型子弹',
            rapidfire: '快速射击',
            piercing: '穿透子弹',
            split: '分裂子弹',
            spread: '散射',
            shield: '护盾'
        };

        for (const [type, count] of Object.entries(this.powerupStats)) {
            if (count > 0) {
                this.ctx.fillText(
                    `${powerupNames[type]}: ${count}个`,
                    this.canvas.width / 2,
                    y += lineHeight
                );
            }
        }

        // 绘制重新开始按钮
        y += lineHeight * 2;
        this.buttons.restart.y = y;
        this.drawButton(this.buttons.restart);
    }

    drawButton(button) {
        // 绘制按钮
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(button.x, button.y, button.width, button.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2 + 8);
    }

    gameLoop(currentTime) {
        // 计算帧间隔
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
            this.lastFpsUpdate = currentTime;
        }
        const deltaTime = currentTime - this.lastFrameTime;

        // 计算 FPS
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) { // 每秒更新一次 FPS
            this.currentFps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }

        // 只有当经过足够的时间间隔才更新
        if (deltaTime >= this.frameInterval) {
            this.update();
            this.draw();
            this.lastFrameTime = currentTime;
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    spawnEnemies() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime >= this.enemySpawnInterval && 
            this.enemies.length < this.maxEnemies) {
            
            this.lastSpawnTime = currentTime;
            
            // 随机选择敌人类型
            const types = ['seeker', 'wanderer', 'spinner'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            // 在画布边缘随机位置生成敌人
            const spawnPoint = this.getRandomSpawnPoint();
            
            const enemy = new Enemy(
                spawnPoint.x,
                spawnPoint.y,
                type,
                this.player
            );
            
            this.enemies.push(enemy);
        }
    }

    getRandomSpawnPoint() {
        const margin = 50;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(side) {
            case 0: // top
                return {
                    x: Math.random() * this.canvas.width,
                    y: -margin
                };
            case 1: // right
                return {
                    x: this.canvas.width + margin,
                    y: Math.random() * this.canvas.height
                };
            case 2: // bottom
                return {
                    x: Math.random() * this.canvas.width,
                    y: this.canvas.height + margin
                };
            case 3: // left
                return {
                    x: -margin,
                    y: Math.random() * this.canvas.height
                };
        }
    }

    updateDifficulty() {
        // 每30秒增加难度
        const difficultyIncrease = Math.floor(this.score / 1000);
        this.difficultyMultiplier = 1 + (difficultyIncrease * 0.1);
        
        // 更新生成间隔
        this.enemySpawnInterval = Math.max(
            200, // 最小生成间隔
            1000 - (difficultyIncrease * 100) // 每提高难度减少100ms
        );
    }

    checkBulletCollisions() {
        this.player.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.size + bullet.size) {
                    // 处理分裂效果
                    if (bullet.split > 0) {
                        const splitBullets = bullet.createSplitBullets();
                        this.player.bullets.push(...splitBullets);
                    }
                    
                    // 处理穿透效果
                    if (bullet.piercing > 0) {
                        bullet.piercing--;
                    } else {
                        this.player.bullets.splice(bulletIndex, 1);
                    }
                    
                    // 移除敌人
                    this.enemies.splice(enemyIndex, 1);
                    
                    // 增加分数
                    this.score += 100;
                    
                    // 创建爆炸效果
                    this.createExplosion(enemy.x, enemy.y, enemy.color);
                    
                    // 播放爆炸音效
                    if (this.soundReady) {
                        this.soundManager.play('explosion');
                    }
                }
            });
        });
    }

    createExplosion(x, y, color) {
        // 创建爆炸粒子效果
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    spawnPowerup() {
        const currentTime = Date.now();
        if (currentTime - this.lastPowerupTime >= this.powerupInterval) {
            const margin = 100;
            const x = margin + Math.random() * (this.canvas.width - margin * 2);
            const y = margin + Math.random() * (this.canvas.height - margin * 2);
            
            this.powerups.push(new Powerup(x, y));
            this.lastPowerupTime = currentTime;
        }
    }

    checkPowerupCollisions() {
        this.powerups = this.powerups.filter((powerup, index) => {
            const dx = this.player.x - powerup.x;
            const dy = this.player.y - powerup.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.size + powerup.size) {
                // 统计道具获取数量
                this.powerupStats[powerup.type]++;
                // 玩家碰到道具
                this.player.activatePowerup(powerup.type);
                this.addNotification(powerup.type);
                
                // 播放道具音效
                if (this.soundReady) {
                    this.soundManager.play('powerup');
                }
                return false;
            }
            return true;
        });
    }

    // 添加提示方法
    addNotification(type) {
        let message;
        let color;

        // 检查是否是受伤提示
        if (type === '受到伤害！') {
            message = type;
            color = '#ff0000';
        } else {
            // 道具提示
            const messages = {
                multishot: '获得多重射击！',
                bigshot: '获得大型子弹！',
                rapidfire: '获得快速射击！',
                piercing: '获得穿透子弹！',
                split: '获得分裂子弹！',
                spread: '获得散射！',
                shield: '获得护盾！'
            };
            message = messages[type];
            color = this.getPowerupColor(type);
        }

        this.notifications.push({
            message: message,
            color: color,
            time: Date.now()
        });
    }

    getPowerupColor(type) {
        const colors = {
            multishot: '#ff00ff',
            bigshot: '#00ffff',
            rapidfire: '#ffff00',
            piercing: '#ff8800',
            split: '#ff0088',
            spread: '#00ff88',
            shield: '#00ffaa'
        };
        return colors[type];
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.gameState === 'menu') {
            if (this.isClickButton(x, y, this.buttons.start)) {
                this.startGame();
            } else if (this.isClickButton(x, y, this.buttons.about)) {
                this.showAbout();
            }
        } else if (this.gameState === 'gameover') {
            if (this.isClickButton(x, y, this.buttons.restart)) {
                this.startGame();
            }
        }
    }

    isClickButton(x, y, button) {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }

    startGame() {
        this.gameState = 'playing';
        this.playerHealth = 200;
        this.score = 0;
        this.enemies = [];
        this.powerups = [];
        this.particles = [];
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.gameStartTime = Date.now();
        this.currentGameTime = 0;
        this.gameOverSoundPlayed = false; // 重置标记
        
        // 重置道具统计
        this.powerupStats = {
            multishot: 0,
            bigshot: 0,
            rapidfire: 0,
            piercing: 0,
            split: 0,
            spread: 0,
            shield: 0
        };
        
        // 开始播放背景音乐
        if (this.soundReady) {
            this.soundManager.startBGM();
        }
    }

    showAbout() {
        // 显示作者信息的弹窗
        alert(`作者：${this.author}\n版本：${this.version}`);
    }

    checkPlayerCollisions() {
        this.enemies.forEach((enemy, index) => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.size + enemy.size) {
                this.playerHealth -= enemy.damage;
                this.enemies.splice(index, 1);
                this.createExplosion(enemy.x, enemy.y, enemy.color);
                this.lastDamageTime = Date.now();
                
                // 播放受伤音效
                if (this.soundReady) {
                    this.soundManager.play('damage');
                }
            }
        });
    }

    drawDamageWarning() {
        const currentTime = Date.now();
        const timeSinceLastDamage = currentTime - this.lastDamageTime;
        
        if (timeSinceLastDamage < this.damageFlashDuration) {
            // 计算警告的透明度（随时间渐变）
            const alpha = 0.5 * (1 - timeSinceLastDamage / this.damageFlashDuration);
            
            // 设置渐变
            const borderWidth = 50; // 边框宽度
            
            // 创建四个边缘的渐变
            // 左边
            let gradient = this.ctx.createLinearGradient(0, 0, borderWidth, 0);
            this.createWarningGradient(gradient, alpha);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, borderWidth, this.canvas.height);
            
            // 右边
            gradient = this.ctx.createLinearGradient(this.canvas.width, 0, this.canvas.width - borderWidth, 0);
            this.createWarningGradient(gradient, alpha);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(this.canvas.width - borderWidth, 0, borderWidth, this.canvas.height);
            
            // 上边
            gradient = this.ctx.createLinearGradient(0, 0, 0, borderWidth);
            this.createWarningGradient(gradient, alpha);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, borderWidth);
            
            // 下边
            gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, this.canvas.height - borderWidth);
            this.createWarningGradient(gradient, alpha);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, this.canvas.height - borderWidth, this.canvas.width, borderWidth);
        }
    }

    createWarningGradient(gradient, alpha) {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    }
} 