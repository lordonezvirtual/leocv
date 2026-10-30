/**
 * NeuronScene.js
 * Componente 3D reutilizable: Neurona tridimensional multipolar con soma orgánico
 * semitranslúcido, núcleo bioluminiscente, dendritas ramificadas, axón con vainas
 * de mielina, impulsos de potencial de acción y red neuronal circundante que se
 * ilumina progresivamente (0.68 -> 1.00).
 */
export class NeuronScene {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isLowPower = options.isLowPower || false;
        this.group = new THREE.Group();
        this.group.position.set(0, -18.5, 0);
        this.scene.add(this.group);

        this.somaMesh = null;
        this.nucleusMesh = null;
        this.dendriteMeshes = [];
        this.dendriteCurves = [];
        this.synapsePulses = [];
        this.axonMesh = null;
        this.myelinSheaths = [];
        this.networkNodes = [];
        this.networkLines = null;
        this.manualBurstIntensity = 0;

        this.initNeuronGeometry();
        this.initSurroundingNetwork();
    }

    initNeuronGeometry() {
        // 1. SOMA (Cuerpo celular orgánico semitranslúcido)
        const somaDetail = this.isLowPower ? 3 : 4;
        const somaGeo = new THREE.IcosahedronGeometry(2.55, somaDetail);
        const posAttr = somaGeo.attributes.position;
        const v = new THREE.Vector3();

        // Deformación orgánica suave para perfilar las raíces dendríticas y el cono axónico
        for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i);
            const n = v.clone().normalize();
            const displacement = 1.0
                + 0.14 * Math.sin(n.x * 4.0) * Math.cos(n.y * 4.0)
                + 0.10 * Math.cos(n.z * 5.0);
            v.multiplyScalar(displacement);
            posAttr.setXYZ(i, v.x, v.y, v.z);
        }
        somaGeo.computeVertexNormals();

        this.somaMat = new THREE.MeshPhysicalMaterial({
            color: 0x1e1b4b,
            emissive: 0x4c1d95,
            emissiveIntensity: 0.45,
            roughness: 0.18,
            metalness: 0.1,
            transparent: true,
            opacity: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.12
        });
        this.somaMesh = new THREE.Mesh(somaGeo, this.somaMat);
        this.group.add(this.somaMesh);

        // 2. NÚCLEO INTERNO BIOLUMINISCENTE
        const nucGeo = new THREE.SphereGeometry(1.18, this.isLowPower ? 16 : 28, this.isLowPower ? 16 : 28);
        this.nucleusMat = new THREE.MeshStandardMaterial({
            color: 0x67e8f9,
            emissive: 0x22d3ee,
            emissiveIntensity: 1.4,
            roughness: 0.2,
            transparent: true,
            opacity: 0.0
        });
        this.nucleusMesh = new THREE.Mesh(nucGeo, this.nucleusMat);
        this.group.add(this.nucleusMesh);

        // 3. DENDRITAS RAMIFICADAS Y RECEPTORES SINÁPTICOS
        this.dendriteMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            emissive: 0x6d28d9,
            emissiveIntensity: 0.55,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.0
        });

        const dendriteDirections = [
            new THREE.Vector3(1.0, 0.8, 0.4),
            new THREE.Vector3(-1.0, 0.75, 0.5),
            new THREE.Vector3(0.4, 1.0, -0.8),
            new THREE.Vector3(-0.6, 0.9, -0.7),
            new THREE.Vector3(1.1, -0.2, -0.5),
            new THREE.Vector3(-1.1, -0.1, 0.6),
            new THREE.Vector3(0.7, 0.3, 1.0),
            new THREE.Vector3(-0.5, -0.7, -0.9),
            new THREE.Vector3(0.8, -0.6, 0.7)
        ];

        const spineGeo = new THREE.SphereGeometry(0.18, 10, 10);
        const pulseGeo = new THREE.SphereGeometry(0.24, 12, 12);

        dendriteDirections.forEach((dir, idx) => {
            const norm = dir.clone().normalize();
            const p0 = norm.clone().multiplyScalar(2.1);
            const p1 = norm.clone().multiplyScalar(4.2).add(new THREE.Vector3(Math.sin(idx) * 0.7, Math.cos(idx) * 0.6, 0));
            const p2 = norm.clone().multiplyScalar(6.6).add(new THREE.Vector3(Math.cos(idx * 2) * 1.1, Math.sin(idx * 2) * 0.9, Math.sin(idx) * 0.8));
            const p3 = norm.clone().multiplyScalar(8.8).add(new THREE.Vector3(Math.sin(idx * 3) * 1.4, Math.cos(idx * 1.5) * 1.2, Math.cos(idx) * 1.1));

            const mainCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
            this.dendriteCurves.push(mainCurve);

            const tubeGeo = new THREE.TubeGeometry(mainCurve, this.isLowPower ? 18 : 30, 0.22, this.isLowPower ? 6 : 10, false);
            const tubeMesh = new THREE.Mesh(tubeGeo, this.dendriteMat.clone());
            this.group.add(tubeMesh);
            this.dendriteMeshes.push(tubeMesh);

            // Bifurcación secundaria de cada dendrita
            const branchEnd = p2.clone().add(new THREE.Vector3(norm.z * 2.4, norm.x * 1.8, -norm.y * 2.2));
            const subCurve = new THREE.CatmullRomCurve3([p1.clone().lerp(p2, 0.6), p2, branchEnd]);
            const subGeo = new THREE.TubeGeometry(subCurve, 14, 0.11, 6, false);
            const subMesh = new THREE.Mesh(subGeo, this.dendriteMat.clone());
            this.group.add(subMesh);
            this.dendriteMeshes.push(subMesh);

            // Botón / receptor sináptico en la punta de la dendrita
            const tipNode = new THREE.Mesh(spineGeo, this.nucleusMat.clone());
            tipNode.position.copy(p3);
            this.group.add(tipNode);
            this.dendriteMeshes.push(tipNode);

            // Pulso sináptico que viaja desde la punta de la dendrita hacia el soma
            const pulseMat = new THREE.MeshBasicMaterial({
                color: idx % 2 === 0 ? 0x67e8f9 : 0xc084fc,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending
            });
            const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
            pulseMesh.userData = { curve: mainCurve, offset: idx / dendriteDirections.length, speed: 0.42 + (idx % 3) * 0.12 };
            this.group.add(pulseMesh);
            this.synapsePulses.push(pulseMesh);
        });

        // 4. AXÓN PRINCIPAL Y VAINAS DE MIELINA
        const axonCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.2, -2.1, -0.2),
            new THREE.Vector3(1.8, -5.2, -1.2),
            new THREE.Vector3(3.6, -8.5, -0.4),
            new THREE.Vector3(5.8, -12.0, 1.2)
        ]);
        this.dendriteCurves.push(axonCurve);

        const axonGeo = new THREE.TubeGeometry(axonCurve, 32, 0.26, 10, false);
        this.axonMesh = new THREE.Mesh(axonGeo, this.dendriteMat.clone());
        this.group.add(this.axonMesh);
        this.dendriteMeshes.push(this.axonMesh);

        // Vainas de mielina translúcidas a lo largo del axón
        const sheathGeo = new THREE.CylinderGeometry(0.46, 0.46, 1.4, 12);
        const sheathMat = new THREE.MeshPhysicalMaterial({
            color: 0xa855f7,
            emissive: 0x7c3aed,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.0,
            roughness: 0.2
        });

        [0.22, 0.48, 0.74].forEach((tPos) => {
            const pt = axonCurve.getPointAt(tPos);
            const tangent = axonCurve.getTangentAt(tPos);
            const sheath = new THREE.Mesh(sheathGeo, sheathMat.clone());
            sheath.position.copy(pt);
            sheath.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize());
            this.group.add(sheath);
            this.myelinSheaths.push(sheath);
        });
    }

    initSurroundingNetwork() {
        // Red neuronal periférica que se ilumina cuando la neurona central se activa
        const netCount = this.isLowPower ? 18 : 30;
        const nodeGeo = new THREE.SphereGeometry(0.22, 10, 10);
        const linePoints = [];

        for (let i = 0; i < netCount; i++) {
            const angle = (i / netCount) * Math.PI * 2;
            const r = 9.5 + (i % 4) * 2.8;
            const y = (Math.sin(i * 2.1) * 7.5);
            const pos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);

            const mat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x38bdf8 : 0xc084fc,
                transparent: true,
                opacity: 0.0
            });
            const mesh = new THREE.Mesh(nodeGeo, mat);
            mesh.position.copy(pos);
            mesh.userData = { basePos: pos.clone(), index: i };
            this.group.add(mesh);
            this.networkNodes.push(mesh);

            // Conectar con la punta de la dendrita más cercana y con nodos vecinos
            const dendriteCurve = this.dendriteCurves[i % (this.dendriteCurves.length - 1)];
            const tipPoint = dendriteCurve.getPointAt(1.0);
            linePoints.push(tipPoint.clone(), pos.clone());

            if (i > 0) {
                linePoints.push(this.networkNodes[i - 1].position.clone(), pos.clone());
            }
        }

        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
        this.networkLinesMat = new THREE.LineBasicMaterial({
            color: 0x818cf8,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending
        });
        this.networkLines = new THREE.LineSegments(lineGeo, this.networkLinesMat);
        this.group.add(this.networkLines);
    }

    triggerSynapticBurst() {
        this.manualBurstIntensity = 1.6;
    }

    update(progress, elapsedTime) {
        // Aparición progresiva desde 0.64, protagonismo total en 0.82 - 1.00
        const reveal = THREE.MathUtils.smoothstep(progress, 0.62, 0.84);
        const fullActivation = THREE.MathUtils.smoothstep(progress, 0.80, 0.96);

        this.group.visible = reveal > 0.005;
        if (!this.group.visible) return;

        if (this.manualBurstIntensity > 0) {
            this.manualBurstIntensity = Math.max(0, this.manualBurstIntensity - 0.025);
        }

        const burst = this.manualBurstIntensity;

        // Rotación tridimensional orgánica y respiración celular
        this.group.rotation.y = elapsedTime * 0.16 + (1.0 - reveal) * 0.8;
        this.group.rotation.x = Math.sin(elapsedTime * 0.35) * 0.08;
        this.group.rotation.z = Math.cos(elapsedTime * 0.28) * 0.06;

        const somaBeat = 1.0 + Math.sin(elapsedTime * 2.8) * (0.03 + fullActivation * 0.035) + burst * 0.08;
        this.somaMesh.scale.setScalar(somaBeat);
        this.somaMat.opacity = reveal * 0.76;
        this.somaMat.emissiveIntensity = 0.4 + fullActivation * 0.65 + burst * 0.9;

        // Núcleo brillante reactivo a la llegada de señales
        const nucPulse = 1.0 + Math.sin(elapsedTime * 5.6) * 0.12 + burst * 0.25;
        this.nucleusMesh.scale.setScalar(nucPulse);
        this.nucleusMat.opacity = reveal * 0.96;
        this.nucleusMat.emissiveIntensity = 1.1 + fullActivation * 1.4 + Math.sin(elapsedTime * 5.6) * 0.5 + burst * 2.0;

        // Dendritas y axón
        for (let i = 0; i < this.dendriteMeshes.length; i++) {
            const m = this.dendriteMeshes[i];
            m.material.opacity = reveal * 0.86;
            m.material.emissiveIntensity = 0.4 + fullActivation * 0.6 * (0.5 + 0.5 * Math.sin(elapsedTime * 3.2 + i)) + burst;
        }

        // Vainas de mielina
        this.myelinSheaths.forEach((sh, idx) => {
            sh.material.opacity = reveal * 0.58;
            sh.material.emissiveIntensity = 0.4 + fullActivation * 0.8 * (0.5 + 0.5 * Math.sin(elapsedTime * 4.5 - idx)) + burst;
        });

        // Impulsos energéticos viajando desde las puntas de las dendritas (t=1) hacia el soma (t=0)
        for (let i = 0; i < this.synapsePulses.length; i++) {
            const sp = this.synapsePulses[i];
            const ud = sp.userData;
            const t = 1.0 - ((elapsedTime * (ud.speed + burst * 0.3) + ud.offset) % 1.0);
            const pt = ud.curve.getPointAt(t);
            sp.position.copy(pt);
            sp.scale.setScalar(0.8 + (1.0 - t) * 0.7 + burst * 0.4);
            sp.material.opacity = reveal * (0.55 + fullActivation * 0.45);
        }

        // Red neuronal periférica que se activa progresivamente en el tramo final
        for (let i = 0; i < this.networkNodes.length; i++) {
            const node = this.networkNodes[i];
            const wave = 0.5 + 0.5 * Math.sin(elapsedTime * 3.0 + i * 0.7);
            node.material.opacity = fullActivation * (0.45 + wave * 0.55);
            node.scale.setScalar(0.8 + fullActivation * wave * 0.8 + burst * 0.5);
        }

        if (this.networkLines) {
            this.networkLinesMat.opacity = fullActivation * (0.28 + burst * 0.35);
        }
    }
}
