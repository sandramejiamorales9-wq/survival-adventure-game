// Sistema de jugador con física realista
class Player {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        
        // Dimensiones
        this.width = 30;
        this.height = 50;
        
        // Física
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpPower = 12;
        this.isJumping = false;
        this.isRunning = false;
        
        // Estado
        this.direction = 1; // 1 = derecha, -1 = izquierda
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
    }
    
    update(dt, keys) {
        // Entrada de teclado
        this.velocityX = 0;
        this.isRunning = false;
        
        if (keys['a'] || keys['arrowleft']) {
            this.velocityX = -this.speed;
            this.direction = -1;
            this.isRunning = true;
        }
        if (keys['d'] || keys['arrowright']) {
            this.velocityX = this.speed;
            this.direction = 1;
            this.isRunning = true;
        }
        
        // Aplicar gravedad
        this.velocityY += this.game.gravity;
        
        // Aplicar viento
        this.velocityX += this.game.wind * (Math.sin(this.game.stats.time) * 0.1);
        
        // Aplicar fricción
        this.velocityX *= this.game.friction;
        
        // Actualizar posición
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Colisión con el suelo
        const groundY = this.game.canvas.height - 20 - this.height;
        if (this.y >= groundY) {
            this.y = groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // Límites horizontales
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.canvas.width) {
            this.x = this.game.canvas.width - this.width;
        }
        
        // Actualizar animación
        this.animationFrame += this.animationSpeed;
    }
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = -this.jumpPower;
            this.isJumping = true;
        }
    }
    
    draw(ctx) {
        // Guardar contexto
        ctx.save();
        
        // Trasladar al centro para rotación
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Voltear si va hacia la izquierda
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }
        
        // Cuerpo (triángulo)
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2 + 5);
        ctx.lineTo(-this.width / 2 + 5, this.height / 2 - 10);
        ctx.lineTo(this.width / 2 - 5, this.height / 2 - 10);
        ctx.fill();
        
        // Cabeza (círculo)
        ctx.fillStyle = '#FFB366';
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Ojos
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -this.height / 2 + 8, 2, 0, Math.PI * 2);
        ctx.arc(4, -this.height / 2 + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Piernas con animación
        const legOffset = Math.sin(this.animationFrame * Math.PI * 2) * 3;
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Pierna izquierda
        ctx.beginPath();
        ctx.moveTo(-5, this.height / 2 - 10);
        ctx.lineTo(-5, this.height / 2 - 10 + 8 + legOffset);
        ctx.stroke();
        
        // Pierna derecha
        ctx.beginPath();
        ctx.moveTo(5, this.height / 2 - 10);
        ctx.lineTo(5, this.height / 2 - 10 + 8 - legOffset);
        ctx.stroke();
        
        // Brazos con animación
        const armOffset = Math.sin(this.animationFrame * Math.PI * 2 + Math.PI) * 5;
        
        // Brazo izquierdo
        ctx.strokeStyle = '#FFB366';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 5, -5);
        ctx.lineTo(-this.width / 2 - 5, -5 + armOffset);
        ctx.stroke();
        
        // Brazo derecho
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 5, -5);
        ctx.lineTo(this.width / 2 + 5, -5 - armOffset);
        ctx.stroke();
        
        // Indicador de dirección
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        
        // Sombra bajo el jugador
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.ellipse(this.x + this.width / 2, this.game.canvas.height - 20, this.width / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    handleCollision(obj) {
        // Empujar el jugador hacia atrás
        if (this.velocityX > 0) {
            this.x = obj.x - this.width;
        } else if (this.velocityX < 0) {
            this.x = obj.x + obj.width;
        }
        
        if (this.velocityY > 0) {
            this.y = obj.y - this.height;
            this.velocityY = 0;
        }
    }
}
