// Sistema de ambiente interactivo
class Environment {
    constructor(game) {
        this.game = game;
        this.objects = [];
        this.particles = [];
        
        this.generateEnvironment();
    }
    
    generateEnvironment() {
        // Árboles
        for (let i = 0; i < 5; i++) {
            this.objects.push(new Tree(100 + i * 140, this.game.canvas.height - 120));
        }
        
        // Rocas
        for (let i = 0; i < 4; i++) {
            this.objects.push(new Rock(150 + i * 160, this.game.canvas.height - 50));
        }
        
        // Agua (río)
        this.objects.push(new Water(this.game.canvas.width - 100, this.game.canvas.height - 40));
        
        // Animales (enemigos)
        this.objects.push(new Animal('wolf', 200, this.game.canvas.height - 100));
        this.objects.push(new Animal('deer', 400, this.game.canvas.height - 100));
    }
    
    update(dt) {
        // Actualizar objetos
        this.objects.forEach(obj => {
            if (obj.update) {
                obj.update(dt, this.game);
            }
        });
        
        // Actualizar partículas
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return p.life > 0;
        });
    }
    
    draw(ctx) {
        // Ordenar objetos por posición Y (dibuja de atrás a adelante)
        this.objects.sort((a, b) => a.y - b.y);
        
        this.objects.forEach(obj => obj.draw(ctx));
        
        this.particles.forEach(p => p.draw(ctx));
    }
    
    addParticles(x, y, type, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }
}

// Clase base para objetos interactivos
class InteractiveObject {
    constructor(x, y, width, height, name, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.type = type;
        this.canInteract = true;
        this.description = '';
    }
    
    draw(ctx) {
        // Método que las subclases deben implementar
    }
}

// Árboles - se pueden recolectar
class Tree extends InteractiveObject {
    constructor(x, y) {
        super(x, y, 40, 80, '🌲 Árbol', 'tree');
        this.health = 100;
        this.resources = 5;
        this.description = 'Un árbol frondoso. Puedes recolectar madera.';
        this.particleEmit = 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Tronco
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - 8, this.y, 16, 60);
        
        // Anillos del tronco
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y + i * 10);
            ctx.lineTo(this.x + 8, this.y + i * 10);
            ctx.stroke();
        }
        
        // Copa (triángulo)
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 30);
        ctx.lineTo(this.x - 25, this.y + 20);
        ctx.lineTo(this.x + 25, this.y + 20);
        ctx.fill();
        
        // Detalle de copa
        ctx.fillStyle = '#1a6b1a';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20);
        ctx.lineTo(this.x - 20, this.y + 10);
        ctx.lineTo(this.x + 20, this.y + 10);
        ctx.fill();
        
        // Barra de salud si está dañado
        if (this.health < 100) {
            ctx.fillStyle = '#f44336';
            ctx.fillRect(this.x - 15, this.y - 35, 30 * (this.health / 100), 3);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x - 15, this.y - 35, 30, 3);
        }
        
        ctx.restore();
    }
    
    update(dt, game) {
        this.particleEmit += dt;
    }
}

// Rocas - se pueden romper
class Rock extends InteractiveObject {
    constructor(x, y) {
        super(x, y, 35, 35, '🪨 Roca', 'rock');
        this.health = 150;
        this.resources = 3;
        this.description = 'Una roca grande. Contiene piedra y posibles minerales.';
    }
    
    draw(ctx) {
        ctx.save();
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 2, this.width / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Roca principal (polígono irregular)
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y);
        ctx.lineTo(this.x + this.width - 5, this.y + 5);
        ctx.lineTo(this.x + this.width - 2, this.y + this.height - 5);
        ctx.lineTo(this.x + 5, this.y + this.height - 2);
        ctx.fill();
        
        // Detalles de textura
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
        ctx.fillRect(this.x + 18, this.y + 12, 7, 7);
        ctx.fillRect(this.x + 10, this.y + 20, 5, 5);
        
