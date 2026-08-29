// Jugador 3D en Primera Persona
class Player3D {
    constructor(game) {
        this.game = game;
        this.group = new THREE.Group();
        
        // Posición y física
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        
        // Parámetros de movimiento
        this.speed = 15;
        this.sprintSpeed = 25;
        this.jumpPower = 15;
        this.gravity = 30;
        this.isGrounded = false;
        this.isRunning = false;
        this.isJumping = false;
        
        // Rotación de vista (primera persona)
        this.camera = game.camera;
        this.pitch = 0; // Rotación vertical
        this.yaw = 0;   // Rotación horizontal
        this.pitchLimit = Math.PI / 2.5;
        
        // Control de mouse
        this.setupMouseControl();
        
        // Crear cuerpo del jugador (para colisiones)
        this.createBody();
    }
    
    createBody() {
        // Cilindro para el cuerpo (invisible, solo para colisiones)
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
        const bodyMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bodyMesh.position.y = 0.9;
        this.group.add(bodyMesh);
        this.bodyMesh = bodyMesh;
        
        // Cabeza (esfera pequeña)
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFB366 });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        headMesh.castShadow = true;
        headMesh.position.y = 1.6;
        this.group.add(headMesh);
        
        // Linterna de mano (luz puntual para iluminar en primera persona)
        const flashlight = new THREE.PointLight(0xffffff, 0.5, 100);
        flashlight.position.set(0.2, 1.5, -0.5);
        this.group.add(flashlight);
        this.flashlight = flashlight;
        
        // Arma (rifle simple)
        this.createWeapon();
    }
    
    createWeapon() {
        // Grupo para el arma
        this.weaponGroup = new THREE.Group();
        this.weaponGroup.position.set(0.3, -0.3, -0.8);
        this.group.add(this.weaponGroup);
        
        // Cañón (cilindro)
        const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 16);
        const metalMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.3;
        this.weaponGroup.add(barrel);
        
        // Culata (caja)
        const stockGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.3);
        const woodMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const stock = new THREE.Mesh(stockGeometry, woodMaterial);
        stock.position.set(-0.15, 0, 0);
        this.weaponGroup.add(stock);
        
        // Mira (pequeño cilindro)
        const sightGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 16);
        const sightMesh = new THREE.Mesh(sightGeometry, metalMaterial);
        sightMesh.rotation.z = Math.PI / 2;
        sightMesh.position.set(0.1, 0.08, 0);
        this.weaponGroup.add(sightMesh);
    }
    
    setupMouseControl() {
        // Control de ratón para mirar (solo si está soportado)
        if ('pointerLockAPI' in document || 'mozPointerLockElement' in document) {
            document.addEventListener('click', () => {
                this.game.container.requestPointerLock?.() || 
                this.game.container.mozRequestPointerLock?.();
            });
            
            document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        }
    }
    
    onMouseMove(event) {
        if (document.pointerLockElement === this.game.container || 
            document.mozPointerLockElement === this.game.container) {
            
            // Sensibilidad del ratón
            const sensitivity = 0.003;
            
            this.yaw -= event.movementX * sensitivity;
            this.pitch -= event.movementY * sensitivity;
            
            // Limitar rotación vertical
            this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
        }
    }
    
    update(dt, keys) {
        // Movimiento horizontal
        const moveDirection = new THREE.Vector3();
        const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        
        this.isRunning = false;
        const isSprinting = keys['shift'];
        const currentSpeed = isSprinting ? this.sprintSpeed : this.speed;
        
        if (keys['w'] || keys['arrowup']) {
            moveDirection.add(forward);
            this.isRunning = true;
        }
        if (keys['s'] || keys['arrowdown']) {
            moveDirection.sub(forward);
        }
        if (keys['a'] || keys['arrowleft']) {
            moveDirection.sub(right);
        }
        if (keys['d'] || keys['arrowright']) {
            moveDirection.add(right);
        }
        
        // Normalizar dirección
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }
        
        // Aplicar velocidad
        this.velocity.x = moveDirection.x * currentSpeed;
        this.velocity.z = moveDirection.z * currentSpeed;
        
        // Gravedad
        this.velocity.y -= this.gravity * dt;
        
        // Salto
        if (keys[' '] && this.isGrounded) {
            this.velocity.y = this.jumpPower;
            this.isGrounded = false;
        }
        
        // Actualizar posición
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        
        // Colisión con el suelo
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        // Límites del mapa
        const boundary = 190;
        this.position.x = Math.max(-boundary, Math.min(boundary, this.position.x));
        this.position.z = Math.max(-boundary, Math.min(boundary, this.position.z));
        
        // Actualizar posición del grupo
        this.group.position.copy(this.position);
        
        // Actualizar cámara en primera persona
        this.updateFirstPersonCamera();
    }
    
    updateFirstPersonCamera() {
        // Posicionar cámara en los ojos del jugador
        const eyeHeight = 1.6;
        this.camera.position.copy(this.position);
        this.camera.position.y += eyeHeight;
        
        // Aplicar rotación
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        // Calcular punto de mira
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        const targetPos = this.camera.position.clone().add(forward.multiplyScalar(100));
        
        this.camera.lookAt(targetPos);
        
        // Actualizar rotación del arma
        this.weaponGroup.rotation.x = this.pitch * 0.5;
        this.weaponGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
    }
    
    checkCollision(obj) {
        if (!obj.mesh) return false;
        
        const distance = this.position.distanceTo(obj.mesh.position);
        const minDistance = 2 + obj.radius;
        
        return distance < minDistance;
    }
    
    handleCollision(obj) {
        const direction = new THREE.Vector3()
            .subVectors(this.position, obj.mesh.position)
            .normalize();
        
        const pushForce = 0.5;
        this.position.add(direction.multiplyScalar(pushForce));
    }
    
    takeDamage(amount) {
        this.game.stats.health = Math.max(0, this.game.stats.health - amount);
    }
    
    heal(amount) {
        this.game.stats.health = Math.min(100, this.game.stats.health + amount);
    }
}
