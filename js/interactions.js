// Sistema de interacciones con el ambiente
class Interactions {
    constructor(game) {
        this.game = game;
        this.interactionRange = 80;
        this.inventory = {
            wood: 0,
            stone: 0,
            food: 0,
            materials: 0
        };
    }
    
    findNearbyObject() {
        const nearbyObject = this.getNearbyObject();
        if (nearbyObject && nearbyObject.canInteract) {
            this.interact(nearbyObject);
        }
    }
    
    getNearbyObject() {
        for (let obj of this.game.environment.objects) {
            const dx = (obj.x + obj.width / 2) - (this.game.player.x + this.game.player.width / 2);
            const dy = (obj.y + obj.height / 2) - (this.game.player.y + this.game.player.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.interactionRange) {
                return obj;
            }
        }
        return null;
    }
    
    interact(obj) {
        switch(obj.type) {
            case 'tree':
                this.collectWood(obj);
                break;
            case 'rock':
                this.breakRock(obj);
                break;
            case 'water':
                // Manejado por el botón de pescar
                break;
            case 'enemy':
                this.hunt(obj);
                break;
        }
    }
    
    // Recolectar madera de árboles
    collectWood() {
        const tree = this.findObjectOfType('tree');
        if (tree && tree.canInteract) {
            tree.health -= 25;
            this.inventory.wood += Math.floor(Math.random() * 2) + 1;
            this.game.environment.addParticles(tree.x, tree.y, 'wood', 8);
            
            if (tree.health <= 0) {
                tree.canInteract = false;
                tree.fillStyle = '#4a2c1a';
            }
            
            this.game.stats.hunger += 5;
            this.game.stats.energy -= 10;
            this.showNotification(`Madera recolectada! (+${this.inventory.wood - (this.inventory.wood - 1)})`);
        }
    }
    
    // Romper rocas
    breakRock() {
        const rock = this.findObjectOfType('rock');
        if (rock && rock.canInteract) {
            rock.health -= 30;
            this.inventory.stone += Math.floor(Math.random() * 2) + 1;
            this.game.environment.addParticles(rock.x, rock.y, 'stone', 10);
            
            if (rock.health <= 0) {
                rock.canInteract = false;
            }
            
            this.game.stats.energy -= 15;
            this.showNotification(`Piedra minada! (+${this.inventory.stone - (this.inventory.stone - 1)})`);
        }
    }
    
    // Pescar
    fish() {
        const water = this.findObjectOfType('water');
        if (water && water.canInteract) {
            const success = Math.random() > 0.4; // 60% de éxito
            
            if (success && water.fishCount > 0) {
                water.fishCount--;
                this.inventory.food += 1;
                this.game.stats.hunger += 30;
                this.game.environment.addParticles(water.x + 40, water.y, 'water', 15);
                this.showNotification('¡Pez capturado!');
            } else {
                this.showNotification('No hay suerte esta vez...');
            }
            
            this.game.stats.energy -= 20;
        }
    }
    
    // Cazar
    hunt(animal = null) {
        const targetAnimal = animal || this.findObjectOfType('enemy');
        
        if (targetAnimal && targetAnimal.canInteract) {
            const difficulty = targetAnimal.animalType === 'wolf' ? 0.7 : 0.6;
            const success = Math.random() > difficulty;
            
            if (success) {
                const foodReward = targetAnimal.animalType === 'wolf' ? 5 : 3;
                this.inventory.food += foodReward;
                this.game.stats.hunger += foodReward * 10;
                this.game.environment.addParticles(targetAnimal.x, targetAnimal.y, 'blood', 12);
                
                // Remover animal
                const index = this.game.environment.objects.indexOf(targetAnimal);
                if (index > -1) {
                    this.game.environment.objects.splice(index, 1);
                }
                
                this.showNotification(`¡${targetAnimal.name} cazado! (+${foodReward} carne)`);
            } else {
                this.game.stats.health -= 10;
                this.showNotification('¡El animal atacó!');
            }
            
            this.game.stats.energy -= 25;
        }
    }
    
    // Crafting
    craft() {
        if (this.inventory.wood >= 3 && this.inventory.stone >= 2) {
            this.inventory.wood -= 3;
            this.inventory.stone -= 2;
            this.inventory.materials += 1;
            this.showNotification('¡Herramienta creada!');
            this.game.stats.energy -= 15;
        } else {
            this.showNotification('No tienes suficientes materiales');
        }
    }
    
    // Descansar
    rest() {
        if (this.game.stats.energy < 50) {
            this.game.stats.energy = Math.min(100, this.game.stats.energy + 40);
            this.showNotification('¡Descansado!');
        } else {
            this.showNotification('No estás tan cansado');
        }
    }
    
    // Collect genérico
    collect() {
        // Buscar el objeto más cercano
        const nearest = this.getNearbyObject();
        if (nearest) {
            if (nearest.type === 'tree') {
                this.collectWood();
            } else if (nearest.type === 'rock') {
                this.breakRock();
            }
        } else {
            this.showNotification('No hay nada cercano para recolectar');
        }
    }
    
    findObjectOfType(type) {
        for (let obj of this.game.environment.objects) {
            if (obj.type === type) {
                const dx = (obj.x + obj.width / 2) - (this.game.player.x + this.game.player.width / 2);
                const dy = (obj.y + obj.height / 2) - (this.game.player.y + this.game.player.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.interactionRange) {
                    return obj;
                }
            }
        }
        return null;
    }
    
    showNotification(message) {
        // Crear notificación visual
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #4CAF50;
            padding: 15px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 100;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