        // Brillo
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Barra de salud
        if (this.health < 150) {
            ctx.fillStyle = '#f44336';
            ctx.fillRect(this.x - 2, this.y - 5, 35 * (this.health / 150), 3);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x - 2, this.y - 5, 35, 3);
        }
        
        ctx.restore();
    }
}

// Agua - para pescar
class Water extends InteractiveObject {
    constructor(x, y) {
        super(x, y, 80, 30, '💧 Río', 'water');
        this.description = 'Agua fresca. Puedes pescar aquí.';
        this.fishCount = 10;
        this.waveOffset = 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Ondas del agua
        ctx.strokeStyle = '#1E90FF';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            for (let j = 0; j < this.width; j += 5) {
                const waveY = this.y + 8 + Math.sin(j * 0.1 + this.waveOffset) * 3;
                if (j === 0) {
                    ctx.moveTo(this.x + j, waveY);
                } else {
                    ctx.lineTo(this.x + j, waveY);
                }
            }
            ctx.stroke();
            this.waveOffset += 0.05;
        }
        
        // Relleno de agua
        ctx.fillStyle = 'rgba(30, 144, 255, 0.3)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Pececillos
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            const fishX = this.x + 15 + i * 25;
            const fishY = this.y + 15 + Math.sin(this.waveOffset * 2 + i) * 5;
            
            ctx.beginPath();
            ctx.ellipse(fishX, fishY, 6, 3, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    update(dt, game) {
        this.waveOffset += dt;
    }
}

// Animales - se pueden cazar
class Animal extends InteractiveObject {
    constructor(type, x, y) {
        super(x, y, 30, 25, type === 'wolf' ? '🐺 Lobo' : '🦌 Ciervo', 'enemy');
        this.animalType = type;
        this.velocityX = type === 'wolf' ? 2 : -2;
        this.direction = this.velocityX > 0 ? 1 : -1;
        this.description = type === 'wolf' ? 
            'Un lobo peligroso. ¡Cuidado!' : 
            'Un ciervo. Puedes cazarlo para obtener carne.';
        this.health = type === 'wolf' ? 50 : 30;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }
        
        if (this.animalType === 'wolf') {
            // Cuerpo
            ctx.fillStyle = '#505050';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Cabeza
            ctx.fillStyle = '#505050';
            ctx.beginPath();
            ctx.arc(12, -2, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Orejas
            ctx.fillStyle = '#505050';
            ctx.beginPath();
            ctx.moveTo(16, -7);
            ctx.lineTo(18, -12);
            ctx.lineTo(14, -9);
            ctx.fill();
            
            // Ojos
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(15, -4, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Ciervo
            // Cuerpo
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(0, 2, 12, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Cabeza
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.arc(12, -3, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Cuernos
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(14, -8);
            ctx.lineTo(16, -14);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(10, -8);
            ctx.lineTo(8, -14);
            ctx.stroke();
            
            // Ojos
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(14, -4, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Patas
        ctx.strokeStyle = this.animalType === 'wolf' ? '#505050' : '#8B4513';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-8 + i * 6, 8);
            ctx.lineTo(-8 + i * 6, 12);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    update(dt, game) {
        // Movimiento
        this.x += this.velocityX;
        
        // Rebotar en los bordes
        if (this.x < 0 || this.x + this.width > game.canvas.width) {
            this.velocityX *= -1;
            this.direction *= -1;
        }
    }
}

// Partículas para efectos visuales
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = (Math.random() - 0.5) * 4 - 2;
        this.size = Math.random() * 4 + 2;
        this.gravity = 0.2;
    }
    
    update(dt) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
        this.life -= dt * 0.5;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.getColor();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    getColor() {
        switch(this.type) {
            case 'wood': return '#8B4513';
            case 'stone': return '#808080';
            case 'blood': return '#FF0000';
            case 'water': return '#1E90FF';
            default: return '#FFD700';
        }
    }
}
