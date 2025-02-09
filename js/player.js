class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 4;
        this.color = '#00ff00';
        
        // 移动控制
        this.moveX = 0;
        this.moveY = 0;
        
        // 射击方向
        this.shootX = 0;
        this.shootY = 0;
        
        // 射击相关属性
        this.bullets = [];
        this.lastShootTime = 0;
        this.baseShootInterval = 1000; // 基础射击间隔为1秒
        this.minShootInterval = 20;    // 最小射击间隔为0.02秒
        this.shootInterval = this.baseShootInterval; // 当前射击间隔
        this.autoShoot = false;
        
        // 鼠标位置
        this.mouseX = 0;
        this.mouseY = 0;
        
        // 修改道具状态，护盾默认为1
        this.powerups = {
            multishot: 0,    // 多重射击次数
            bigshot: 0,      // 大型子弹等级
            rapidfire: 0,    // 射速提升等级
            piercing: 0,     // 穿透等级
            split: 0,        // 分裂等级
            spread: 0,       // 散射等级
            shield: 1        // 护盾数量，默认1个
        };
        
        // 修改子弹基础属性
        this.bulletSpeed = 5; // 降低子弹基础速度
        this.bulletSize = 3;
        
        // 护盾系统
        this.shieldRadius = 100;
        this.shieldRotation = 0;
        this.shieldRotationSpeed = -0.03;
        
        // 存储护盾的相对位置（相对于玩家）
        this.shieldPositions = [];
        
        // 添加按键状态追踪
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // 添加旋转相关属性
        this.rotation = 0;
        
        this.bindControls();
        this.bindMouseControls();
    }

    bindControls() {
        // 修改移动控制（WASD或方向键）
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'w':
                case 'ArrowUp':
                    this.keys.up = true;
                    break;
                case 's':
                case 'ArrowDown':
                    this.keys.down = true;
                    break;
                case 'a':
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
            }
            this.updateMovement();
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'w':
                case 'ArrowUp':
                    this.keys.up = false;
                    break;
                case 's':
                case 'ArrowDown':
                    this.keys.down = false;
                    break;
                case 'a':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
            }
            this.updateMovement();
        });
    }

    bindMouseControls() {
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('mousedown', () => {
            this.autoShoot = true;
        });

        window.addEventListener('mouseup', () => {
            this.autoShoot = false;
        });
    }

    updateMovement() {
        // 根据按键状态更新移动方向
        this.moveX = 0;
        this.moveY = 0;
        
        if (this.keys.up) this.moveY -= 1;
        if (this.keys.down) this.moveY += 1;
        if (this.keys.left) this.moveX -= 1;
        if (this.keys.right) this.moveX += 1;
        
        // 对角线移动时进行标准化
        if (this.moveX !== 0 && this.moveY !== 0) {
            const length = Math.sqrt(this.moveX * this.moveX + this.moveY * this.moveY);
            this.moveX /= length;
            this.moveY /= length;
        }
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime >= this.shootInterval) {
            // 计算射击方向（使用已经计算好的旋转角度）
            const dx = Math.cos(this.rotation);
            const dy = Math.sin(this.rotation);
            
            this.createBullet(dx, dy);
            
            // 更新最后射击时间
            this.lastShootTime = currentTime;
            
            // 添加后坐力效果
            this.addRecoil(dx, dy);
            
            // 播放射击音效
            if (window.game.soundReady) {
                window.game.soundManager.play('shoot');
            }
        }
    }

    createBullet(dx, dy) {
        const bulletConfig = this.getBulletConfig();
        const bullets = [];

        // 基础子弹
        const baseBullet = new Bullet(this.x, this.y, dx, dy, bulletConfig.speed);
        baseBullet.size = bulletConfig.size;
        baseBullet.piercing = bulletConfig.piercing;
        baseBullet.split = bulletConfig.split;
        bullets.push(baseBullet);

        // 多重射击
        if (this.powerups.multishot > 0) {
            const angles = [];
            for (let i = 1; i <= this.powerups.multishot; i++) {
                angles.push(i * Math.PI / 12, -i * Math.PI / 12);
            }
            angles.forEach(angle => {
                const rotatedDx = dx * Math.cos(angle) - dy * Math.sin(angle);
                const rotatedDy = dx * Math.sin(angle) + dy * Math.cos(angle);
                const bullet = new Bullet(this.x, this.y, rotatedDx, rotatedDy, bulletConfig.speed);
                bullet.size = bulletConfig.size;
                bullet.piercing = bulletConfig.piercing;
                bullet.split = bulletConfig.split;
                bullets.push(bullet);
            });
        }

        // 散射
        if (this.powerups.spread > 0) {
            const spreadCount = this.powerups.spread * 2 + 1;
            const spreadAngle = Math.PI / 6;
            for (let i = 0; i < spreadCount; i++) {
                const angle = (i - (spreadCount-1)/2) * (spreadAngle/spreadCount);
                const rotatedDx = dx * Math.cos(angle) - dy * Math.sin(angle);
                const rotatedDy = dx * Math.sin(angle) + dy * Math.cos(angle);
                const bullet = new Bullet(this.x, this.y, rotatedDx, rotatedDy, bulletConfig.speed);
                bullet.size = bulletConfig.size;
                bullet.piercing = bulletConfig.piercing;
                bullet.split = bulletConfig.split;
                bullets.push(bullet);
            }
        }

        this.bullets.push(...bullets);
    }

    getBulletConfig() {
        return {
            size: this.bulletSize + (this.powerups.bigshot * 1.5),
            speed: this.bulletSpeed + (this.powerups.rapidfire * 0.5),
            piercing: this.powerups.piercing,
            split: this.powerups.split
        };
    }

    addRecoil(dx, dy) {
        const recoilStrength = 0.5;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            this.x -= (dx / length) * recoilStrength;
            this.y -= (dy / length) * recoilStrength;
        }
    }

    update() {
        // 更新玩家朝向（始终对准鼠标）
        const dx = this.mouseX - this.x;
        const dy = this.mouseY - this.y;
        this.rotation = Math.atan2(dy, dx);
        
        // 直接更新位置
        this.x += this.moveX * this.speed;
        this.y += this.moveY * this.speed;
        
        // 确保玩家不会移出画布
        this.x = Math.max(this.size, Math.min(this.x, window.innerWidth - this.size));
        this.y = Math.max(this.size, Math.min(this.y, window.innerHeight - this.size));
        
        // 处理射击
        if (this.autoShoot) {
            this.shoot();
        }
        
        // 更新子弹
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return !bullet.isOutOfBounds(window.game.canvas);
        });
        
        // 更新护盾
        this.updateShields();
    }

    updateShields() {
        // 只更新旋转角度
        this.shieldRotation += this.shieldRotationSpeed;
        
        // 检查护盾与敌人的碰撞
        window.game.enemies.forEach((enemy, enemyIndex) => {
            // 将敌人坐标转换到玩家局部坐标系
            const relativeEnemyX = enemy.x - this.x;
            const relativeEnemyY = enemy.y - this.y;
            
            // 检查每个护盾
            for (let i = 0; i < this.powerups.shield; i++) {
                const angle = this.shieldRotation + (i * (2 * Math.PI / this.powerups.shield));
                const shieldX = Math.cos(angle) * this.shieldRadius;
                const shieldY = Math.sin(angle) * this.shieldRadius;
                
                const dx = shieldX - relativeEnemyX;
                const dy = shieldY - relativeEnemyY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 6 + enemy.size) {
                    window.game.enemies.splice(enemyIndex, 1);
                    window.game.score += 50;
                    window.game.createExplosion(enemy.x, enemy.y, enemy.color);
                    break;
                }
            }
        });
    }

    draw(ctx) {
        ctx.save();
        
        // 绘制瞄准线
        this.drawAimLine(ctx);
        
        // 绘制子弹
        this.bullets.forEach(bullet => bullet.draw(ctx));
        
        // 移动到玩家位置
        ctx.translate(this.x, this.y);
        
        // 先绘制护盾（不受玩家旋转影响）
        this.drawShields(ctx);
        
        // 旋转玩家
        ctx.rotate(this.rotation + Math.PI / 2);
        
        // 绘制战机主体
        ctx.beginPath();
        ctx.fillStyle = this.color;
        
        // 主体
        ctx.moveTo(0, -this.size);  // 机头
        ctx.lineTo(-this.size * 0.4, -this.size * 0.2);  // 左前机身
        ctx.lineTo(-this.size * 0.8, this.size * 0.2);   // 左机翼
        ctx.lineTo(-this.size * 0.3, this.size * 0.2);   // 左机身收缩
        ctx.lineTo(-this.size * 0.5, this.size);         // 左尾翼
        ctx.lineTo(0, this.size * 0.7);                  // 尾部中心
        ctx.lineTo(this.size * 0.5, this.size);          // 右尾翼
        ctx.lineTo(this.size * 0.3, this.size * 0.2);    // 右机身收缩
        ctx.lineTo(this.size * 0.8, this.size * 0.2);    // 右机翼
        ctx.lineTo(this.size * 0.4, -this.size * 0.2);   // 右前机身
        ctx.closePath();
        ctx.fill();
        
        // 驾驶舱
        ctx.beginPath();
        ctx.fillStyle = '#00ffff';  // 蓝色驾驶舱
        ctx.moveTo(0, -this.size * 0.5);
        ctx.lineTo(-this.size * 0.2, -this.size * 0.1);
        ctx.lineTo(this.size * 0.2, -this.size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // 引擎喷射效果
        ctx.beginPath();
        const engineGlow = ctx.createRadialGradient(
            0, this.size * 0.7, 0,
            0, this.size * 0.7, this.size * 0.5
        );
        engineGlow.addColorStop(0, 'rgba(255, 100, 0, 0.8)');  // 橙色核心
        engineGlow.addColorStop(0.5, 'rgba(255, 50, 0, 0.4)'); // 红色过渡
        engineGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');      // 透明边缘
        ctx.fillStyle = engineGlow;
        ctx.arc(0, this.size * 0.7, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 飞船整体发光效果
        ctx.beginPath();
        const shipGlow = ctx.createRadialGradient(
            0, 0, this.size * 0.5,
            0, 0, this.size * 2
        );
        shipGlow.addColorStop(0, 'rgba(0, 255, 0, 0.2)');
        shipGlow.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = shipGlow;
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawAimLine(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.setLineDash([5, 5]); // 虚线效果
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.mouseX, this.mouseY);
        ctx.stroke();
        ctx.setLineDash([]); // 重置虚线设置
    }

    drawShields(ctx) {
        const shieldCount = this.powerups.shield;
        
        for (let i = 0; i < shieldCount; i++) {
            const angle = this.shieldRotation + (i * (2 * Math.PI / shieldCount));
            
            // 计算护盾在玩家局部坐标系中的位置
            const shieldX = Math.cos(angle) * this.shieldRadius;
            const shieldY = Math.sin(angle) * this.shieldRadius;
            
            ctx.save();
            
            // 移动到护盾位置并旋转
            ctx.translate(shieldX, shieldY);
            ctx.rotate(angle + Math.PI / 2);
            
            // 绘制子弹形状的护盾
            ctx.beginPath();
            ctx.fillStyle = '#00ffff';
            
            // 绘制子弹头（圆形）
            ctx.arc(0, -4, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制子弹尾部（矩形）
            ctx.fillRect(-2, -1, 4, 8);
            
            // 添加发光效果
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    activatePowerup(type) {
        this.powerups[type]++;
        
        // 更新射击间隔
        if (type === 'rapidfire') {
            // 每级rapidfire减少20%的射击间隔，但不低于最小间隔
            const reduction = 1 / (1 + this.powerups.rapidfire * 0.2);
            this.shootInterval = Math.max(
                this.minShootInterval,
                this.baseShootInterval * reduction
            );
        }
        
        // 创建获取道具的视觉效果
        for (let i = 0; i < 20; i++) {
            window.game.particles.push(
                new Particle(this.x, this.y, this.color)
            );
        }
    }
} 