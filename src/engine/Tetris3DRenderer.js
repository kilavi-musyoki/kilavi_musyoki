import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLS, ROWS, PIECE_COLORS } from './TetrisEngine.js';
import { getTetrisLayout } from './TetrisRenderer.js';

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (start, end, value) => {
    const t = clamp01((value - start) / (end - start));
    return t * t * (3 - 2 * t);
};

const keyForColor = (color) => String(color || '#4BD8A0').toLowerCase();

export class Tetris3DRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1200);
        this.camera.position.set(0, 0, 700);
        this.camera.lookAt(0, 0, 0);

        this.scene.add(new THREE.AmbientLight(0xdfffee, 1.5));

        const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
        keyLight.position.set(0, 350, 400);
        this.scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x57f2c0, 1.0);
        rimLight.position.set(250, 50, 300);
        this.scene.add(rimLight);
        this.rimLight = rimLight;

        this.blockGeometry = new RoundedBoxGeometry(1, 1, 0.38, 3, 0.105);
        this.blockGeometry.computeVertexNormals();
        this.materials = new Map();
        this.ghostMaterials = new Map();
        this.colors = [...new Set(Object.values(PIECE_COLORS).map(keyForColor))];

        this.locked = new Map();
        for (const color of this.colors) {
            const mesh = new THREE.InstancedMesh(
                this.blockGeometry,
                this.getMaterial(color),
                ROWS * COLS,
            );
            mesh.count = 0;
            mesh.frustumCulled = false;
            this.scene.add(mesh);
            this.locked.set(color, mesh);
        }

        this.activeMeshes = this.makePieceMeshes(16, false);
        this.ghostMeshes = this.makePieceMeshes(16, true);
        this.matrixHelper = new THREE.Object3D();
        this.clearPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({
                color: 0xbaffec,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
        );
        this.clearPlane.position.z = 12;
        this.scene.add(this.clearPlane);

        this.width = 1;
        this.height = 1;
        this.dpr = 1;
        this.lastLineCount = 0;
        this.clearStartedAt = 0;
        this.clearStrength = 0;
        this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        this.resize(1, 1, 1);
    }

    getMaterial(color) {
        const key = keyForColor(color);
        if (!this.materials.has(key)) {
            this.materials.set(key, new THREE.MeshStandardMaterial({
                color: key,
                roughness: 0.3,
                metalness: 0.12,
                emissive: key,
                emissiveIntensity: 0.13,
            }));
        }
        return this.materials.get(key);
    }

    getGhostMaterial(color) {
        const key = keyForColor(color);
        if (!this.ghostMaterials.has(key)) {
            this.ghostMaterials.set(key, new THREE.MeshStandardMaterial({
                color: key,
                roughness: 0.38,
                metalness: 0.08,
                emissive: key,
                emissiveIntensity: 0.34,
                transparent: true,
                opacity: 0.25,
                depthWrite: false,
            }));
        }
        return this.ghostMaterials.get(key);
    }

    makePieceMeshes(count, isGhost) {
        return Array.from({ length: count }, () => {
            const mesh = new THREE.Mesh(
                this.blockGeometry,
                isGhost ? this.getGhostMaterial('#4BD8A0') : this.getMaterial('#4BD8A0'),
            );
            mesh.visible = false;
            mesh.frustumCulled = false;
            this.scene.add(mesh);
            return mesh;
        });
    }

    resize(width, height, dpr = 1) {
        this.width = Math.max(1, width);
        this.height = Math.max(1, height);
        this.dpr = Math.min(Math.max(1, dpr), 1.5);
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(this.width, this.height, false);
        this.camera.left = 0;
        this.camera.right = this.width;
        this.camera.top = this.height;
        this.camera.bottom = 0;
        this.camera.position.set(0, 0, 700);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
    }

    setBlockTransform(mesh, x, y, cellSize, progress, seed, row, col, height, alpha = 1) {
        const stagger = ((row * 7 + col * 3) % 17) / 17;
        const scatter = smoothstep(0.31 + stagger * 0.035, 0.65 + stagger * 0.025, progress);
        const angle = seed * Math.PI * 2;
        const cell = cellSize;
        const driftX = Math.cos(angle) * cell * 0.34 * scatter;
        const driftY = -cell * (0.25 + Math.sin(angle * 1.7) * 0.16) * scatter;
        const centerX = x + cell / 2;
        const centerY = height - y - cell / 2;
        const xFromCenter = centerX - (this.width * 0.29);
        const z = 0.8 + scatter * cell * 1.25;
        const shrink = 1 - scatter * 0.58;

        mesh.position.set(centerX + driftX + xFromCenter * scatter * 0.045, centerY + driftY, z);
        mesh.rotation.set(
            this.reducedMotion ? -0.08 : -0.13 + scatter * (0.9 + seed * 0.28),
            this.reducedMotion ? 0.08 : 0.16 + scatter * (1.15 + seed * 0.22),
            this.reducedMotion ? 0 : (seed - 0.5) * 0.56 * scatter,
        );
        mesh.scale.set(cell * 0.91 * shrink, cell * 0.91 * shrink, cell * 0.92 * shrink);
        mesh.visible = alpha > 0.01 && scatter < 0.995;
    }

    drawPiece(meshes, piece, boardX, boardY, cellSize, height, progress, isGhost = false) {
        const color = keyForColor(piece?.color);
        const material = isGhost ? this.getGhostMaterial(color) : this.getMaterial(color);
        let meshIndex = 0;

        if (piece) {
            for (let r = 0; r < piece.shape.length; r++) {
                for (let c = 0; c < piece.shape[r].length; c++) {
                    if (!piece.shape[r][c] || meshIndex >= meshes.length) continue;
                    const row = piece.y + r;
                    const col = piece.x + c;
                    const mesh = meshes[meshIndex++];
                    mesh.material = material;
                    if (row < 2 || row >= ROWS || col < 0 || col >= COLS) {
                        mesh.visible = false;
                        continue;
                    }
                    const x = boardX + col * cellSize;
                    const y = boardY + (row - 2) * cellSize;
                    this.setBlockTransform(mesh, x, y, cellSize, progress, (row * 0.13 + col * 0.27) % 1, row, col, height, 1);
                }
            }
        }

        for (; meshIndex < meshes.length; meshIndex++) meshes[meshIndex].visible = false;
    }

    draw(engine, W, H, dpr, progress = 0, isDark = true) {
        this.rimLight.intensity = isDark ? 1.0 : 0.62;
        const layout = getTetrisLayout(W, H);
        const scale = 1 / dpr;
        const boardX = layout.boardX * scale;
        const boardY = layout.boardY * scale;
        const cellSize = layout.cellSize * scale;
        const boardW = layout.boardW * scale;
        const boardH = layout.boardH * scale;
        const height = H * scale;
        const reveal = clamp01(progress);

        if (engine.lines < this.lastLineCount) {
            this.lastLineCount = engine.lines;
        } else if (engine.lines > this.lastLineCount) {
            this.clearStartedAt = performance.now();
            this.clearStrength = Math.min(0.78, 0.3 + (engine.lines - this.lastLineCount) * 0.16);
            this.lastLineCount = engine.lines;
        }
        const clearAge = performance.now() - this.clearStartedAt;
        const clearPulse = clearAge < 240 ? this.clearStrength * (1 - clearAge / 240) : 0;
        this.clearPlane.material.opacity = clearPulse * (1 - smoothstep(0.36, 0.6, reveal));
        this.clearPlane.scale.set(boardW, Math.max(2, cellSize * 0.55), 1);
        this.clearPlane.position.set(boardX + boardW / 2, height - boardY - boardH / 2, 12);

        const isPaused = engine.state === 'paused';
        const isOverlayState = engine.state === 'menu' || engine.state === 'gameover' || engine.state === 'initials_entry';

        const instancesByColor = new Map(this.colors.map((color) => [color, []]));
        if (!isOverlayState) {
            for (let r = 2; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const value = engine.board[r][c];
                    if (!value) continue;
                    const color = keyForColor(value);
                    if (!instancesByColor.has(color)) instancesByColor.set(color, []);
                    instancesByColor.get(color).push({ row: r, col: c, color });
                }
            }
        }

        for (const [color, mesh] of this.locked) {
            if (isOverlayState) {
                mesh.count = 0;
                mesh.instanceMatrix.needsUpdate = true;
                continue;
            }
            const cells = instancesByColor.get(color) || [];
            mesh.count = 0;
            mesh.material.emissiveIntensity = isPaused ? 0.05 : 0.13 + reveal * 0.52;
            mesh.material.transparent = isPaused;
            mesh.material.opacity = isPaused ? 0.25 : 1.0;
            mesh.material.needsUpdate = true;
            for (const cell of cells) {
                this.matrixHelper.position.set(0, 0, 0);
                const x = boardX + cell.col * cellSize;
                const y = boardY + (cell.row - 2) * cellSize;
                const seed = (cell.row * 0.137 + cell.col * 0.271) % 1;
                const stagger = ((cell.row * 7 + cell.col * 3) % 17) / 17;
                const scatter = smoothstep(0.31 + stagger * 0.035, 0.65 + stagger * 0.025, reveal);
                const angle = seed * Math.PI * 2;
                const driftX = Math.cos(angle) * cellSize * 0.34 * scatter;
                const driftY = -cellSize * (0.25 + Math.sin(angle * 1.7) * 0.16) * scatter;
                const shrink = 1 - scatter * 0.58;
                const centerX = x + cellSize / 2;
                const centerY = height - y - cellSize / 2;
                const towardEdge = (centerX - this.width * 0.29) * scatter * 0.045;

                if (scatter >= 0.995) continue;
                this.matrixHelper.position.set(centerX + driftX + towardEdge, centerY + driftY, 0.8 + scatter * cellSize * 1.25);
                this.matrixHelper.rotation.set(
                    this.reducedMotion ? -0.08 : -0.13 + scatter * (0.9 + seed * 0.28),
                    this.reducedMotion ? 0.08 : 0.16 + scatter * (1.15 + seed * 0.22),
                    this.reducedMotion ? 0 : (seed - 0.5) * 0.56 * scatter,
                );
                this.matrixHelper.scale.set(cellSize * 0.91 * shrink, cellSize * 0.91 * shrink, cellSize * 0.92 * shrink);
                this.matrixHelper.updateMatrix();
                mesh.setMatrixAt(mesh.count, this.matrixHelper.matrix);
                mesh.count++;
            }
            mesh.instanceMatrix.needsUpdate = true;
        }

        if (engine.state === 'playing' || isPaused) {
            const ghostY = engine.getGhostY();
            this.drawPiece(this.ghostMeshes, { ...engine.current, y: ghostY }, boardX, boardY, cellSize, height, reveal, true);
            this.drawPiece(this.activeMeshes, engine.current, boardX, boardY, cellSize, height, reveal, false);
            if (isPaused) {
                for (const mesh of this.activeMeshes) {
                    if (mesh.visible) {
                        mesh.material.transparent = true;
                        mesh.material.opacity = 0.25;
                        mesh.material.needsUpdate = true;
                    }
                }
            } else {
                for (const mesh of this.activeMeshes) {
                    if (mesh.visible) {
                        mesh.material.transparent = false;
                        mesh.material.opacity = 1.0;
                        mesh.material.needsUpdate = true;
                    }
                }
            }
        } else {
            for (const mesh of this.activeMeshes) mesh.visible = false;
            for (const mesh of this.ghostMeshes) mesh.visible = false;
        }

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.renderer.dispose();
        this.blockGeometry.dispose();
        this.clearPlane.geometry.dispose();
        this.clearPlane.material.dispose();
        for (const mesh of this.locked.values()) mesh.material.dispose();
        for (const material of this.ghostMaterials.values()) material.dispose();
    }
}
