// Motor principal del juego 3D con Three.js
class Game3D {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.container = document.getElementById('game-container');
        
        // Configurar Three.js
        this.setupThreeJS();
        this.setupLighting();
        this.setupEnvironment();
        
        // Crear jugador
        this.player = new Player3D(this);
        this.scene.add(this.player.group);
        
        // Crear ambiente
        this.environment = new Environment3D(this);
        
        // Interacciones
        this.interactions = new Interactions3D(this);
        
        // Estadísticas
        this.stats = {
            health: 100,
            hunger: 100,
            energy: 100,
            time: 0,
            dayNight: 0
        };
        
        // Control
        this.keys = {};
        this.setupControls();
        
        // FPS Counter
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = Date.now();
        
        // Raycaster para seleccionar objetos
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Iniciar loop
        this.animate();
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupThreeJS() {
        // Escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 500, 2000);
        
        // Cámara
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    setupLighting() {
        // Luz solar
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        this.scene.add(this.sunLight);
        
        // Luz ambiental
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        
        // Luz hemisférica para realismo
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.6);
        this.scene.add(hemiLight);
    }
    
    setupEnvironment() {
        // Suelo
        const groundGeometry = new THREE.PlaneGeometry(400, 400);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Pasto
        const grassGeometry = new THREE.PlaneGeometry(400, 400);
        const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x3d7021 });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = 0.01;
        grass.receiveShadow = true;
        this.scene.add(grass);
        
        // Cielo
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        this.sky = sky;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
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
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000;
        
        // Actualizar jugador
        this.player.update(dt, this.keys);
        
        // Actualizar cámara
        this.updateCamera();
        
        // Actualizar ambiente
        this.environment.update(dt);
        
        // Actualizar estadísticas
        this.updateStats(dt);
        
        // Actualizar ciclo día-noche
        this.updateDayNightCycle();
        
        // Colisiones
        this.checkCollisions();
        
        // Actualizar UI
        this.updateUI();
    }
    
    updateCamera() {
        const cameraDistance = 25;
        const cameraHeight = 10;
        const targetX = this.player.group.position.x - Math.sin(this.player.rotation) * cameraDistance;
        const targetZ = this.player.group.position.z + Math.cos(this.player.rotation) * cameraDistance;
        
        this.camera.position.lerp(
            new THREE.Vector3(targetX, this.player.group.position.y + cameraHeight, targetZ),
            0.1
        );
        this.camera.lookAt(this.player.group.position.x, this.player.group.position.y + 5, this.player.group.position.z);
    }
    
    updateStats(dt) {
        this.stats.time += dt;
        
        // Hambre
        if (this.player.isRunning) {
            this.stats.hunger = Math.max(0, this.stats.hunger - dt * 15);
            this.stats.energy = Math.max(0, this.stats.energy - dt * 20);
        } else {
            this.stats.hunger = Math.max(0, this.stats.hunger - dt * 5);
            this.stats.energy = Math.min(100, this.stats.energy + dt * 10);
        }
        
        if (this.stats.hunger < 20) {
            this.stats.health = Math.max(0, this.stats.health - dt * 10);
        }
        
        if (this.stats.energy < 20) {
            this.stats.health = Math.max(0, this.stats.health - dt * 5);
        }
    }
    
    updateDayNightCycle() {
        this.stats.dayNight = (this.stats.time % 120) / 120;
        
        // Cambiar color del cielo
        let skyColor;
        if (this.stats.dayNight < 0.25) {
            skyColor = this.lerpColor(new THREE.Color(0x1a1a2e), new THREE.Color(0x87CEEB), this.stats.dayNight / 0.25);
        } else if (this.stats.dayNight < 0.75) {
            skyColor = new THREE.Color(0x87CEEB);
        } else {
            skyColor = this.lerpColor(new THREE.Color(0x87CEEB), new THREE.Color(0x1a1a2e), (this.stats.dayNight - 0.75) / 0.25);
        }
        
        this.sky.material.color = skyColor;
        this.scene.background = skyColor;
        this.scene.fog.color = skyColor;
        
        // Ajustar intensidad de luz
        const lightIntensity = Math.max(0.2, Math.sin(this.stats.dayNight * Math.PI));
        this.sunLight.intensity = lightIntensity;
        this.ambientLight.intensity = 0.3 + lightIntensity * 0.4;
    }
    
    lerpColor(c1, c2, t) {
        const result = new THREE.Color();
        result.r = c1.r + (c2.r - c1.r) * t;
        result.g = c1.g + (c2.g - c1.g) * t;
        result.b = c1.b + (c2.b - c1.b) * t;
        return result;
    }
    
    checkCollisions() {
        this.environment.objects.forEach(obj => {
            if (this.player.checkCollision(obj)) {
                this.player.handleCollision(obj);
            }
        });
    }
    
    updateUI() {
        document.getElementById('health-bar').style.width = Math.max(0, this.stats.health) + '%';
        document.getElementById('hunger-bar').style.width = Math.max(0, this.stats.hunger) + '%';
        document.getElementById('energy-bar').style.width = Math.max(0, this.stats.energy) + '%';
        
        // FPS
        this.frameCount++;
        const now = Date.now();
        if (now >= this.lastTime + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            document.getElementById('fps').textContent = 'FPS: ' + this.fps;
        }
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate = () => {
        requestAnimationFrame(this.animate);
        
        const now = Date.now();
        const deltaTime = now - (this.lastAnimateTime || now);
        this.lastAnimateTime = now;
        
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    };
}

// Iniciar juego
window.addEventListener('DOMContentLoaded', () => {
    new Game3D();
});
