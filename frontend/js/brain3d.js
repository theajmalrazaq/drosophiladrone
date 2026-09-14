/**
 * 3D Fruit Fly (Drosophila) Connectome Soma & Neural Spiking Visualizer.
 */

class Brain3DVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        const width = (this.container && this.container.clientWidth > 0) ? this.container.clientWidth : 280;
        const height = (this.container && this.container.clientHeight > 0) ? this.container.clientHeight : 180;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 30, 75);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        if (this.container) {
            this.container.appendChild(this.renderer.domElement);
        }
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.8;
        
        this.neuronCount = 1398;
        this.colors = new Float32Array(this.neuronCount * 3);
        this.baseColors = new Float32Array(this.neuronCount * 3);
        this.positions = new Float32Array(this.neuronCount * 3);
        
        this.initSomas();
        this.initLights();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
        
        window.addEventListener('resize', () => this.onResize());
    }

    initSomas() {
        const geom = new THREE.BufferGeometry();
        
        // Construct biological Drosophila brain anatomical lobes:
        // Left & Right Optic Lobes, Central Complex donut/ring, Mushroom Body calyx, Ventral descending cord
        for (let i = 0; i < this.neuronCount; i++) {
            let x = 0, y = 0, z = 0;
            let r = 0, g = 0, b = 0;
            
            if (i < 240) {
                // Retina & Optic Lobe (Left & Right hemispheres)
                const side = (i % 2 === 0) ? -1 : 1;
                const phi = Math.random() * Math.PI;
                const theta = Math.random() * Math.PI * 0.8;
                const radius = 18 + Math.random() * 4;
                x = side * (16 + radius * Math.sin(theta) * Math.cos(phi) * 0.7);
                y = radius * Math.sin(theta) * Math.sin(phi);
                z = radius * Math.cos(theta);
                r = 0.0; g = 0.94; b = 1.0; // Cyan
            } else if (i < 288) {
                // Central Complex (Ellipsoid body ring attractor)
                const angle = ((i - 240) / 48) * Math.PI * 2;
                const radius = 6.5 + Math.random() * 2;
                x = radius * Math.cos(angle);
                y = 2.0 + (Math.random() - 0.5) * 3;
                z = radius * Math.sin(angle);
                r = 1.0; g = 0.82; b = 0.0; // Yellow
            } else if (i < 1088) {
                // Mushroom Body Kenyon Cells (Dorsal mushroom cap)
                const phi = Math.random() * Math.PI * 2;
                const rad = Math.random() * 12;
                x = rad * Math.cos(phi);
                y = 10 + Math.random() * 10;
                z = rad * Math.sin(phi) * 0.7;
                r = 0.88; g = 0.14; b = 0.76; // Magenta
            } else if (i < 1112) {
                // PAM11 (Reward DANs)
                x = (Math.random() - 0.5) * 8;
                y = 6 + Math.random() * 4;
                z = (Math.random() - 0.5) * 8;
                r = 0.0; g = 1.0; b = 0.53; // Bright Green
            } else if (i < 1136) {
                // PPL101 (Aversive DANs)
                x = (Math.random() - 0.5) * 8;
                y = 4 + Math.random() * 4;
                z = (Math.random() - 0.5) * 8;
                r = 1.0; g = 0.2; b = 0.4; // Red
            } else {
                // Descending Motor Flight Neurons (Ventral nerve cord pathway)
                const side = (i % 2 === 0) ? -1 : 1;
                x = side * (3 + Math.random() * 4);
                y = -10 - Math.random() * 14;
                z = (Math.random() - 0.5) * 6;
                r = 0.23; g = 0.51; b = 0.96; // Blue
            }
            
            this.positions[i * 3] = x;
            this.positions[i * 3 + 1] = y;
            this.positions[i * 3 + 2] = z;
            
            this.baseColors[i * 3] = r;
            this.baseColors[i * 3 + 1] = g;
            this.baseColors[i * 3 + 2] = b;
            
            this.colors[i * 3] = r * 0.4;
            this.colors[i * 3 + 1] = g * 0.4;
            this.colors[i * 3 + 2] = b * 0.4;
        }
        
        geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 1.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
        });
        
        this.pointCloud = new THREE.Points(geom, mat);
        this.scene.add(this.pointCloud);
    }

    initLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
    }

    updateSpikes(activeIndices) {
        if (!this.pointCloud) return;
        const colorAttr = this.pointCloud.geometry.attributes.color;
        
        // Decay existing colors back to base
        for (let i = 0; i < this.neuronCount; i++) {
            this.colors[i * 3] += (this.baseColors[i * 3] * 0.35 - this.colors[i * 3]) * 0.15;
            this.colors[i * 3 + 1] += (this.baseColors[i * 3 + 1] * 0.35 - this.colors[i * 3 + 1]) * 0.15;
            this.colors[i * 3 + 2] += (this.baseColors[i * 3 + 2] * 0.35 - this.colors[i * 3 + 2]) * 0.15;
        }
        
        // Flash active spiking somas brightly
        if (activeIndices && activeIndices.length > 0) {
            for (let idx of activeIndices) {
                if (idx < this.neuronCount) {
                    this.colors[idx * 3] = 1.0;
                    this.colors[idx * 3 + 1] = 1.0;
                    this.colors[idx * 3 + 2] = 1.0;
                }
            }
        }
        colorAttr.needsUpdate = true;
    }

    onResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width <= 0 || height <= 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
