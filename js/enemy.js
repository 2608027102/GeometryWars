class Enemy {
    constructor(x, y, type, player) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.player = player; // 引用玩家对象以实现追踪
        this.size = 15;
        this.speed = 1; // 降低基础速度
        this.color = '#ff0000';
        
        // 根据类型设置特性
        this.setupType();
        
        // 根据类型设置伤害值
        switch(type) {
            case 'seeker':
                this.damage = 50; // 追踪者伤害高
                break;
            case 'wanderer':
                this.damage = 30; // 漫游者伤害中等
                break;
            case 'spinner':
                this.damage = 40; // 旋转者伤害适中
                break;
            default:
                this.damage = 30;
        }
    }

    setupType() {
        switch(this.type) {
            case 'seeker': // 追踪者
                this.color = '#ff0000';
                this.speed = 1.5; // 从3降到1.5
                this.size = 12;
                break;
            case 'wanderer': // 漫游者
                this.color = '#ffff00';
                this.speed = 1; // 从2降到1
                this.size = 15;
                this.angle = Math.random() * Math.PI * 2;
                break;
            case 'spinner': // 旋转者
                this.color = '#00ffff';
                this.speed = 0.5; // 从1降到0.5
                this.size = 20;
                this.rotationRadius = 50;
                this.rotationSpeed = 0.01; // 降低旋转速度，从0.02降到0.01
                this.rotationAngle = Math.random() * Math.PI * 2;
                this.centerX = this.x;
                this.centerY = this.y;
                break;
        }
    }

    update() {
        switch(this.type) {
            case 'seeker':
                this.updateSeeker();
                break;
            case 'wanderer':
                this.updateWanderer();
                break;
            case 'spinner':
                this.updateSpinner();
                break;
        }
    }

    updateSeeker() {
        // 计算到玩家的方向
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    updateWanderer() {
        // 随机改变方向
        if (Math.random() < 0.02) {
            this.angle += (Math.random() - 0.5) * Math.PI / 2;
        }
        
        // 移动
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // 边界检查
        this.handleBoundaryCollision();
    }

    updateSpinner() {
        // 更新旋转角度
        this.rotationAngle += this.rotationSpeed;
        
        // 计算新位置
        this.x = this.centerX + Math.cos(this.rotationAngle) * this.rotationRadius;
        this.y = this.centerY + Math.sin(this.rotationAngle) * this.rotationRadius;
        
        // 缓慢移动中心点朝向玩家
        const dx = this.player.x - this.centerX;
        const dy = this.player.y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.centerX += (dx / distance) * (this.speed * 0.3); // 降低追踪速度
            this.centerY += (dy / distance) * (this.speed * 0.3);
        }
    }

    handleBoundaryCollision() {
        const margin = 50;
        if (this.x < margin || this.x > window.innerWidth - margin ||
            this.y < margin || this.y > window.innerHeight - margin) {
            // 转向场地中心
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            this.angle = Math.atan2(centerY - this.y, centerX - this.x);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        switch(this.type) {
            case 'seeker':
                this.drawSeeker(ctx);
                break;
            case 'wanderer':
                this.drawWanderer(ctx);
                break;
            case 'spinner':
                this.drawSpinner(ctx);
                break;
        }
        
        ctx.restore();
    }

    drawSeeker(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWanderer(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        for(let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) + this.angle;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawSpinner(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.rect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.fill();
    }
} 