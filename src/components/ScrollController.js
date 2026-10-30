/**
 * ScrollController.js
 * Componente reutilizable: Calcula el progreso global normalizado (0.00 -> 1.00),
 * sincroniza la cámara 3D y la iluminación entre los 5 puntos de control de la
 * narrativa "DNA TO INTELLIGENCE" y actualiza el HUD de navegación.
 *
 * Puntos de control:
 * - 0.00–0.20: Presentación del ADN (Hero / El Origen)
 * - 0.20–0.45: Rotación y activación molecular (Método FDE & Arquitectura IA)
 * - 0.45–0.65: Transformación en partículas y energía (Rediseño de Procesos & Roles Aumentados)
 * - 0.65–0.82: Desplazamiento de la energía hacia la neurona (Ecosistema, Proyectos y Trayectoria)
 * - 0.82–1.00: Recepción de impulsos y activación neuronal (Inteligencia Aumentada / Neurona Final)
 */
export class ScrollController {
    constructor(camera, lights, options = {}) {
        this.camera = camera;
        this.lights = lights;
        this.targetProgress = 0;
        this.smoothProgress = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.checkpoints = [
            { min: 0.00, max: 0.20, id: 'origen', label: '01 // ADN • EL ORIGEN' },
            { min: 0.20, max: 0.45, id: 'activacion', label: '02 // ACTIVACIÓN MOLECULAR & ARQUITECTURA' },
            { min: 0.45, max: 0.65, id: 'energia', label: '03 // FLUJO DE ENERGÍA & ROLES AUMENTADOS' },
            { min: 0.65, max: 0.82, id: 'convergencia', label: '04 // CONVERGENCIA & ECOSISTEMA EN PRODUCCIÓN' },
            { min: 0.82, max: 1.00, id: 'neurona', label: '05 // NEURONA ACTIVA • INTELIGENCIA AUMENTADA' }
        ];

        this.bindEvents();
    }

    bindEvents() {
        const updateScroll = () => {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            this.targetProgress = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
        };
        window.addEventListener('scroll', updateScroll, { passive: true });
        window.addEventListener('resize', updateScroll, { passive: true });
        updateScroll();

        window.addEventListener('mousemove', (e) => {
            if (this.reducedMotion) return;
            this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        }, { passive: true });
    }

    getCurrentCheckpoint(p) {
        for (let i = 0; i < this.checkpoints.length; i++) {
            const cp = this.checkpoints[i];
            if (p >= cp.min && p <= cp.max) return cp;
        }
        return this.checkpoints[this.checkpoints.length - 1];
    }

    update(elapsedTime) {
        const damping = this.reducedMotion ? 0.35 : 0.075;
        this.smoothProgress += (this.targetProgress - this.smoothProgress) * damping;
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.06;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.06;

        const p = this.smoothProgress;

        // Trayectoria continua de cámara sincronizada con la narrativa:
        // De y = +3.5 (enfocando el ADN superior) hasta y = -18.5 (enfocando la Neurona final)
        const camY = THREE.MathUtils.lerp(3.2, -18.2, THREE.MathUtils.smoothstep(p, 0.08, 0.92));
        const camZ = THREE.MathUtils.lerp(24.5, 20.5, Math.sin(p * Math.PI) * 0.45);
        const camX = Math.sin(p * Math.PI * 1.5) * 2.2 + this.mouseX * 1.4;

        this.camera.position.set(camX, camY + this.mouseY * 1.1, camZ);

        const lookTargetY = THREE.MathUtils.lerp(2.4, -18.5, THREE.MathUtils.smoothstep(p, 0.05, 0.90));
        const lookTargetX = THREE.MathUtils.lerp(1.8, 0.0, THREE.MathUtils.smoothstep(p, 0.0, 0.38));
        this.camera.lookAt(lookTargetX, lookTargetY, 0);

        // Transición cromática de iluminación: Azul molecular -> Cian eléctrico -> Violeta neuronal
        if (this.lights && this.lights.primary && this.lights.secondary) {
            const cMolecular = new THREE.Color(0x0284c7);
            const cElectricCyan = new THREE.Color(0x22d3ee);
            const cNeuralViolet = new THREE.Color(0x8b5cf6);

            if (p < 0.5) {
                this.lights.primary.color.copy(cMolecular).lerp(cElectricCyan, p * 2.0);
            } else {
                this.lights.primary.color.copy(cElectricCyan).lerp(cNeuralViolet, (p - 0.5) * 2.0);
            }
            this.lights.primary.position.y = camY + 6;
            this.lights.secondary.position.y = camY - 5;
        }

        return p;
    }
}
