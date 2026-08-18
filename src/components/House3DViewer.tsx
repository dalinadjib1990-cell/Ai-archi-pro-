import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Rotate3D,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Box,
  Play,
  Pause,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Trees,
  Sofa,
  Fence,
  Lamp,
  Maximize
} from 'lucide-react';
import { GeneratedHousePlan } from '../types';

interface House3DViewerProps {
  plan: GeneratedHousePlan;
}

export const House3DViewer: React.FC<House3DViewerProps> = ({ plan }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 3D Controls State
  const [showRoof, setShowRoof] = useState<boolean>(true);
  const [selectedFloor3D, setSelectedFloor3D] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'realistic' | 'structural' | 'night'>('realistic');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);

  // Pointer & Touch Orbit state
  const isDragging = useRef<boolean>(false);
  const previousPointerPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchPinchDistance = useRef<number | null>(null);
  const rotationAngle = useRef<{ x: number; y: number }>({ x: Math.PI / 6, y: Math.PI / 4 });
  const cameraDistance = useRef<number>(28);

  const L = plan.params.length || 15;
  const W = plan.params.width || 10;
  const floorsCount = plan.params.floorsCount || 1;
  const style = plan.params.style || 'modern';

  // Custom Facade Open Directions & Colors
  const openFacadeDirections = plan.params.openFacadeDirections || ['front', 'left'];
  const wallHex = plan.params.facadeWallColor || '#f8fafc';
  const accentHex = plan.params.accentColor || '#92400e';
  const lightHex = plan.params.lightingColor || '#fbbf24';

  const showFurniture = plan.params.showFurniture ?? true;
  const showFence = plan.params.showFence ?? true;
  const showGardenDecor = plan.params.showGardenDecor ?? true;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // Adjust camera distance for mobile screen ratio
    const isMobile = width < 640;
    cameraDistance.current = isMobile ? Math.max(L, W) * 2.7 : Math.max(L, W) * 2.1;

    // 1. Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(
      viewMode === 'night' ? 0x050a14 : 0x0f172a
    );
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ResizeObserver for responsive auto-fit canvas
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 420;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(
      viewMode === 'night' ? 0x1e293b : 0xffffff,
      viewMode === 'night' ? 0.35 : 0.85
    );
    scene.add(ambientLight);

    // Main Sun Directional Light
    const sunLight = new THREE.DirectionalLight(
      viewMode === 'night' ? 0x38bdf8 : 0xfffbeb,
      viewMode === 'night' ? 0.5 : 1.35
    );
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    // Soft Blue Fill Light
    const fillLight = new THREE.DirectionalLight(0x06b6d4, viewMode === 'night' ? 0.4 : 0.35);
    fillLight.position.set(-25, 20, -20);
    scene.add(fillLight);

    // Warm Hemisphere Ground Reflection
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.4);
    scene.add(hemiLight);

    // 3. Build House 3D Group
    const houseGroup = new THREE.Group();
    houseGroupRef.current = houseGroup;
    scene.add(houseGroup);

    // Center offset
    const cx = L / 2;
    const cz = W / 2;

    // Ground Lawn Landscape
    const groundGeo = new THREE.PlaneGeometry(L * 2.5 + 10, W * 2.5 + 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: viewMode === 'night' ? 0x064e3b : 0x15803d,
      roughness: 0.9,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.06, 0);
    groundMesh.receiveShadow = true;
    houseGroup.add(groundMesh);

    // Architectural Paved Terrace / Patio Slabs
    const patioGeo = new THREE.BoxGeometry(L + 2.4, 0.1, W + 2.4);
    const patioMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
    });
    const patioMesh = new THREE.Mesh(patioGeo, patioMat);
    patioMesh.position.set(0, -0.03, 0);
    patioMesh.receiveShadow = true;
    houseGroup.add(patioMesh);

    // Driveway paving leading to garage or entrance
    const drivewayGeo = new THREE.BoxGeometry(4.5, 0.08, W * 0.9);
    const drivewayMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const drivewayMesh = new THREE.Mesh(drivewayGeo, drivewayMat);
    drivewayMesh.position.set(L / 2 - 2.0, -0.02, W / 2 + (W * 0.4) / 2 + 1.0);
    drivewayMesh.receiveShadow = true;
    houseGroup.add(drivewayMesh);

    // Outer Boundary Fence Wall & Entrance Gate (سورة خارجي)
    const poolW = Math.min(4.5, Math.max(3.0, L * 0.25));
    const poolL = Math.min(6.5, Math.max(4.0, W * 0.40));
    const gardenOffsetLeft = (showGardenDecor && plan.params.hasGarden) ? (poolW + 2.6) : 2.5;
    const fenceL = L + gardenOffsetLeft * 2;
    const fenceW = W + 5.0;

    if (showFence) {
      const fenceH = 1.8;
      const fenceThickness = 0.2;

      const fenceMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(wallHex).multiplyScalar(0.9),
        roughness: 0.5,
      });

      const fencePillarMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentHex),
        roughness: 0.3,
      });

      // Back Fence Wall
      const bFence = new THREE.Mesh(
        new THREE.BoxGeometry(fenceL, fenceH, fenceThickness),
        fenceMat
      );
      bFence.position.set(0, fenceH / 2, -fenceW / 2);
      bFence.castShadow = true;
      houseGroup.add(bFence);

      // Left Fence Wall
      const lFence = new THREE.Mesh(
        new THREE.BoxGeometry(fenceThickness, fenceH, fenceW),
        fenceMat
      );
      lFence.position.set(-fenceL / 2, fenceH / 2, 0);
      lFence.castShadow = true;
      houseGroup.add(lFence);

      // Right Fence Wall
      const rFence = new THREE.Mesh(
        new THREE.BoxGeometry(fenceThickness, fenceH, fenceW),
        fenceMat
      );
      rFence.position.set(fenceL / 2, fenceH / 2, 0);
      rFence.castShadow = true;
      houseGroup.add(rFence);

      // Front Fence with Gate Opening
      const gateWidth = 3.6;
      const frontFenceSideW = (fenceL - gateWidth) / 2;

      const fFenceLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frontFenceSideW, fenceH, fenceThickness),
        fenceMat
      );
      fFenceLeft.position.set(-fenceL / 2 + frontFenceSideW / 2, fenceH / 2, fenceW / 2);
      houseGroup.add(fFenceLeft);

      const fFenceRight = new THREE.Mesh(
        new THREE.BoxGeometry(frontFenceSideW, fenceH, fenceThickness),
        fenceMat
      );
      fFenceRight.position.set(fenceL / 2 - frontFenceSideW / 2, fenceH / 2, fenceW / 2);
      houseGroup.add(fFenceRight);

      // Gate Pillars with Sconce Lights
      const pillarGeo = new THREE.BoxGeometry(0.5, fenceH + 0.3, 0.5);
      const pillar1 = new THREE.Mesh(pillarGeo, fencePillarMat);
      pillar1.position.set(-gateWidth / 2, (fenceH + 0.3) / 2, fenceW / 2);
      houseGroup.add(pillar1);

      const pillar2 = new THREE.Mesh(pillarGeo, fencePillarMat);
      pillar2.position.set(gateWidth / 2, (fenceH + 0.3) / 2, fenceW / 2);
      houseGroup.add(pillar2);

      // Metal Gate Sliding Grille
      const gateGeo = new THREE.BoxGeometry(gateWidth - 0.1, fenceH * 0.85, 0.08);
      const gateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
      const gateMesh = new THREE.Mesh(gateGeo, gateMat);
      gateMesh.position.set(0, (fenceH * 0.85) / 2, fenceW / 2);
      houseGroup.add(gateMesh);
    }

    // Swimming Pool & Outdoor Garden Decor
    if (showGardenDecor && plan.params.hasGarden) {
      const poolPosX = -L / 2 - 1.2 - poolW / 2;
      const poolGeo = new THREE.BoxGeometry(poolW, 0.05, poolL);
      const poolMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });
      const poolMesh = new THREE.Mesh(poolGeo, poolMat);
      poolMesh.position.set(poolPosX, 0.01, 0);
      houseGroup.add(poolMesh);

      // Pool Coping Rim
      const rimGeo = new THREE.BoxGeometry(poolW + 0.4, 0.08, poolL + 0.4);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.set(poolPosX, -0.01, 0);
      houseGroup.add(rimMesh);

      // Outdoor Sun Loungers / Lounge Chairs or Andalusian Fountain
      if (style === 'andalusian') {
        // Octagonal Andalusian Marble Fountain (نافورة صحن أندلسية ثمانية الأضلاع)
        const fountainX = poolPosX;
        const fountainZ = poolL / 2 + 1.2;

        const basinGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.35, 8);
        const basinMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 0.2 });
        const basinMesh = new THREE.Mesh(basinGeo, basinMat);
        basinMesh.position.set(fountainX, 0.18, fountainZ);
        houseGroup.add(basinMesh);

        // Turquoise Water Surface inside fountain
        const waterGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.05, 8);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          roughness: 0.1,
          metalness: 0.85,
          transparent: true,
          opacity: 0.85,
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(fountainX, 0.32, fountainZ);
        houseGroup.add(waterMesh);

        // Fountain Spout Pedestal Tier
        const tierGeo = new THREE.CylinderGeometry(0.5, 0.25, 0.45, 8);
        const tierMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accentHex), roughness: 0.3 });
        const tierMesh = new THREE.Mesh(tierGeo, tierMat);
        tierMesh.position.set(fountainX, 0.55, fountainZ);
        houseGroup.add(tierMesh);

        // Zellige Mosaic Tiled Surround Floor (بلاط الزليج الأندلسي)
        const zelligeGeo = new THREE.BoxGeometry(3.6, 0.02, 3.6);
        const zelligeMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3 });
        const zelligeMesh = new THREE.Mesh(zelligeGeo, zelligeMat);
        zelligeMesh.position.set(fountainX, 0.01, fountainZ);
        houseGroup.add(zelligeMesh);
      } else {
        const chairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
        for (let i = 0; i < 2; i++) {
          const chairGeo = new THREE.BoxGeometry(0.7, 0.25, 1.8);
          const chairMesh = new THREE.Mesh(chairGeo, chairMat);
          chairMesh.position.set(poolPosX - poolW / 2 + 0.5 + i * 0.9, 0.12, poolL / 2 + 0.7);
          houseGroup.add(chairMesh);
        }
      }

      // Garden Palm / Cypress Trees (safely positioned inside courtyard)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

      const treePositions = [
        { x: poolPosX, z: -poolL / 2 - 1.0 },
        { x: L / 2 + 1.2, z: -W / 2 - 1.0 },
        { x: L / 2 + 1.2, z: W / 2 + 1.0 },
      ];

      treePositions.forEach((pos) => {
        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 2.8, 8);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(pos.x, 1.4, pos.z);
        houseGroup.add(trunk);

        const foliageGeo = new THREE.ConeGeometry(0.9, 2.4, 8);
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.set(pos.x, 3.2, pos.z);
        houseGroup.add(foliage);
      });
    }

    const wallHeight = 3.2;

    // Custom Materials
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallHex),
      roughness: 0.4,
      metalness: 0.05,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      roughness: 0.35,
      metalness: 0.2,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      metalness: 0.85,
      roughness: 0.08,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x451a03, // Mahogany wood entrance
      roughness: 0.3,
    });

    // Render Each Floor
    for (let f = 0; f < floorsCount; f++) {
      if (selectedFloor3D !== 'all' && selectedFloor3D !== f) continue;

      const floorY = f * wallHeight;

      // Floor Concrete Slab
      const slabGeo = new THREE.BoxGeometry(L + 0.1, 0.22, W + 0.1);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.3,
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(0, floorY + 0.11, 0);
      slabMesh.receiveShadow = true;
      slabMesh.castShadow = true;
      houseGroup.add(slabMesh);

      // Room Floor Tiles & Furniture
      const roomsOnFloor = plan.rooms.filter((r) => r.floor === f);
      roomsOnFloor.forEach((rm) => {
        const rx = rm.x + rm.width / 2 - cx;
        const rz = rm.y + rm.length / 2 - cz;

        const rTileGeo = new THREE.BoxGeometry(rm.width - 0.08, 0.05, rm.length - 0.08);
        const rTileMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(rm.color || '#3b82f6'),
          roughness: 0.3,
        });
        const rTileMesh = new THREE.Mesh(rTileGeo, rTileMat);
        rTileMesh.position.set(rx, floorY + 0.24, rz);
        houseGroup.add(rTileMesh);

        // Render 3D Furniture inside rooms
        if (showFurniture) {
          const furnY = floorY + 0.32;

          if (rm.category === 'living') {
            // Sofa (3-seater)
            const sofaGeo = new THREE.BoxGeometry(2.2, 0.6, 0.85);
            const sofaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
            const sofaMesh = new THREE.Mesh(sofaGeo, sofaMat);
            sofaMesh.position.set(rx, furnY + 0.3, rz - rm.length / 4);
            houseGroup.add(sofaMesh);

            // Coffee Table
            const tableGeo = new THREE.BoxGeometry(1.2, 0.35, 0.7);
            const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
            const tableMesh = new THREE.Mesh(tableGeo, tableMat);
            tableMesh.position.set(rx, furnY + 0.175, rz);
            houseGroup.add(tableMesh);
          } else if (rm.category === 'bedroom') {
            // Double Bed
            const bedGeo = new THREE.BoxGeometry(1.8, 0.5, 2.0);
            const bedMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
            const bedMesh = new THREE.Mesh(bedGeo, bedMat);
            bedMesh.position.set(rx, furnY + 0.25, rz);
            houseGroup.add(bedMesh);

            // Pillow / Headboard
            const hbGeo = new THREE.BoxGeometry(1.9, 0.9, 0.2);
            const hbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
            const hbMesh = new THREE.Mesh(hbGeo, hbMat);
            hbMesh.position.set(rx, furnY + 0.45, rz - 1.0);
            houseGroup.add(hbMesh);
          } else if (rm.category === 'kitchen') {
            // L-shaped Counter
            const counterGeo = new THREE.BoxGeometry(rm.width * 0.7, 0.85, 0.7);
            const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5, roughness: 0.2 });
            const counterMesh = new THREE.Mesh(counterGeo, counterMat);
            counterMesh.position.set(rx, furnY + 0.42, rz - rm.length / 3);
            houseGroup.add(counterMesh);
          }
        }
      });

      // Exterior Walls according to openFacadeDirections!
      if (viewMode !== 'structural') {
        const thick = 0.25;

        // 1. FRONT FACADE (Z = W/2)
        const isFrontOpen = openFacadeDirections.includes('front');
        if (isFrontOpen) {
          const frontWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(L * 0.35, wallHeight, thick),
            wallMat
          );
          frontWallLeft.position.set(-L * 0.325, floorY + wallHeight / 2, W / 2 - thick / 2);
          frontWallLeft.castShadow = true;
          houseGroup.add(frontWallLeft);

          const frontWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(L * 0.35, wallHeight, thick),
            wallMat
          );
          frontWallRight.position.set(L * 0.325, floorY + wallHeight / 2, W / 2 - thick / 2);
          frontWallRight.castShadow = true;
          houseGroup.add(frontWallRight);

          // Center Front Glass Window Pane
          const winW = L * 0.3;
          const winH = wallHeight * 0.6;
          const glassPane = new THREE.Mesh(
            new THREE.BoxGeometry(winW, winH, 0.06),
            glassMat
          );
          glassPane.position.set(0, floorY + wallHeight * 0.55, W / 2 - thick / 2);
          houseGroup.add(glassPane);

          const frameMesh = new THREE.Mesh(
            new THREE.BoxGeometry(winW + 0.1, winH + 0.1, 0.12),
            frameMat
          );
          frameMesh.position.set(0, floorY + wallHeight * 0.55, W / 2 - thick / 2);
          houseGroup.add(frameMesh);

          // Double Door Entrance on ground floor
          if (f === 0) {
            const doorW = 1.4;
            const doorH = 2.4;
            const doorMesh = new THREE.Mesh(
              new THREE.BoxGeometry(doorW, doorH, 0.15),
              doorMat
            );
            doorMesh.position.set(-L * 0.15, floorY + doorH / 2, W / 2 - thick / 2 + 0.02);
            doorMesh.castShadow = true;
            houseGroup.add(doorMesh);

            const canopyGeo = new THREE.BoxGeometry(2.4, 0.15, 1.2);
            const canopyMesh = new THREE.Mesh(canopyGeo, accentMat);
            canopyMesh.position.set(-L * 0.15, floorY + doorH + 0.15, W / 2 + 0.5);
            canopyMesh.castShadow = true;
            houseGroup.add(canopyMesh);

            // Style-Specific Architectural Entrance Accents
            if (style === 'andalusian') {
              // 1. Andalusian Islamic Horseshoe Arches Arcade (أروقة بأقواس أندلسية إسلامية)
              const archSpan = 1.2;
              const archXs = [-1.5, 0, 1.5];
              const pillarMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.2 });
              const archTopMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accentHex), roughness: 0.3 });

              archXs.forEach((ax) => {
                const pGeo = new THREE.CylinderGeometry(0.09, 0.11, doorH, 12);
                const p1 = new THREE.Mesh(pGeo, pillarMat);
                p1.position.set(ax - archSpan / 2, doorH / 2, W / 2 + 0.95);
                houseGroup.add(p1);

                const p2 = new THREE.Mesh(pGeo, pillarMat);
                p2.position.set(ax + archSpan / 2, doorH / 2, W / 2 + 0.95);
                houseGroup.add(p2);

                const archTorus = new THREE.Mesh(
                  new THREE.TorusGeometry(archSpan / 2, 0.08, 12, 24, Math.PI),
                  archTopMat
                );
                archTorus.position.set(ax, doorH, W / 2 + 0.95);
                houseGroup.add(archTorus);
              });

              // 2. Andalusian Mashrabiya Lattice Panel over front window
              const mashrabiyaMesh = new THREE.Mesh(
                new THREE.BoxGeometry(winW * 0.85, winH * 0.85, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
              );
              mashrabiyaMesh.position.set(0, floorY + wallHeight * 0.55, W / 2 + 0.03);
              houseGroup.add(mashrabiyaMesh);
            } else if (style === 'classic') {
              // Classic Corinthian Entrance Columns & Triangular Pediment
              const colXs = [-1.8, -0.6, 0.6, 1.8];
              const classicColMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 0.15 });
              colXs.forEach((cxPos) => {
                const colGeo = new THREE.CylinderGeometry(0.14, 0.18, doorH + 0.4, 16);
                const colMesh = new THREE.Mesh(colGeo, classicColMat);
                colMesh.position.set(cxPos, (doorH + 0.4) / 2, W / 2 + 1.0);
                colMesh.castShadow = true;
                houseGroup.add(colMesh);
              });

              // Triangular Pediment Gable Top
              const pedimentShape = new THREE.Shape();
              pedimentShape.moveTo(-2.2, 0);
              pedimentShape.lineTo(2.2, 0);
              pedimentShape.lineTo(0, 1.1);
              pedimentShape.closePath();

              const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, { depth: 0.25, bevelEnabled: false });
              const pedimentMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.2 });
              const pedimentMesh = new THREE.Mesh(pedimentGeo, pedimentMat);
              pedimentMesh.position.set(0, doorH + 0.35, W / 2 + 0.85);
              houseGroup.add(pedimentMesh);
            } else if (style === 'mediterranean') {
              // Mediterranean Pergola Beams
              const pergolaMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
              for (let b = -2; b <= 2; b++) {
                const beamMesh = new THREE.Mesh(
                  new THREE.BoxGeometry(0.12, 0.15, 1.6),
                  pergolaMat
                );
                beamMesh.position.set(b * 0.7, doorH + 0.25, W / 2 + 0.8);
                houseGroup.add(beamMesh);
              }
            }
          }
        } else {
          // Closed Front Wall (Solid Blind Wall)
          const fSolid = new THREE.Mesh(
            new THREE.BoxGeometry(L, wallHeight, thick),
            wallMat
          );
          fSolid.position.set(0, floorY + wallHeight / 2, W / 2 - thick / 2);
          fSolid.castShadow = true;
          houseGroup.add(fSolid);
        }

        // 2. BACK FACADE (Z = -W/2)
        const isBackOpen = openFacadeDirections.includes('back');
        if (isBackOpen) {
          const bWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(L * 0.35, wallHeight, thick),
            wallMat
          );
          bWallLeft.position.set(-L * 0.325, floorY + wallHeight / 2, -W / 2 + thick / 2);
          houseGroup.add(bWallLeft);

          const bWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(L * 0.35, wallHeight, thick),
            wallMat
          );
          bWallRight.position.set(L * 0.325, floorY + wallHeight / 2, -W / 2 + thick / 2);
          houseGroup.add(bWallRight);

          // Back Patio Glass Sliding Doors
          const bGlass = new THREE.Mesh(
            new THREE.BoxGeometry(L * 0.3, wallHeight * 0.7, 0.06),
            glassMat
          );
          bGlass.position.set(0, floorY + wallHeight * 0.45, -W / 2 + thick / 2);
          houseGroup.add(bGlass);
        } else {
          // Solid Back Wall
          const bSolid = new THREE.Mesh(
            new THREE.BoxGeometry(L, wallHeight, thick),
            wallMat
          );
          bSolid.position.set(0, floorY + wallHeight / 2, -W / 2 + thick / 2);
          bSolid.castShadow = true;
          houseGroup.add(bSolid);
        }

        // 3. LEFT FACADE (X = -L/2)
        const isLeftOpen = openFacadeDirections.includes('left');
        if (isLeftOpen) {
          const lWall = new THREE.Mesh(
            new THREE.BoxGeometry(thick, wallHeight, W - thick * 2),
            wallMat
          );
          lWall.position.set(-L / 2 + thick / 2, floorY + wallHeight / 2, 0);
          lWall.castShadow = true;
          houseGroup.add(lWall);

          // Side Window Glass
          const lGlass = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, wallHeight * 0.5, W * 0.35),
            glassMat
          );
          lGlass.position.set(-L / 2 + thick / 2, floorY + wallHeight * 0.55, 0);
          houseGroup.add(lGlass);
        } else {
          // Solid Left Wall
          const lSolid = new THREE.Mesh(
            new THREE.BoxGeometry(thick, wallHeight, W - thick * 2),
            wallMat
          );
          lSolid.position.set(-L / 2 + thick / 2, floorY + wallHeight / 2, 0);
          lSolid.castShadow = true;
          houseGroup.add(lSolid);
        }

        // 4. RIGHT FACADE (X = L/2)
        const isRightOpen = openFacadeDirections.includes('right');
        if (isRightOpen) {
          const rWall = new THREE.Mesh(
            new THREE.BoxGeometry(thick, wallHeight, W - thick * 2),
            wallMat
          );
          rWall.position.set(L / 2 - thick / 2, floorY + wallHeight / 2, 0);
          rWall.castShadow = true;
          houseGroup.add(rWall);

          // Side Window Glass
          const rGlass = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, wallHeight * 0.5, W * 0.35),
            glassMat
          );
          rGlass.position.set(L / 2 - thick / 2, floorY + wallHeight * 0.55, 0);
          houseGroup.add(rGlass);
        } else {
          // Solid Right Wall
          const rSolid = new THREE.Mesh(
            new THREE.BoxGeometry(thick, wallHeight, W - thick * 2),
            wallMat
          );
          rSolid.position.set(L / 2 - thick / 2, floorY + wallHeight / 2, 0);
          rSolid.castShadow = true;
          houseGroup.add(rSolid);
        }

        // Decorative Wood/Marble Accent Cladding Panel on Front
        if (isFrontOpen) {
          const accentPanelGeo = new THREE.BoxGeometry(L * 0.22, wallHeight, 0.08);
          const accentPanel = new THREE.Mesh(accentPanelGeo, accentMat);
          accentPanel.position.set(L * 0.38, floorY + wallHeight / 2, W / 2 + 0.02);
          accentPanel.castShadow = true;
          houseGroup.add(accentPanel);
        }

        // Balcony & Glass Railings if checked
        if (f > 0 && plan.params.hasBalcony) {
          const balDepth = 1.6;
          const balWidth = L * 0.5;
          const balSlabGeo = new THREE.BoxGeometry(balWidth, 0.18, balDepth);
          const balSlab = new THREE.Mesh(balSlabGeo, slabMat);
          balSlab.position.set(0, floorY + 0.09, W / 2 + balDepth / 2);
          balSlab.castShadow = true;
          houseGroup.add(balSlab);

          const railGeo = new THREE.BoxGeometry(balWidth, 1.0, 0.05);
          const railMesh = new THREE.Mesh(railGeo, glassMat);
          railMesh.position.set(0, floorY + 0.6, W / 2 + balDepth - 0.05);
          houseGroup.add(railMesh);
        }
      }

      // Interior Partition Walls
      const floorWalls = plan.walls.filter((w) => w.floor === f && !w.isExterior);
      floorWalls.forEach((w) => {
        const wx = (w.x1 + w.x2) / 2 - cx;
        const wz = (w.y1 + w.y2) / 2 - cz;
        const wlen = Math.hypot(w.x2 - w.x1, w.y2 - w.y1) || 1;

        const pWallGeo = new THREE.BoxGeometry(w.thickness || 0.15, wallHeight * 0.92, wlen);
        const pWallMat = new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          roughness: 0.6,
        });
        const pWall = new THREE.Mesh(pWallGeo, pWallMat);
        pWall.position.set(wx, floorY + wallHeight / 2, wz);
        pWall.castShadow = true;
        houseGroup.add(pWall);
      });
    }

    // Concrete Architectural Columns (الأعمدة الإنشائية)
    const colStoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.3,
    });

    const totalHeight = wallHeight * (selectedFloor3D === 'all' ? floorsCount : 1);

    plan.columns.forEach((col) => {
      const colX = col.x - cx;
      const colZ = col.y - cz;
      const colW = col.sizeX || 0.25;
      const colD = col.sizeY || 0.45;

      const colGeo = new THREE.BoxGeometry(colW, totalHeight, colD);
      const colMesh = new THREE.Mesh(colGeo, colStoneMat);
      colMesh.position.set(colX, totalHeight / 2, colZ);
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      houseGroup.add(colMesh);
    });

    // Night Mode Sconce Spotlights with custom lightHex
    if (viewMode === 'night') {
      const sconceColor = new THREE.Color(lightHex);
      const spotLight1 = new THREE.PointLight(sconceColor, 3.0, 14);
      spotLight1.position.set(-L * 0.2, wallHeight * 0.8, W / 2 + 0.8);
      houseGroup.add(spotLight1);

      const spotLight2 = new THREE.PointLight(sconceColor, 3.0, 14);
      spotLight2.position.set(L * 0.2, wallHeight * 0.8, W / 2 + 0.8);
      houseGroup.add(spotLight2);

      const sconceGeo = new THREE.BoxGeometry(0.12, 0.3, 0.12);
      const sconceMat = new THREE.MeshStandardMaterial({ color: sconceColor, emissive: sconceColor, emissiveIntensity: 0.9 });
      const sconce1 = new THREE.Mesh(sconceGeo, sconceMat);
      sconce1.position.set(-L * 0.2, wallHeight * 0.8, W / 2 + 0.15);
      houseGroup.add(sconce1);

      const sconce2 = new THREE.Mesh(sconceGeo, sconceMat);
      sconce2.position.set(L * 0.2, wallHeight * 0.8, W / 2 + 0.15);
      houseGroup.add(sconce2);
    }

    // Render Roof
    if (showRoof && selectedFloor3D === 'all') {
      const topY = wallHeight * floorsCount;

      if (style === 'andalusian') {
        // Andalusian Emerald Green / Terracotta Sloped Roof
        const roofGeo = new THREE.ConeGeometry(Math.max(L, W) * 0.75, 2.6, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3 }); // Emerald Green
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(0, topY + 1.3, 0);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.castShadow = true;
        houseGroup.add(roofMesh);

        // Islamic Central Dome (Qubba - قبة إسلامية)
        const domeGeo = new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.2 });
        const domeMesh = new THREE.Mesh(domeGeo, domeMat);
        domeMesh.position.set(0, topY + 1.35, 0);
        domeMesh.castShadow = true;
        houseGroup.add(domeMesh);

        // Gold Crescent Finial on top of Dome (هلال القبة الذهبي)
        const finialGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.9, 8);
        const finialMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.1 });
        const finialMesh = new THREE.Mesh(finialGeo, finialMat);
        finialMesh.position.set(0, topY + 3.0, 0);
        houseGroup.add(finialMesh);
      } else if (style === 'classic') {
        // Classic Burgundy Slate Red Gable Roof
        const roofGeo = new THREE.ConeGeometry(Math.max(L, W) * 0.78, 2.8, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.35 });
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(0, topY + 1.4, 0);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.castShadow = true;
        houseGroup.add(roofMesh);
      } else if (style === 'mediterranean') {
        // Mediterranean Spanish Red Terracotta Curved Roof
        const roofGeo = new THREE.ConeGeometry(Math.max(L, W) * 0.76, 2.5, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.5 });
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(0, topY + 1.25, 0);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.castShadow = true;
        houseGroup.add(roofMesh);
      } else {
        // Modern / Minimalist Flat Parapet Roof with Floating Overhang
        const roofGeo = new THREE.BoxGeometry(L + 0.5, 0.28, W + 0.5);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(0, topY + 0.14, 0);
        roofMesh.castShadow = true;
        houseGroup.add(roofMesh);
      }
    }

    // 4. Animation & Camera Loop
    let animationFrameId: number;

    const updateCameraPosition = () => {
      if (!cameraRef.current) return;
      const dist = cameraDistance.current;
      const ax = rotationAngle.current.x;
      const ay = rotationAngle.current.y;

      cameraRef.current.position.x = dist * Math.cos(ax) * Math.sin(ay);
      cameraRef.current.position.y = dist * Math.sin(ax);
      cameraRef.current.position.z = dist * Math.cos(ax) * Math.cos(ay);
      cameraRef.current.lookAt(0, (floorsCount * wallHeight) / 2.8, 0);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && houseGroupRef.current) {
        rotationAngle.current.y += 0.007;
      }

      updateCameraPosition();
      renderer.render(scene, camera);
    };

    animate();

    // 5. Mouse & Touch Drag / Pinch Zoom Handlers (للهاتف باليد والتقريب)
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      if ('touches' in e) {
        if (e.touches.length === 1) {
          previousPointerPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          touchPinchDistance.current = Math.hypot(dx, dy);
        }
      } else {
        previousPointerPosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;

      if ('touches' in e) {
        if (e.touches.length === 1) {
          const deltaX = e.touches[0].clientX - previousPointerPosition.current.x;
          const deltaY = e.touches[0].clientY - previousPointerPosition.current.y;

          rotationAngle.current.y += deltaX * 0.008;
          rotationAngle.current.x = Math.max(
            0.1,
            Math.min(Math.PI / 2 - 0.05, rotationAngle.current.x + deltaY * 0.008)
          );

          previousPointerPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2 && touchPinchDistance.current !== null) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const currentDist = Math.hypot(dx, dy);
          const delta = touchPinchDistance.current - currentDist;

          cameraDistance.current = Math.max(10, Math.min(60, cameraDistance.current + delta * 0.08));
          touchPinchDistance.current = currentDist;
        }
      } else {
        const mouseEv = e as MouseEvent;
        const deltaX = mouseEv.clientX - previousPointerPosition.current.x;
        const deltaY = mouseEv.clientY - previousPointerPosition.current.y;

        rotationAngle.current.y += deltaX * 0.008;
        rotationAngle.current.x = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.05, rotationAngle.current.x + deltaY * 0.008)
        );

        previousPointerPosition.current = { x: mouseEv.clientX, y: mouseEv.clientY };
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      touchPinchDistance.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance.current = Math.max(10, Math.min(60, cameraDistance.current + e.deltaY * 0.03));
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handlePointerDown);
    domElem.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElem.removeEventListener('mousedown', handlePointerDown);
      domElem.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [plan, showRoof, selectedFloor3D, viewMode, autoRotate, wallHex, accentHex, lightHex, openFacadeDirections, showFurniture, showFence, showGardenDecor]);

  // Preset Camera Angles
  const setCameraAngle = (preset: 'front' | 'back' | 'right' | 'left' | 'iso' | 'top') => {
    const isMobile = (containerRef.current?.clientWidth || 800) < 640;
    const distMult = isMobile ? 2.7 : 2.1;

    if (preset === 'front') {
      rotationAngle.current = { x: 0.15, y: 0 };
      cameraDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'back') {
      rotationAngle.current = { x: 0.15, y: Math.PI };
      cameraDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'right') {
      rotationAngle.current = { x: 0.15, y: -Math.PI / 2 };
      cameraDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'left') {
      rotationAngle.current = { x: 0.15, y: Math.PI / 2 };
      cameraDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'iso') {
      rotationAngle.current = { x: Math.PI / 6, y: Math.PI / 4 };
      cameraDistance.current = Math.max(L, W) * (distMult + 0.2);
    } else if (preset === 'top') {
      rotationAngle.current = { x: Math.PI / 2 - 0.05, y: 0 };
      cameraDistance.current = Math.max(L, W) * (distMult + 0.2);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  // Zoom Actions for Touch / On-screen Buttons
  const handleZoomIn = () => {
    cameraDistance.current = Math.max(10, cameraDistance.current - 4);
  };

  const handleZoomOut = () => {
    cameraDistance.current = Math.min(65, cameraDistance.current + 4);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Control Bar: View Modes, Roof Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Roof & Floor Isolation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRoof(!showRoof)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showRoof
                ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
          >
            {showRoof ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showRoof ? 'السقف (ظاهر)' : 'السقف (مخفي لكشف الداخل)'}</span>
          </button>

          {/* Floors Isolation */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-800">
            <button
              onClick={() => setSelectedFloor3D('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${selectedFloor3D === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              كامل الفيلا
            </button>
            {Array.from({ length: floorsCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFloor3D(idx)}
                className={`px-2 py-1 rounded-lg transition-all ${selectedFloor3D === idx ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                {idx === 0 ? 'الطابق الأرضي' : `طابق ${idx}`}
              </button>
            ))}
          </div>
        </div>

        {/* View Controls & Night Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {/* Night Mode */}
          <button
            onClick={() => setViewMode(viewMode === 'night' ? 'realistic' : 'night')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all font-bold ${
              viewMode === 'night'
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
            title="تبديل وضع الإضاءة الليلية وإضاءات السور والواجهة"
          >
            {viewMode === 'night' ? <Moon className="w-4 h-4 text-cyan-400 animate-pulse" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{viewMode === 'night' ? 'إضاءة ليلية LED' : 'وضع نهاري'}</span>
          </button>

          {/* Structural Mode */}
          <button
            onClick={() => setViewMode(viewMode === 'structural' ? 'realistic' : 'structural')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              viewMode === 'structural' ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>الهيكل الخرساني</span>
          </button>

          {/* Auto Rotate */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              autoRotate ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
            <span>تدوير 360°</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
        <div ref={containerRef} className="w-full h-[380px] sm:h-[480px] md:h-[540px] lg:h-[580px] cursor-grab active:cursor-grabbing touch-none" />

        {/* Touch Zooming & View Control Floating Panel (للهاتف باليد) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-2xl z-10">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-all active:scale-90"
            title="تقريب (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-all active:scale-90"
            title="توزيع (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCameraAngle('iso')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-90"
            title="إعادة المنظور الرئيسي"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-all active:scale-90"
            title="عرض العرض بالكامل (Fullscreen)"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Quick Directions Bar */}
        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 z-10 text-[11px] font-semibold text-slate-300">
          <span className="px-1.5 text-slate-500 hidden sm:inline">منظور الواجهة:</span>
          <button onClick={() => setCameraAngle('front')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all">
            أمامية
          </button>
          <button onClick={() => setCameraAngle('back')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all">
            خلفية
          </button>
          <button onClick={() => setCameraAngle('right')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all">
            يمين
          </button>
          <button onClick={() => setCameraAngle('left')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all">
            يسار
          </button>
          <button onClick={() => setCameraAngle('top')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all">
            علوي
          </button>
        </div>

        {/* Bottom Overlay Info Badge */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2 px-3 text-[11px] text-slate-200 flex items-center gap-2 pointer-events-none shadow-xl">
          <Rotate3D className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>اسحب بيدك/باللمس لتدوير المنزل 360° وقرّب بالأصابع (Pinch Zoom)</span>
        </div>
      </div>
    </div>
  );
};
