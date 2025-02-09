class Powerup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.type = this.getRandomType();
        this.color = this.getColorByType();
        this.rotation = 0;
        this.rotationSpeed = 0.02;
        this.pulseScale = 1;
        this.pulseSpeed = 0.05;
        this.pulseDirection = 1;
    }

    getRandomType() {
        const types = [
            'multishot',    // 多重射击
            'bigshot',      // 大型子弹
            'rapidfire',    // 快速射击
            'piercing',     // 穿透子弹
            'split',        // 分裂子弹
            'spread',       // 散射
            'shield'        // 护盾
        ];
        return types[Math.floor(Math.random() * types.length)];
    }

    getColorByType() {
        switch(this.type) {
            case 'multishot':
                return '#ff00ff'; // 紫色
            case 'bigshot':
                return '#00ffff'; // 青色
            case 'rapidfire':
                return '#ffff00'; // 黄色
            case 'piercing':
                return '#ff8800'; // 橙色
            case 'split':
                return '#ff0088'; // 粉色
            case 'spread':
                return '#00ff88'; // 青绿色
            case 'shield':
                return '#00ffaa'; // 青绿色
            default:
                return '#ffffff';
        }
    }

    update() {
        // 旋转效果
        this.rotation += this.rotationSpeed;
        
        // 脉冲效果
        this.pulseScale += this.pulseSpeed * this.pulseDirection;
        if (this.pulseScale > 1.2) {
            this.pulseDirection = -1;
        } else if (this.pulseScale < 0.8) {
            this.pulseDirection = 1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.pulseScale, this.pulseScale);

        // 绘制基础形状
        ctx.beginPath();
        ctx.fillStyle = this.color;
        
        switch(this.type) {
            case 'multishot':
                this.drawStar(ctx, 5); // 五角星
                break;
            case 'bigshot':
                this.drawPolygon(ctx, 6); // 六边形
                break;
            case 'rapidfire':
                this.drawLightning(ctx); // 闪电形状
                break;
            case 'piercing':
                this.drawArrow(ctx); // 箭头形状
                break;
            case 'split':
                this.drawSplitIcon(ctx); // 分裂图标
                break;
            case 'spread':
                this.drawBurst(ctx); // 爆发形状
                break;
            case 'shield':
                this.drawShieldIcon(ctx);
                break;
        }

        // 添加发光效果
        this.drawGlow(ctx);
        ctx.restore();
    }

    // 辅助绘制方法
    drawStar(ctx, points) {
        for(let i = 0; i < points; i++) {
            const angle = (i * 2 * Math.PI / points) - Math.PI / 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawPolygon(ctx, sides) {
        for(let i = 0; i < sides; i++) {
            const angle = i * Math.PI * 2 / sides;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawLightning(ctx) {
        const points = [
            {x: 0, y: -this.size},
            {x: this.size/2, y: -this.size/3},
            {x: -this.size/2, y: this.size/3},
            {x: 0, y: this.size}
        ];
        ctx.moveTo(points[0].x, points[0].y);
        for(let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.fill();
    }

    drawArrow(ctx) {
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();
    }

    drawSplitIcon(ctx) {
        // 绘制一个圆形，中间有分裂线
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制分裂线
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();
    }

    drawBurst(ctx) {
        for(let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * this.size,
                Math.sin(angle) * this.size
            );
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGlow(ctx) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(0, 0, this.size * 0.5, 0, 0, this.size * 2);
        gradient.addColorStop(0, this.color + '80');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawShieldIcon(ctx) {
        // 绘制外圈
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制内部旋转的小圆
        for (let i = 0; i < 3; i++) {
            const angle = this.rotation + (i * (Math.PI * 2 / 3));
            const x = Math.cos(angle) * (this.size * 0.5);
            const y = Math.sin(angle) * (this.size * 0.5);
            
            ctx.beginPath();
            ctx.arc(x, y, this.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
} 