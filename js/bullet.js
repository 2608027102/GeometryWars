class Bullet {
    constructor(x, y, directionX, directionY, speed = 5) {
        this.x = x;
        this.y = y;
        // 标准化方向向量
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        this.directionX = directionX / length;
        this.directionY = directionY / length;
        this.speed = speed;
        this.size = 3;
        this.color = '#fff';
        
        // 调整初始位置，使子弹从飞船前端发射
        const offset = 20; // 飞船大小
        this.x += this.directionX * offset;
        this.y += this.directionY * offset;
        this.piercing = 0;  // 穿透次数
        this.split = 0;     // 分裂等级
        this.isSplitBullet = false; // 是否是分裂后的子弹
    }

    update() {
        if (this.homing > 0) {
            // 寻找最近的敌人
            const enemies = window.game.enemies;
            if (enemies.length > 0) {
                let nearestEnemy = null;
                let nearestDist = Infinity;
                
                enemies.forEach(enemy => {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const dist = dx * dx + dy * dy;
                    if (dist < nearestDist && !this.targets.includes(enemy)) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                });

                if (nearestEnemy) {
                    // 计算追踪方向
                    const dx = nearestEnemy.x - this.x;
                    const dy = nearestEnemy.y - this.y;
                    const angle = Math.atan2(dy, dx);
                    
                    // 逐渐调整方向
                    const currentAngle = Math.atan2(this.directionY, this.directionX);
                    const newAngle = currentAngle + (angle - currentAngle) * this.homing;
                    
                    this.directionX = Math.cos(newAngle);
                    this.directionY = Math.sin(newAngle);
                }
            }
        }

        // 更新位置
        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加发光效果
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.size,
            this.x, this.y, this.size * 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }

    // 检查子弹是否超出画布
    isOutOfBounds(canvas) {
        return this.x < 0 || this.x > canvas.width || 
               this.y < 0 || this.y > canvas.height;
    }

    // 创建分裂子弹
    createSplitBullets() {
        if (this.isSplitBullet) return []; // 防止分裂子弹再次分裂
        
        const bullets = [];
        const splitCount = this.split * 2; // 每级产生2颗分裂子弹
        
        for (let i = 0; i < splitCount; i++) {
            const angle = (i * 2 * Math.PI / splitCount) + Math.random() * 0.5;
            const newDx = Math.cos(angle);
            const newDy = Math.sin(angle);
            
            const splitBullet = new Bullet(
                this.x,
                this.y,
                newDx,
                newDy,
                this.speed * 0.8 // 分裂子弹速度略慢
            );
            
            splitBullet.size = this.size * 0.7; // 分裂子弹尺寸略小
            splitBullet.isSplitBullet = true;
            splitBullet.piercing = this.piercing;
            
            bullets.push(splitBullet);
        }
        
        return bullets;
    }
} 