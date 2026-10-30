/**
 * EnergyFlow.js
 * Componente 3D reutilizable: Filamentos de energía, constelación de nodos
 * operativos (Procesos, Personas, Agentes, Datos y Decisiones) y corrientes
 * de partículas que conectan la desconstrucción del ADN con las dendritas de la Neurona.
 */
export class EnergyFlow {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isLowPower = options.isLowPower || false;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.streamCurves = [];
        this.streamLines = [];
        this.streamPulses = [];
        this.workflowNodes = [];
        this.workflowLinks = null;
        this.flowParticles = null;
        this.flowParticleData = [];

        this.initEnergyStreams();
        this.initWorkflowConstellation();
        this.initFlowParticles();
    }

    initEnergyStreams() {
        // 8 trayectorias curvas Catmull-Rom 3D que descienden desde la región del ADN
        // hasta converger en las dendritas de la neurona inferior (y = -18)
        const streamCount = 8;
        for (let i = 0; i < streamCount; i++) {
            const angle = (i / streamCount) * Math.PI * 2;
            const startR = 3.8 + (i % 2) * 1.4;
            const midR = 7.5 + Math.sin(i * 1.5) * 2.5;
            const endR = 3.4; // Radio de las dendritas receptoras de la neurona

            const p0 = new THREE.Vector3(Math.cos(angle) * startR, 10 - (i % 3) * 2.5, Math.sin(angle) * startR);
            const p1 = new THREE.Vector3(Math.cos(angle + 0.8) * midR, 2.0, Math.sin(angle + 0.8) * midR);
            const p2 = new THREE.Vector3(Math.cos(angle + 1.6) * (midR * 0.75), -8.0, Math.sin(angle + 1.6) * (midR * 0.75));
            const p3 = new THREE.Vector3(Math.cos(angle + 2.2) * endR, -16.5 + Math.sin(i) * 1.8, Math.sin(angle + 2.2) * endR);

            const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
            this.streamCurves.push(curve);

            const points = curve.getPoints(this.isLowPower ? 45 : 80);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: i % 2 === 0 ? 0x22d3ee : 0xa855f7,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending
            });
            const line = new THREE.Line(lineGeo, lineMat);
            this.group.add(line);
            this.streamLines.push(line);

            // Impulsos viajeros sobre cada filamento de energía
            const pulseGeo = new THREE.SphereGeometry(0.28, 12, 12);
            const pulseMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x67e8f9 : 0xc084fc,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending
            });
            const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
            pulseMesh.userData = { curveIndex: i, phaseOffset: i / streamCount };
            this.group.add(pulseMesh);
            this.streamPulses.push(pulseMesh);
        }
    }

    initWorkflowConstellation() {
        // Nodos que representan Procesos, Personas, Agentes, Datos y Decisiones en Sección 04 (0.45 - 0.65)
        const nodeCoords = [
            new THREE.Vector3(-8, 1, 2),
            new THREE.Vector3(-4, 4, -2),
            new THREE.Vector3(0, 2, 3),
            new THREE.Vector3(4, 4, -1),
            new THREE.Vector3(8, 1, 2),
            new THREE.Vector3(-5, -3, 1),
            new THREE.Vector3(0, -4, -2),
            new THREE.Vector3(5, -3, 1)
        ];

        const nodeGeo = new THREE.OctahedronGeometry(0.48, 1);
        const linkPoints = [];

        nodeCoords.forEach((pos, idx) => {
            const mat = new THREE.MeshPhysicalMaterial({
                color: idx % 2 === 0 ? 0x22d3ee : 0xa855f7,
                emissive: idx % 2 === 0 ? 0x0284c7 : 0x7c3aed,
                emissiveIntensity: 0.7,
                transparent: true,
                opacity: 0.0,
                wireframe: false
            });
            const node = new THREE.Mesh(nodeGeo, mat);
            node.position.copy(pos);
            node.userData = { basePos: pos.clone(), index: idx };
            this.group.add(node);
            this.workflowNodes.push(node);

            if (idx > 0) {
                linkPoints.push(nodeCoords[idx - 1].clone(), pos.clone());
            }
        });
        linkPoints.push(nodeCoords[0].clone(), nodeCoords[5].clone());
        linkPoints.push(nodeCoords[2].clone(), nodeCoords[6].clone());
        linkPoints.push(nodeCoords[4].clone(), nodeCoords[7].clone());

        const linkGeo = new THREE.BufferGeometry().setFromPoints(linkPoints);
        const linkMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending
        });
        this.workflowLinks = new THREE.LineSegments(linkGeo, linkMat);
        this.group.add(this.workflowLinks);
    }

    initFlowParticles() {
        const count = this.isLowPower ? 140 : 280;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const cCyan = new THREE.Color(0x22d3ee);
        const cBlue = new THREE.Color(0x0284c7);
        const cViolet = new THREE.Color(0xa855f7);

        for (let i = 0; i < count; i++) {
            const streamIdx = i % this.streamCurves.length;
            const t = Math.random();
            const pt = this.streamCurves[streamIdx].getPointAt(t);
            const spread = 0.6 + Math.random() * 1.8;
            const angle = Math.random() * Math.PI * 2;

            positions[i * 3] = pt.x + Math.cos(angle) * spread;
            positions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 2] = pt.z + Math.sin(angle) * spread;

            const col = i % 3 === 0 ? cCyan : (i % 3 === 1 ? cViolet : cBlue);
            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;

            this.flowParticleData.push({
                streamIdx,
                t,
                speed: 0.14 + Math.random() * 0.24,
                spread,
                angle
            });
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.24,
            vertexColors: true,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.flowParticles = new THREE.Points(geo, mat);
        this.group.add(this.flowParticles);
    }

    update(progress, elapsedTime) {
        // Activo desde 0.38 hasta 0.96
        const flowStrength = THREE.MathUtils.smoothstep(progress, 0.36, 0.50) * (1.0 - THREE.MathUtils.smoothstep(progress, 0.90, 0.99));
        this.group.visible = flowStrength > 0.005;
        if (!this.group.visible) return;

        this.group.rotation.y = elapsedTime * 0.12 + progress * 1.2;

        // Filamentos e impulsos hacia la neurona
        for (let i = 0; i < this.streamLines.length; i++) {
            this.streamLines[i].material.opacity = flowStrength * 0.42;

            const pulse = this.streamPulses[i];
            const curve = this.streamCurves[i];
            // El pulso viaja a lo largo de la curva en función tanto del scroll como del tiempo
            const travelT = (elapsedTime * 0.38 + pulse.userData.phaseOffset + progress * 0.8) % 1.0;
            const pos = curve.getPointAt(travelT);
            pulse.position.copy(pos);
            pulse.scale.setScalar(0.9 + Math.sin(elapsedTime * 6.0 + i) * 0.35);
            pulse.material.opacity = flowStrength * 0.95;
        }

        // Constelación de Rediseño de Procesos y Roles Aumentados (0.44 -> 0.66)
        const wfAlpha = THREE.MathUtils.smoothstep(progress, 0.43, 0.50) * (1.0 - THREE.MathUtils.smoothstep(progress, 0.60, 0.68));
        this.workflowNodes.forEach((node, idx) => {
            node.material.opacity = wfAlpha * 0.9;
            node.rotation.y = elapsedTime * 0.8 + idx;
            node.rotation.x = elapsedTime * 0.5;
            node.position.y = node.userData.basePos.y + Math.sin(elapsedTime * 2.0 + idx) * 0.3;
        });
        if (this.workflowLinks) {
            this.workflowLinks.material.opacity = wfAlpha * 0.45;
        }

        // Corriente volumétrica de partículas hacia las dendritas
        if (this.flowParticles) {
            const posAttr = this.flowParticles.geometry.attributes.position;
            const arr = posAttr.array;

            for (let i = 0; i < this.flowParticleData.length; i++) {
                const fd = this.flowParticleData[i];
                fd.t = (fd.t + 0.0035 * (1.0 + fd.speed)) % 1.0;
                const pt = this.streamCurves[fd.streamIdx].getPointAt(fd.t);
                const curSpread = fd.spread * (1.0 - fd.t * 0.55); // Converge al acercarse a la neurona
                const curAngle = fd.angle + elapsedTime * 0.8;

                arr[i * 3] = pt.x + Math.cos(curAngle) * curSpread;
                arr[i * 3 + 1] = pt.y;
                arr[i * 3 + 2] = pt.z + Math.sin(curAngle) * curSpread;
            }
            posAttr.needsUpdate = true;
            this.flowParticles.material.opacity = flowStrength * 0.82;
        }
    }
}
