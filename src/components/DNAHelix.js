/**
 * DNAHelix.js
 * Componente 3D reutilizable: Doble hélice de ADN con volumen real,
 * esqueletos azúcar-fosfato, pares de bases nitrogenadas, enlaces de hidrógeno
 * y transformación orgánica controlada por el progreso del scroll (0.00 -> 1.00).
 */
export class DNAHelix {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isLowPower = options.isLowPower || false;
        this.basePairCount = this.isLowPower ? 24 : 38;
        this.helixRadius = 4.2;
        this.helixHeight = 32;
        this.turns = 2.6;

        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.strandNodesA = [];
        this.strandNodesB = [];
        this.rungs = [];
        this.backboneSegments = [];
        this.orbitalParticles = null;
        this.orbitalData = [];

        this.initGeometry();
    }

    initGeometry() {
        // Materiales translúcidos y luminosos de laboratorio IA
        this.matStrandA = new THREE.MeshPhysicalMaterial({
            color: 0x0ea5e9,
            emissive: 0x0284c7,
            emissiveIntensity: 0.45,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.92,
            clearcoat: 1.0,
            clearcoatRoughness: 0.15
        });

        this.matStrandB = new THREE.MeshPhysicalMaterial({
            color: 0x22d3ee,
            emissive: 0x0891b2,
            emissiveIntensity: 0.45,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.92,
            clearcoat: 1.0,
            clearcoatRoughness: 0.15
        });

        this.matBaseCyan = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.35,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.82
        });

        this.matBaseViolet = new THREE.MeshPhysicalMaterial({
            color: 0x818cf8,
            emissive: 0x4f46e5,
            emissiveIntensity: 0.35,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.82
        });

        this.matBondCenter = new THREE.MeshBasicMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.9
        });

        const nodeGeo = new THREE.SphereGeometry(0.42, this.isLowPower ? 10 : 16, this.isLowPower ? 10 : 16);
        const bondGeo = new THREE.OctahedronGeometry(0.26, 1);
        const halfRungGeo = new THREE.CylinderGeometry(0.11, 0.11, 1, this.isLowPower ? 8 : 12);
        const backboneSegGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, this.isLowPower ? 8 : 12);

        const prevPosA = new THREE.Vector3();
        const prevPosB = new THREE.Vector3();

        for (let i = 0; i < this.basePairCount; i++) {
            const t = i / (this.basePairCount - 1);
            const y = (0.5 - t) * this.helixHeight;
            const angle = t * Math.PI * 2 * this.turns;

            const posA = new THREE.Vector3(
                Math.cos(angle) * this.helixRadius,
                y,
                Math.sin(angle) * this.helixRadius
            );
            const posB = new THREE.Vector3(
                Math.cos(angle + Math.PI) * this.helixRadius,
                y,
                Math.sin(angle + Math.PI) * this.helixRadius
            );

            // Esferas de fosfato en cada hebra
            const meshA = new THREE.Mesh(nodeGeo, this.matStrandA.clone());
            meshA.position.copy(posA);
            meshA.userData = { basePos: posA.clone(), index: i, t, angle, strand: 1 };
            this.group.add(meshA);
            this.strandNodesA.push(meshA);

            const meshB = new THREE.Mesh(nodeGeo, this.matStrandB.clone());
            meshB.position.copy(posB);
            meshB.userData = { basePos: posB.clone(), index: i, t, angle: angle + Math.PI, strand: -1 };
            this.group.add(meshB);
            this.strandNodesB.push(meshB);

            // Conectores del esqueleto helicoidal (Backbone)
            if (i > 0) {
                const segA = this.createCylinderBetween(prevPosA, posA, backboneSegGeo, this.matStrandA.clone());
                segA.userData = { p1: prevPosA.clone(), p2: posA.clone(), index: i, t };
                this.group.add(segA);
                this.backboneSegments.push(segA);

                const segB = this.createCylinderBetween(prevPosB, posB, backboneSegGeo, this.matStrandB.clone());
                segB.userData = { p1: prevPosB.clone(), p2: posB.clone(), index: i, t };
                this.group.add(segB);
                this.backboneSegments.push(segB);
            }
            prevPosA.copy(posA);
            prevPosB.copy(posB);

            // Par de bases (peldaño molecular dividido en 2 bases + puente de hidrógeno central)
            const centerPos = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
            const rungGroup = new THREE.Group();
            rungGroup.position.copy(centerPos);

            const dir = new THREE.Vector3().subVectors(posB, posA);
            const fullLen = dir.length();
            const halfLen = (fullLen - 0.5) * 0.5;

            const halfA = new THREE.Mesh(
                halfRungGeo,
                (i % 2 === 0 ? this.matBaseCyan : this.matBaseViolet).clone()
            );
            halfA.scale.set(1, halfLen, 1);
            halfA.position.set(-halfLen * 0.5 - 0.15, 0, 0);
            halfA.rotation.z = Math.PI * 0.5;

            const halfB = new THREE.Mesh(
                halfRungGeo,
                (i % 2 === 0 ? this.matBaseViolet : this.matBaseCyan).clone()
            );
            halfB.scale.set(1, halfLen, 1);
            halfB.position.set(halfLen * 0.5 + 0.15, 0, 0);
            halfB.rotation.z = Math.PI * 0.5;

            const bondNode = new THREE.Mesh(bondGeo, this.matBondCenter.clone());

            rungGroup.add(halfA, halfB, bondNode);
            rungGroup.rotation.y = -angle;
            rungGroup.userData = {
                basePos: centerPos.clone(),
                baseRotY: -angle,
                index: i,
                t,
                halfA,
                halfB,
                bondNode
            };

            this.group.add(rungGroup);
            this.rungs.push(rungGroup);
        }

        // Partículas orbitales alrededor del ADN
        const orbCount = this.isLowPower ? 60 : 130;
        const orbGeo = new THREE.BufferGeometry();
        const orbPos = new Float32Array(orbCount * 3);
        for (let i = 0; i < orbCount; i++) {
            const t = Math.random();
            const r = this.helixRadius + 1.2 + Math.random() * 4.5;
            const a = Math.random() * Math.PI * 2;
            const y = (0.5 - t) * (this.helixHeight + 6);
            orbPos[i * 3] = Math.cos(a) * r;
            orbPos[i * 3 + 1] = y;
            orbPos[i * 3 + 2] = Math.sin(a) * r;
            this.orbitalData.push({ r, a, y, speed: 0.25 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2 });
        }
        orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPos, 3));
        const orbMat = new THREE.PointsMaterial({
            color: 0x38bdf8,
            size: 0.22,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.orbitalParticles = new THREE.Points(orbGeo, orbMat);
        this.group.add(this.orbitalParticles);
    }

    createCylinderBetween(p1, p2, geo, mat) {
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
        mesh.scale.set(1, len, 1);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        return mesh;
    }

    update(progress, elapsedTime) {
        // Visibilidad y transformación según puntos de control:
        // 0.00 - 0.20: Presentación del ADN
        // 0.20 - 0.45: Rotación y activación molecular
        // 0.45 - 0.65: Transformación en partículas y energía
        // 0.65 - 1.00: Desaparición orgánica completa hacia la neurona
        const deconstruct = THREE.MathUtils.smoothstep(progress, 0.42, 0.68);
        const fadeOut = 1.0 - THREE.MathUtils.smoothstep(progress, 0.56, 0.74);

        this.group.visible = fadeOut > 0.005;
        if (!this.group.visible) return;

        // Posición e inclinación global de la doble hélice
        const rotSpeed = 0.22 + THREE.MathUtils.smoothstep(progress, 0.15, 0.45) * 0.35;
        this.group.rotation.y = elapsedTime * rotSpeed + progress * Math.PI * 2.4;
        this.group.rotation.z = Math.sin(elapsedTime * 0.35) * 0.08 + THREE.MathUtils.lerp(0.18, 0.42, THREE.MathUtils.smoothstep(progress, 0.0, 0.45));
        this.group.rotation.x = Math.cos(elapsedTime * 0.28) * 0.05 + progress * 0.25;

        // Elevación progresiva conforme la energía desciende
        this.group.position.y = THREE.MathUtils.lerp(2.2, 8.5, THREE.MathUtils.smoothstep(progress, 0.0, 0.68)) + Math.sin(elapsedTime * 0.6) * 0.25;
        this.group.position.x = THREE.MathUtils.lerp(4.2, 0.0, THREE.MathUtils.smoothstep(progress, 0.0, 0.40));

        const activation = THREE.MathUtils.smoothstep(progress, 0.15, 0.45);

        // Actualizar nodos de las hebras A y B
        for (let i = 0; i < this.basePairCount; i++) {
            const nodeA = this.strandNodesA[i];
            const nodeB = this.strandNodesB[i];
            const dA = nodeA.userData;
            const dB = nodeB.userData;

            const wave = Math.sin(elapsedTime * 2.2 + dA.t * 8.0);
            const spread = 1.0 + deconstruct * (1.8 + Math.sin(i * 1.7) * 0.6);

            nodeA.position.set(
                dA.basePos.x * spread + Math.cos(dA.angle + elapsedTime) * deconstruct * 2.2,
                dA.basePos.y + wave * 0.18 - deconstruct * (dA.t * 6.0),
                dA.basePos.z * spread + Math.sin(dA.angle + elapsedTime) * deconstruct * 2.2
            );
            nodeB.position.set(
                dB.basePos.x * spread + Math.cos(dB.angle + elapsedTime) * deconstruct * 2.2,
                dB.basePos.y - wave * 0.18 - deconstruct * (dB.t * 6.0),
                dB.basePos.z * spread + Math.sin(dB.angle + elapsedTime) * deconstruct * 2.2
            );

            const pulse = 0.45 + activation * 0.55 * (0.5 + 0.5 * Math.sin(elapsedTime * 3.5 - dA.t * 10.0));
            nodeA.material.emissiveIntensity = pulse;
            nodeB.material.emissiveIntensity = pulse;
            nodeA.material.opacity = 0.92 * fadeOut;
            nodeB.material.opacity = 0.92 * fadeOut;
        }

        // Actualizar segmentos del esqueleto
        for (let i = 0; i < this.backboneSegments.length; i++) {
            const seg = this.backboneSegments[i];
            seg.material.opacity = 0.85 * (1.0 - deconstruct * 0.85) * fadeOut;
        }

        // Actualizar peldaños (pares de bases) y pulsos luminosos
        for (let i = 0; i < this.rungs.length; i++) {
            const rung = this.rungs[i];
            const ud = rung.userData;
            const localDeconstruct = THREE.MathUtils.clamp((deconstruct * 1.35) - (1.0 - ud.t) * 0.35, 0, 1);

            rung.position.y = ud.basePos.y + Math.sin(elapsedTime * 2.0 + i * 0.4) * 0.12 - localDeconstruct * 4.5;
            rung.rotation.y = ud.baseRotY + localDeconstruct * 1.4;

            // Separación de enlaces moleculares durante la transición
            const splitOffset = localDeconstruct * 3.2;
            ud.halfA.position.x = -1.85 - splitOffset;
            ud.halfB.position.x = 1.85 + splitOffset;

            const signalWave = Math.pow(0.5 + 0.5 * Math.sin(elapsedTime * 4.2 - ud.t * 12.0), 3.0);
            const emissiveBoost = 0.3 + activation * 1.1 * signalWave;

            ud.halfA.material.emissiveIntensity = emissiveBoost;
            ud.halfB.material.emissiveIntensity = emissiveBoost;
            ud.halfA.material.opacity = 0.82 * (1.0 - localDeconstruct * 0.75) * fadeOut;
            ud.halfB.material.opacity = 0.82 * (1.0 - localDeconstruct * 0.75) * fadeOut;

            const bondScale = 1.0 + activation * signalWave * 0.9 + localDeconstruct * 0.8;
            ud.bondNode.scale.setScalar(bondScale);
            ud.bondNode.material.opacity = 0.95 * fadeOut;
        }

        // Actualizar partículas orbitales
        if (this.orbitalParticles) {
            const posAttr = this.orbitalParticles.geometry.attributes.position;
            const arr = posAttr.array;
            for (let i = 0; i < this.orbitalData.length; i++) {
                const od = this.orbitalData[i];
                const curAngle = od.a + elapsedTime * od.speed;
                const curR = od.r * (1.0 + deconstruct * 1.6);
                arr[i * 3] = Math.cos(curAngle) * curR;
                arr[i * 3 + 1] = od.y + Math.sin(elapsedTime + od.phase) * 0.45 - deconstruct * 8.0;
                arr[i * 3 + 2] = Math.sin(curAngle) * curR;
            }
            posAttr.needsUpdate = true;
            this.orbitalParticles.material.opacity = 0.65 * fadeOut;
        }
    }
}
