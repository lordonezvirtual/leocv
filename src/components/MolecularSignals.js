/**
 * MolecularSignals.js
 * Componente 3D reutilizable: Impulsos luminosos que recorren las hebras
 * y enlaces del ADN (0.15 - 0.60) + planos holográficos discretos sincronizados
 * con la sección de Arquitectura de Inteligencia Artificial (0.30 - 0.48).
 */
export class MolecularSignals {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isLowPower = options.isLowPower || false;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.pulses = [];
        this.holoRings = [];
        this.helixRadius = 4.2;
        this.helixHeight = 32;
        this.turns = 2.6;

        this.initSignals();
        this.initArchitectureRings();
    }

    initSignals() {
        const pulseCount = this.isLowPower ? 14 : 26;
        const pulseGeo = new THREE.SphereGeometry(0.24, 12, 12);

        for (let i = 0; i < pulseCount; i++) {
            const isCyan = i % 2 === 0;
            const mat = new THREE.MeshBasicMaterial({
                color: isCyan ? 0x67e8f9 : 0xa855f7,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending
            });
            const mesh = new THREE.Mesh(pulseGeo, mat);
            mesh.userData = {
                offset: i / pulseCount,
                speed: 0.22 + (i % 5) * 0.06,
                strand: i % 3 === 0 ? 0 : (i % 2 === 0 ? 1 : -1), // 1: hebra A, -1: hebra B, 0: puente transversal
                rungIndex: i % 18
            };
            this.group.add(mesh);
            this.pulses.push(mesh);
        }
    }

    initArchitectureRings() {
        // 7 anillos / planos holográficos discretos para las 7 capas de Arquitectura IA
        const ringRadii = [6.2, 7.4, 8.6, 9.8, 11.0, 12.2, 13.4];
        ringRadii.forEach((r, idx) => {
            const ringGeo = new THREE.RingGeometry(r, r + 0.06, this.isLowPower ? 48 : 80);
            const ringMat = new THREE.MeshBasicMaterial({
                color: idx % 2 === 0 ? 0x22d3ee : 0x818cf8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI * 0.5 + (idx - 3) * 0.06;
            ring.position.y = (3 - idx) * 2.1;
            ring.userData = { baseY: ring.position.y, index: idx };
            this.group.add(ring);
            this.holoRings.push(ring);
        });
    }

    update(progress, elapsedTime, dnaGroup) {
        // Activo principalmente en 0.12 -> 0.65
        const signalEnvelope = THREE.MathUtils.smoothstep(progress, 0.10, 0.25) * (1.0 - THREE.MathUtils.smoothstep(progress, 0.55, 0.70));
        this.group.visible = signalEnvelope > 0.005;
        if (!this.group.visible) return;

        if (dnaGroup) {
            this.group.position.copy(dnaGroup.position);
            this.group.rotation.copy(dnaGroup.rotation);
        }

        // Actualizar pulsos moleculares viajando por las hélices y enlaces
        for (let i = 0; i < this.pulses.length; i++) {
            const p = this.pulses[i];
            const ud = p.userData;
            const t = (elapsedTime * ud.speed + ud.offset) % 1.0;
            const y = (0.5 - t) * this.helixHeight;
            const angle = t * Math.PI * 2 * this.turns;

            if (ud.strand === 1) {
                p.position.set(Math.cos(angle) * this.helixRadius, y, Math.sin(angle) * this.helixRadius);
            } else if (ud.strand === -1) {
                p.position.set(Math.cos(angle + Math.PI) * this.helixRadius, y, Math.sin(angle + Math.PI) * this.helixRadius);
            } else {
                // Pulso cruzando un enlace molecular de lado a lado
                const rungT = (ud.rungIndex / 18);
                const rungY = (0.5 - rungT) * this.helixHeight;
                const rungAngle = rungT * Math.PI * 2 * this.turns;
                const cross = Math.sin(elapsedTime * 5.0 + i);
                p.position.set(
                    Math.cos(rungAngle) * this.helixRadius * cross,
                    rungY,
                    Math.sin(rungAngle) * this.helixRadius * cross
                );
            }

            const pulseScale = 0.8 + 0.6 * Math.sin(elapsedTime * 8.0 + i);
            p.scale.setScalar(pulseScale);
            p.material.opacity = signalEnvelope * 0.9;
        }

        // Actualizar anillos holográficos de las 7 capas en Sección 03 (0.28 -> 0.48)
        const archVisibility = THREE.MathUtils.smoothstep(progress, 0.26, 0.34) * (1.0 - THREE.MathUtils.smoothstep(progress, 0.44, 0.52));
        for (let i = 0; i < this.holoRings.length; i++) {
            const ring = this.holoRings[i];
            ring.material.opacity = archVisibility * (0.24 + 0.12 * Math.sin(elapsedTime * 2.5 + i));
            ring.rotation.z = elapsedTime * (i % 2 === 0 ? 0.15 : -0.12);
        }
    }
}
