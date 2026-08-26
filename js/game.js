// Configuración principal del juego con física realista
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Ajustar canvas al tamaño de la ventana
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Física
        this.gravity = 0.6;
        this.friction = 0.85;
        this.wind = 0.2;
        
        // Jugador
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100, this);
        
        // Ambiente
        this.environment = new Environment(this);
        
        // Sistema de interacción
        this.interactions = new Interactions(this);
        
        // Estadísticas
        this.stats = {
            health: 100,
            hunger: 100,
            energy: 100,
            time: 0,
            dayNight: 0 // 0 = día, 1 = noche
        };
        
        // Control de entrada
        this.keys = {};
        this.setupControls();
        
        // Loop del juego
        this.lastTime = Date.now();
        this.gameLoop();
    }
    
    resizeCanvas() {
        this.canvas.width = Math.min(window.innerWidth, 800);
        this.canvas.height = 600;
    }
    
    setupControls() {
        // Teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Teclas de acción
            if (e.key === ' ') this.player.jump();
            if (e.key === 'e' || e.key === 'E') this.interactions.findNearbyObject();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Botones de interfaz
        document.getElementById('collect-btn').addEventListener('click', () => this.interactions.collect());
        document.getElementById('fish-btn').addEventListener('click', () => this.interactions.fish());
        document.getElementById('craft-btn').addEventListener('click', () => this.interactions.craft());
        document.getElementById('rest-btn').addEventListener('click', () => this.interactions.rest());
        document.getElementById('hunt-btn').addEventListener('click', () => this.interactions.hunt());
        
        // Toques para móvil
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
    }
    
    handleTouch(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Movimiento: izquierda si toca menos de 1/3, derecha si toca más de 2/3
        if (x < this.canvas.width / 3) {
            this.player.velocityX = -this.player.speed;
        } else if (x > (this.canvas.width * 2) / 3) {
            this.player.velocityX = this.player.speed;
        }
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convertir a segundos
        
        // Actualizar jugador
        this.player.update(dt, this.keys);
        
        // Actualizar ambiente
        this.environment.update(dt);
        
        // Actualizar estadísticas
        this.updateStats(dt);
        
        // Colisiones
        this.checkCollisions();
        
        // Actualizar UI
        this.updateUI();
    }
    
    updateStats(dt) {
        this.stats.time += dt;
        
        // Ciclo día-noche (120 segundos = 1 día completo)
        this.stats.dayNight = (this.stats.time % 120) / 120;
        
        // Hambre aumenta con el tiempo
        if (this.player.isRunning) {
            this.stats.hunger = Math.max(0, this.stats.hunger - dt * 15);
            this.stats.energy = Math.max(0, this.stats.energy - dt * 20);
        } else {
            this.stats.hunger = Math.max(0, this.stats.hunger - dt * 5);
            this.stats.energy = Math.min(100, this.stats.energy + dt * 10);
        }
        
        // Si tienes hambre, pierdes salud
        if (this.stats.hunger < 20) {
            this.stats.health = Math.max(0, this.stats.health - dt * 10);
        }
        
        // Si no tienes energía, pierdes salud
        if (this.stats.energy < 20) {
            this.stats.health = Math.max(0, this.stats.health - dt * 5);
        }
    }
    
    checkCollisions() {
        // Colisión con objetos del ambiente
        this.environment.objects.forEach(obj => {
            if (this.player.collidesWith(obj)) {
                this.player.handleCollision(obj);
                if (obj.type === 'enemy') {
                    this.stats.health = Math.max(0, this.stats.health - 1);
                }
            }
        });
    }
    
    updateUI() {
        // Actualizar barras de estadísticas
        document.getElementById('health-bar').style.width = Math.max(0, this.stats.health) + '%';
        document.getElementById('hunger-bar').style.width = Math.max(0, this.stats.hunger) + '%';
        document.getElementById('energy-bar').style.width = Math.max(0, this.stats.energy) + '%';
    }
    
    draw() {
        // Limpiar canvas
        this.ctx.fillStyle = this.getBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar suelo
        this.drawGround();
        
        // Dibujar ambiente
        this.environment.draw(this.ctx);
        
        // Dibujar jugador
        this.player.draw(this.ctx);
        
        // Dibujar información de objetos cercanos
        this.drawNearbyInfo();
    }
    
    getBackgroundColor() {
        // Ciclo de luz día-noche
        const time = this.stats.dayNight;
        
        if (time < 0.25) {
            // Amaneciendo
            const t = time / 0.25;
            return this.lerpColor('#1a1a2e', '#87CEEB', t);
        } else if (time < 0.75) {
            // Día
            return '#87CEEB';
        } else {
            // Oscureciendo
            const t = (time - 0.75) / 0.25;
            return this.lerpColor('#87CEEB', '#1a1a2e', t);
        }
    }
    
    lerpColor(color1, color2, t) {
        const c1 = parseInt(color1.slice(1), 16);
        const c2 = parseInt(color2.slice(1), 16);
        
        const r1 = (c1 >> 16) & 255;
        const g1 = (c1 >> 8) & 255;
        const b1 = c1 & 255;
        
        const r2 = (c2 >> 16) & 255;
        const g2 = (c2 >> 8) & 255;
        const b2 = c2 & 255;
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return `rgb(${r},${g},${b})`;
    }
    
    drawGround() {
        const groundY = this.canvas.height - 20;
        
        // Tierra
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, groundY, this.canvas.width, 20);
        
        // Hierba
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, groundY - 5, this.canvas.width, 5);
        
        // Sombra
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(0, groundY, this.canvas.width, 3);
    }
    
    drawNearbyInfo() {
        const nearbyObject = this.interactions.getNearbyObject();
        if (nearbyObject) {
            const infoPanel = document.getElementById('info-panel');
            infoPanel.style.display = 'block';
            
            let info = `📍 ${nearbyObject.name}\n`;
            info += nearbyObject.description || '';
            
            if (nearbyObject.canInteract) {
                info += '\n\n[Presiona E o usa botón]';
            }
            
            document.getElementById('info-text').textContent = info;
        } else {
            document.getElementById('info-panel').style.display = 'none';
        }
    }
    
    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Iniciar juego cuando cargue la página
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
