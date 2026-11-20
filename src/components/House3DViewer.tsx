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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize
} from 'lucide-react';
import { GeneratedHousePlan } from '../types';
import type { FacadeDirection } from '../utils/proceduralGenerator';

interface House3DViewerProps {
  plan: GeneratedHousePlan;
}

interface ProceduralTextures {
  stuccoBump: THREE.CanvasTexture;
  stoneAshlar: THREE.CanvasTexture;
  woodGrain: THREE.CanvasTexture;
  roofTiles: THREE.CanvasTexture;
  zelligeMosaic: THREE.CanvasTexture;
  paverTiles: THREE.CanvasTexture;
  lawnGrass: THREE.CanvasTexture;
}

function createProceduralTextures(
  baseWallHex: string,
  roofColorHex: string,
  style: string,
  nightMode: boolean
): ProceduralTextures {
  const makeCanvas = (w = 256, h = 256) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };

  // 1. Stucco Bump Map
  const cStucco = makeCanvas(256, 256);
  const ctxS = cStucco.getContext('2d')!;
  ctxS.fillStyle = '#808080';
  ctxS.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const v = 105 + Math.floor(Math.random() * 48);
    ctxS.fillStyle = `rgb(${v},${v},${v})`;
    ctxS.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const stuccoBump = new THREE.CanvasTexture(cStucco);
  stuccoBump.wrapS = THREE.RepeatWrapping;
  stuccoBump.wrapT = THREE.RepeatWrapping;
  stuccoBump.repeat.set(3, 2);

  // 2. Stone Ashlar / Wall Finish Map
  const cStone = makeCanvas(256, 256);
  const ctxSt = cStone.getContext('2d')!;
  ctxSt.fillStyle = baseWallHex;
  ctxSt.fillRect(0, 0, 256, 256);
  if (style === 'classic' || style === 'traditional' || style === 'luxury' || style === 'algerian') {
    ctxSt.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    ctxSt.lineWidth = 2;
    const rows = 8;
    const rowH = 256 / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctxSt.beginPath();
      ctxSt.moveTo(0, y);
      ctxSt.lineTo(256, y);
      ctxSt.stroke();
      const offset = (r % 2) * 32;
      for (let x = offset; x < 256; x += 64) {
        ctxSt.beginPath();
        ctxSt.moveTo(x, y);
        ctxSt.lineTo(x, y + rowH);
        ctxSt.stroke();
      }
    }
  } else {
    // Subtle plaster variation
    for (let i = 0; i < 900; i++) {
      ctxSt.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
      ctxSt.fillRect(Math.random() * 256, Math.random() * 256, 4, 4);
    }
  }
  const stoneAshlar = new THREE.CanvasTexture(cStone);
  stoneAshlar.wrapS = THREE.RepeatWrapping;
  stoneAshlar.wrapT = THREE.RepeatWrapping;
  stoneAshlar.repeat.set(2, 1.2);
  stoneAshlar.colorSpace = THREE.SRGBColorSpace;

  // 3. Natural Cedar / Oak Wood Planks
  const cWood = makeCanvas(256, 256);
  const ctxW = cWood.getContext('2d')!;
  ctxW.fillStyle = '#7c3f16';
  ctxW.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    ctxW.fillStyle = y % 64 === 0 ? '#8c4a1d' : '#6c3511';
    ctxW.fillRect(0, y, 256, 30);
    ctxW.fillStyle = 'rgba(20, 10, 0, 0.25)';
    ctxW.fillRect(0, y + 30, 256, 2);
    for (let g = 0; g < 18; g++) {
      ctxW.strokeStyle = 'rgba(40, 18, 4, 0.22)';
      ctxW.lineWidth = 1;
      ctxW.beginPath();
      ctxW.moveTo(0, y + Math.random() * 28);
      ctxW.lineTo(256, y + Math.random() * 28);
      ctxW.stroke();
    }
  }
  const woodGrain = new THREE.CanvasTexture(cWood);
  woodGrain.wrapS = THREE.RepeatWrapping;
  woodGrain.wrapT = THREE.RepeatWrapping;
  woodGrain.colorSpace = THREE.SRGBColorSpace;

  // 4. Scalloped Terracotta / Slate Roof Tiles
  const cRoof = makeCanvas(256, 256);
  const ctxR = cRoof.getContext('2d')!;
  ctxR.fillStyle = roofColorHex;
  ctxR.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) {
    const ry = row * 32;
    for (let col = 0; col < 8; col++) {
      const rx = col * 32;
      const grad = ctxR.createLinearGradient(rx, ry, rx + 32, ry);
      grad.addColorStop(0, 'rgba(0,0,0,0.28)');
      grad.addColorStop(0.45, 'rgba(255,255,255,0.16)');
      grad.addColorStop(1, 'rgba(0,0,0,0.32)');
      ctxR.fillStyle = grad;
      ctxR.fillRect(rx, ry, 32, 30);
      ctxR.fillStyle = 'rgba(0,0,0,0.35)';
      ctxR.fillRect(rx, ry + 30, 32, 2);
    }
  }
  const roofTiles = new THREE.CanvasTexture(cRoof);
  roofTiles.wrapS = THREE.RepeatWrapping;
  roofTiles.wrapT = THREE.RepeatWrapping;
  roofTiles.repeat.set(6, 4);
  roofTiles.colorSpace = THREE.SRGBColorSpace;

  // 5. Algerian / Andalusian Zellige Mosaic Tile Pattern
  const cZel = makeCanvas(256, 256);
  const ctxZ = cZel.getContext('2d')!;
  ctxZ.fillStyle = '#f8fafc';
  ctxZ.fillRect(0, 0, 256, 256);
  const cell = 64;
  for (let y = 0; y < 256; y += cell) {
    for (let x = 0; x < 256; x += cell) {
      ctxZ.fillStyle = '#0284c7';
      ctxZ.beginPath();
      ctxZ.moveTo(x + cell / 2, y + 4);
      ctxZ.lineTo(x + cell - 4, y + cell / 2);
      ctxZ.lineTo(x + cell / 2, y + cell - 4);
      ctxZ.lineTo(x + 4, y + cell / 2);
      ctxZ.closePath();
      ctxZ.fill();

      ctxZ.fillStyle = '#047857';
      ctxZ.fillRect(x + cell / 2 - 10, y + cell / 2 - 10, 20, 20);

      ctxZ.fillStyle = '#d97706';
      ctxZ.beginPath();
      ctxZ.arc(x + cell / 2, y + cell / 2, 5, 0, Math.PI * 2);
      ctxZ.fill();
    }
  }
  const zelligeMosaic = new THREE.CanvasTexture(cZel);
  zelligeMosaic.wrapS = THREE.RepeatWrapping;
  zelligeMosaic.wrapT = THREE.RepeatWrapping;
  zelligeMosaic.repeat.set(4, 4);
  zelligeMosaic.colorSpace = THREE.SRGBColorSpace;

  // 6. Travertine / Patio Paver Grid
  const cPav = makeCanvas(256, 256);
  const ctxP = cPav.getContext('2d')!;
  ctxP.fillStyle = nightMode ? '#334155' : '#64748b';
  ctxP.fillRect(0, 0, 256, 256);
  ctxP.strokeStyle = 'rgba(15,23,42,0.4)';
  ctxP.lineWidth = 2;
  for (let i = 0; i <= 256; i += 64) {
    ctxP.beginPath();
    ctxP.moveTo(i, 0);
    ctxP.lineTo(i, 256);
    ctxP.stroke();
    ctxP.beginPath();
    ctxP.moveTo(0, i);
    ctxP.lineTo(256, i);
    ctxP.stroke();
  }
  const paverTiles = new THREE.CanvasTexture(cPav);
  paverTiles.wrapS = THREE.RepeatWrapping;
  paverTiles.wrapT = THREE.RepeatWrapping;
  paverTiles.repeat.set(6, 6);
  paverTiles.colorSpace = THREE.SRGBColorSpace;

  // 7. Natural Grass Lawn Texture
  const cGr = makeCanvas(256, 256);
  const ctxG = cGr.getContext('2d')!;
  ctxG.fillStyle = nightMode ? '#064e3b' : '#166534';
  ctxG.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) {
    ctxG.fillStyle = i % 3 === 0 ? 'rgba(34,197,94,0.18)' : 'rgba(6,78,59,0.22)';
    ctxG.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  const lawnGrass = new THREE.CanvasTexture(cGr);
  lawnGrass.wrapS = THREE.RepeatWrapping;
  lawnGrass.wrapT = THREE.RepeatWrapping;
  lawnGrass.repeat.set(10, 10);
  lawnGrass.colorSpace = THREE.SRGBColorSpace;

  return {
    stuccoBump,
    stoneAshlar,
    woodGrain,
    roofTiles,
    zelligeMosaic,
    paverTiles,
    lawnGrass,
  };
}

export const House3DViewer: React.FC<House3DViewerProps> = ({ plan }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showRoof, setShowRoof] = useState<boolean>(true);
  const [selectedFloor3D, setSelectedFloor3D] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'realistic' | 'structural' | 'night'>('realistic');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);

  // Orbit & damped target angles
  const isDragging = useRef<boolean>(false);
  const previousPointerPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchPinchDistance = useRef<number | null>(null);
  const targetAngle = useRef<{ x: number; y: number }>({ x: Math.PI / 6, y: Math.PI / 5 });
  const currentAngle = useRef<{ x: number; y: number }>({ x: Math.PI / 6, y: Math.PI / 5 });
  const targetDistance = useRef<number>(28);
  const currentDistance = useRef<number>(28);

  const L = plan.params.length || 15;
  const W = plan.params.width || 10;
  const floorsCount = plan.params.floorsCount || 1;
  const style = plan.params.style || 'modern';
  const roofType = plan.params.roofType || 'flat';
  const hasStairs = plan.params.hasStairs || floorsCount > 1;
  const hasCourtyard =
    plan.params.hasCourtyard ||
    plan.rooms.some((r) => r.nameAr.includes('فناء') || r.nameAr.includes('وسط الدار') || r.nameAr.includes('منور'));

  const openFacadeDirections: FacadeDirection[] =
    plan.params.openFacadeDirections && plan.params.openFacadeDirections.length > 0
      ? plan.params.openFacadeDirections
      : ['front', 'left'];

  const wallHex = plan.params.facadeWallColor || (style === 'algerian' || style === 'traditional' ? '#fef3c7' : '#f8fafc');
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
    const isMobile = width < 640;
    const initialDist = isMobile ? Math.max(L, W) * 2.55 : Math.max(L, W) * 2.05;
    targetDistance.current = initialDist;
    currentDistance.current = initialDist;

    const scene = new THREE.Scene();
    const bgColor = viewMode === 'night' ? 0x050a18 : 0x0f172a;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, viewMode === 'night' ? 0.0085 : 0.0055);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.2, 400);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = viewMode === 'night' ? 1.05 : 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

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

    // Three-Point Architectural Lighting
    const ambientLight = new THREE.AmbientLight(
      viewMode === 'night' ? 0x1e293b : 0xf8fafc,
      viewMode === 'night' ? 0.42 : 0.72
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      viewMode === 'night' ? 0x60a5fa : 0xfff7ed,
      viewMode === 'night' ? 0.55 : 1.55
    );
    sunLight.position.set(28, 42, 26);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 140;
    const shadowBound = Math.max(L, W) * 1.3;
    sunLight.shadow.camera.left = -shadowBound;
    sunLight.shadow.camera.right = shadowBound;
    sunLight.shadow.camera.top = shadowBound;
    sunLight.shadow.camera.bottom = -shadowBound;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, viewMode === 'night' ? 0.42 : 0.4);
    fillLight.position.set(-25, 18, -22);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(
      viewMode === 'night' ? 0x1e3a8a : 0xe0f2fe,
      0x1e293b,
      viewMode === 'night' ? 0.35 : 0.45
    );
    scene.add(hemiLight);

    // Build Procedural Textures
    const roofTileColorStr =
      style === 'algerian'
        ? '#b91c1c'
        : style === 'andalusian'
        ? '#047857'
        : style === 'classic'
        ? '#334155'
        : style === 'mediterranean'
        ? '#c2410c'
        : '#334155';

    const tex = createProceduralTextures(wallHex, roofTileColorStr, style, viewMode === 'night');

    const houseGroup = new THREE.Group();
    houseGroupRef.current = houseGroup;
    scene.add(houseGroup);

    const cx = L / 2;
    const cz = W / 2;

    // Materials
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallHex),
      map: tex.stoneAshlar,
      bumpMap: tex.stuccoBump,
      bumpScale: style === 'modern' || style === 'minimalist' ? 0.015 : 0.045,
      roughness: style === 'luxury' ? 0.25 : 0.55,
      metalness: 0.04,
    });

    const blindPartyWallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallHex).multiplyScalar(0.88),
      bumpMap: tex.stuccoBump,
      bumpScale: 0.03,
      roughness: 0.78,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      map: accentHex.toLowerCase() === '#92400e' || accentHex.toLowerCase() === '#451a03' ? tex.woodGrain : undefined,
      roughness: accentHex.toLowerCase() === '#0f172a' ? 0.18 : 0.42,
      metalness: accentHex.toLowerCase() === '#0f172a' || accentHex.toLowerCase() === '#64748b' ? 0.65 : 0.1,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: viewMode === 'night' ? 0xfef08a : 0x0284c7,
      emissive: viewMode === 'night' ? new THREE.Color(0xf59e0b) : new THREE.Color(0x0c4a6e),
      emissiveIntensity: viewMode === 'night' ? 0.45 : 0.28,
      transparent: true,
      opacity: viewMode === 'night' ? 0.78 : 0.76,
      roughness: 0.06,
      metalness: 0.45,
      reflectivity: 0.95,
      ior: 1.5,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: style === 'algerian' || style === 'traditional' ? 0x451a03 : 0x0f172a,
      roughness: 0.28,
      metalness: style === 'algerian' || style === 'traditional' ? 0.15 : 0.85,
    });

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x6b3410,
      map: tex.woodGrain,
      roughness: 0.35,
      metalness: 0.08,
    });

    const garageDoorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75,
    });

    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      map: tex.paverTiles,
      roughness: 0.45,
    });

    // Compute ACTUAL Building Footprint Bounds from exterior walls or indoor rooms
    const extWalls = plan.walls.filter((w) => w.isExterior);
    const indoorRoomsAll = plan.rooms.filter((r) => r.category !== 'outdoor' && r.category !== 'balcony');
    let bMinX = 0;
    let bMaxX = L;
    let bMinY = 0;
    let bMaxY = W;
    if (extWalls.length > 0) {
      const xs = extWalls.flatMap((w) => [w.x1, w.x2]);
      const ys = extWalls.flatMap((w) => [w.y1, w.y2]);
      const minXw = Math.min(...xs);
      const maxXw = Math.max(...xs);
      const minYw = Math.min(...ys);
      const maxYw = Math.max(...ys);
      if (maxXw - minXw >= 3 && maxYw - minYw >= 3) {
        bMinX = minXw;
        bMaxX = maxXw;
        bMinY = minYw;
        bMaxY = maxYw;
      }
    } else if (indoorRoomsAll.length > 0) {
      bMinX = Math.max(0, Math.min(...indoorRoomsAll.map((r) => r.x)) - 0.25);
      bMaxX = Math.min(L, Math.max(...indoorRoomsAll.map((r) => r.x + r.width)) + 0.25);
      bMinY = Math.max(0, Math.min(...indoorRoomsAll.map((r) => r.y)) - 0.25);
      bMaxY = Math.min(W, Math.max(...indoorRoomsAll.map((r) => r.y + r.length)) + 0.25);
    }

    const bL = bMaxX - bMinX;
    const bW = bMaxY - bMinY;
    const frontZ = bMaxY - cz;
    const backZ = bMinY - cz;
    const leftX = bMinX - cx;
    const rightX = bMaxX - cx;
    const bCx = (leftX + rightX) / 2;
    const bCz = (backZ + frontZ) / 2;

    // Open-Facade-Aware Lot Setbacks (Zero protrusion into closed neighbor property!)
    const hasFront = openFacadeDirections.includes('front');
    const hasBack = openFacadeDirections.includes('back');
    const hasLeft = openFacadeDirections.includes('left');
    const hasRight = openFacadeDirections.includes('right');

    const poolW = Math.min(4.2, Math.max(2.6, L * 0.24));
    const poolL = Math.min(6.0, Math.max(3.6, W * 0.38));

    const marginFront = hasFront ? 3.2 : 0.18;
    const marginBack = hasBack ? 2.2 : 0.18;
    const marginLeft = hasLeft ? (showGardenDecor && plan.params.hasGarden ? poolW + 2.2 : 2.0) : 0.18;
    const marginRight = hasRight ? (!hasLeft && showGardenDecor && plan.params.hasGarden ? poolW + 2.2 : 2.0) : 0.18;

    const fenceMinX = Math.min(leftX - marginLeft, hasLeft ? -L / 2 - 1.6 : leftX - 0.18);
    const fenceMaxX = Math.max(rightX + marginRight, hasRight ? L / 2 + 1.6 : rightX + 0.18);
    const fenceMinZ = Math.min(backZ - marginBack, hasBack ? -W / 2 - 1.6 : backZ - 0.18);
    const fenceMaxZ = Math.max(frontZ + marginFront, hasFront ? W / 2 + 1.8 : frontZ + 0.18);

    const totalFenceW = fenceMaxX - fenceMinX;
    const totalFenceD = fenceMaxZ - fenceMinZ;
    const fenceCenterX = (fenceMinX + fenceMaxX) / 2;
    const fenceCenterZ = (fenceMinZ + fenceMaxZ) / 2;

    // Ground Lawn Landscape
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(L, bL) * 3 + 18, Math.max(W, bW) * 3 + 18),
      new THREE.MeshStandardMaterial({ map: tex.lawnGrass, roughness: 0.92 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.07, 0);
    groundMesh.receiveShadow = true;
    houseGroup.add(groundMesh);

    // Paved Terrace Plinth strictly inside open setbacks around building footprint
    const pMinX = leftX - (hasLeft ? 1.1 : 0.12);
    const pMaxX = rightX + (hasRight ? 1.1 : 0.12);
    const pMinZ = backZ - (hasBack ? 1.1 : 0.12);
    const pMaxZ = frontZ + (hasFront ? 1.3 : 0.12);
    const patioMesh = new THREE.Mesh(
      new THREE.BoxGeometry(pMaxX - pMinX, 0.1, pMaxZ - pMinZ),
      new THREE.MeshStandardMaterial({ map: tex.paverTiles, color: 0x94a3b8, roughness: 0.55 })
    );
    patioMesh.position.set((pMinX + pMaxX) / 2, -0.02, (pMinZ + pMaxZ) / 2);
    patioMesh.receiveShadow = true;
    houseGroup.add(patioMesh);

    // Front Street Road & Driveway (only along open front facade)
    if (hasFront) {
      const roadMesh = new THREE.Mesh(
        new THREE.BoxGeometry(totalFenceW + 10, 0.06, 4.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
      );
      roadMesh.position.set(fenceCenterX, -0.05, fenceMaxZ + 2.3);
      roadMesh.receiveShadow = true;
      houseGroup.add(roadMesh);

      if (plan.params.hasGarage) {
        const garageRm = plan.rooms.find((r) => r.floor === 0 && r.category === 'garage');
        const driveX = garageRm ? garageRm.x + garageRm.width / 2 - cx : bCx + bL * 0.28;
        const driveLen = Math.max(1.8, fenceMaxZ - frontZ);
        const drivewayMesh = new THREE.Mesh(
          new THREE.BoxGeometry(garageRm ? Math.min(3.8, garageRm.width * 0.9) : 3.4, 0.07, driveLen + 0.4),
          new THREE.MeshStandardMaterial({ map: tex.paverTiles, color: 0x475569, roughness: 0.6 })
        );
        drivewayMesh.position.set(driveX, -0.015, frontZ + driveLen / 2);
        drivewayMesh.receiveShadow = true;
        houseGroup.add(drivewayMesh);
      }
    }

    // Perimeter Boundary Fence respecting open vs neighbor party walls
    if (showFence) {
      const fenceH = 1.85;
      const fThick = 0.22;
      const fenceMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(wallHex).multiplyScalar(0.92),
        bumpMap: tex.stuccoBump,
        bumpScale: 0.03,
        roughness: 0.55,
      });
      const fenceCapMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accentHex), roughness: 0.35 });

      const addFenceSeg = (w: number, h: number, d: number, px: number, py: number, pz: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fenceMat);
        m.position.set(px, py, pz);
        m.castShadow = true;
        m.receiveShadow = true;
        houseGroup.add(m);
      };

      // Back, Left, Right fences positioned along actual setbacks
      addFenceSeg(totalFenceW, fenceH, fThick, fenceCenterX, fenceH / 2, fenceMinZ);
      addFenceSeg(fThick, fenceH, totalFenceD, fenceMinX, fenceH / 2, fenceCenterZ);
      addFenceSeg(fThick, fenceH, totalFenceD, fenceMaxX, fenceH / 2, fenceCenterZ);

      // Front fence with gate centered on front street
      const gateWidth = Math.min(3.8, totalFenceW * 0.35);
      const sideFenceW = Math.max(0.5, (totalFenceW - gateWidth) / 2);
      const fZ = fenceMaxZ;
      addFenceSeg(sideFenceW, fenceH, fThick, fenceMinX + sideFenceW / 2, fenceH / 2, fZ);
      addFenceSeg(sideFenceW, fenceH, fThick, fenceMaxX - sideFenceW / 2, fenceH / 2, fZ);

      [-gateWidth / 2, gateWidth / 2].forEach((gx) => {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.45, fenceH + 0.35, 0.45), fenceCapMat);
        pil.position.set(fenceCenterX + gx, (fenceH + 0.35) / 2, fZ);
        pil.castShadow = true;
        houseGroup.add(pil);
      });

      const gateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(gateWidth - 0.15, fenceH * 0.85, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
      );
      gateMesh.position.set(fenceCenterX, (fenceH * 0.85) / 2, fZ);
      houseGroup.add(gateMesh);
    }

    // Outdoor Pool, Fountain & Trees placed ONLY inside open garden zones
    if (showGardenDecor && plan.params.hasGarden) {
      const poolSideX = hasLeft
        ? leftX - 1.1 - poolW / 2
        : hasRight
        ? rightX + 1.1 + poolW / 2
        : null;

      if (poolSideX !== null) {
        const rimMesh = new THREE.Mesh(
          new THREE.BoxGeometry(poolW + 0.45, 0.1, poolL + 0.45),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
        );
        rimMesh.position.set(poolSideX, 0.02, bCz);
        rimMesh.receiveShadow = true;
        houseGroup.add(rimMesh);

        const poolMesh = new THREE.Mesh(
          new THREE.BoxGeometry(poolW, 0.06, poolL),
          new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            emissive: viewMode === 'night' ? new THREE.Color(0x0ea5e9) : new THREE.Color(0x000000),
            emissiveIntensity: viewMode === 'night' ? 0.5 : 0,
            roughness: 0.08,
            metalness: 0.2,
            transparent: true,
            opacity: 0.88,
          })
        );
        poolMesh.position.set(poolSideX, 0.06, bCz);
        houseGroup.add(poolMesh);

        if (style === 'andalusian' || style === 'algerian') {
          const zelligePatio = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 0.03, 3.2),
            new THREE.MeshStandardMaterial({ map: tex.zelligeMosaic, roughness: 0.25 })
          );
          zelligePatio.position.set(poolSideX, 0.02, bCz + poolL / 2 + 1.9);
          houseGroup.add(zelligePatio);

          const basin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.95, 1.05, 0.35, 8),
            new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 0.2 })
          );
          basin.position.set(poolSideX, 0.19, bCz + poolL / 2 + 1.9);
          houseGroup.add(basin);
        }
      }

      // Trees placed only in open setbacks
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, map: tex.woodGrain, roughness: 0.8 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
      const treeCoords: { x: number; z: number }[] = [];
      if (hasFront) {
        treeCoords.push({ x: bCx - bL * 0.38, z: fenceMaxZ - 1.2 });
        treeCoords.push({ x: bCx + bL * 0.38, z: fenceMaxZ - 1.2 });
      }
      if (hasLeft) treeCoords.push({ x: leftX - 1.1, z: bCz - bW * 0.36 });
      if (hasRight) treeCoords.push({ x: rightX + 1.1, z: bCz - bW * 0.32 });
      if (hasBack) treeCoords.push({ x: bCx, z: backZ - 1.2 });

      treeCoords.forEach((pos) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.5, 8), trunkMat);
        trunk.position.set(pos.x, 1.25, pos.z);
        trunk.castShadow = true;
        houseGroup.add(trunk);

        const crown1 = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.1, 8), foliageMat);
        crown1.position.set(pos.x, 2.9, pos.z);
        crown1.castShadow = true;
        houseGroup.add(crown1);

        const crown2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 8), foliageMat);
        crown2.position.set(pos.x, 3.8, pos.z);
        crown2.castShadow = true;
        houseGroup.add(crown2);
      });
    }

    const wallHeight = 3.2;

    // Helper: Build segmented exterior wall with TRUE recessed window & door openings (aligned to actual footprint bounds!)
    const buildOpenExteriorWall = (
      dir: FacadeDirection,
      floorIdx: number,
      floorY: number
    ) => {
      const thick = 0.25;
      const isHorizontal = dir === 'front' || dir === 'back';
      const wallStart = isHorizontal ? leftX : backZ;
      const wallEnd = isHorizontal ? rightX : frontZ;
      const span = wallEnd - wallStart;

      const openingsOnSide = plan.openings
        .filter((op) => {
          if (op.floor !== floorIdx) return false;
          if (op.id?.startsWith('op-int-')) return false;
          if (dir === 'front') return Math.abs(op.y - bMaxY) <= 0.95;
          if (dir === 'back') return Math.abs(op.y - bMinY) <= 0.95;
          if (dir === 'left') return Math.abs(op.x - bMinX) <= 0.95;
          return Math.abs(op.x - bMaxX) <= 0.95;
        })
        .map((op) => {
          const startPos = isHorizontal ? op.x - cx : op.y - cz;
          const clampedStart = Math.max(wallStart + 0.25, Math.min(wallEnd - Math.min(op.width, span - 0.6) - 0.25, startPos));
          return {
            ...op,
            s: clampedStart,
            e: clampedStart + Math.min(op.width, span - 0.5),
          };
        })
        .sort((a, b) => a.s - b.s);

      // Guarantee open facades NEVER appear blank if no openings matched
      if (openingsOnSide.length === 0 && span >= 3.2) {
        if (dir === 'front' && floorIdx === 0) {
          openingsOnSide.push({
            id: `synth-door-${dir}-${floorIdx}`,
            type: 'door',
            x: bMinX + 1.2,
            y: bMaxY - 0.12,
            width: 1.4,
            rotation: 0,
            label: 'المدخل الرئيسي الفاخر',
            floor: 0,
            s: wallStart + Math.min(1.2, span * 0.18),
            e: wallStart + Math.min(1.2, span * 0.18) + 1.4,
          });
        }
        const winStart = dir === 'front' && floorIdx === 0 ? wallStart + span * 0.55 : wallStart + span * 0.22;
        const winWidth = Math.min(2.1, Math.max(1.2, span * 0.22));
        openingsOnSide.push({
          id: `synth-win1-${dir}-${floorIdx}`,
          type: 'window',
          x: bMinX,
          y: bMaxY,
          width: winWidth,
          rotation: 0,
          label: 'نافذة واجهة',
          floor: floorIdx,
          s: winStart,
          e: Math.min(wallEnd - 0.35, winStart + winWidth),
        });
      }

      // Prevent overlapping opening segments along the same wall without silently dropping windows
      const cleanOps: typeof openingsOnSide = [];
      let cursor = wallStart + 0.2;
      for (const op of openingsOnSide) {
        const adjS = Math.max(op.s, cursor);
        const adjE = Math.min(op.e, wallEnd - 0.2);
        if (adjE - adjS >= 0.55) {
          cleanOps.push({ ...op, s: adjS, e: adjE });
          cursor = adjE + 0.15;
        }
      }

      const placeSegment = (posAlong: number, len: number, h: number, yCenter: number, mat: THREE.Material) => {
        if (len <= 0.04 || h <= 0.04) return;
        const geo = isHorizontal
          ? new THREE.BoxGeometry(len, h, thick)
          : new THREE.BoxGeometry(thick, h, len);
        const mesh = new THREE.Mesh(geo, mat);
        if (dir === 'front') mesh.position.set(posAlong, yCenter, frontZ - thick / 2);
        else if (dir === 'back') mesh.position.set(posAlong, yCenter, backZ + thick / 2);
        else if (dir === 'left') mesh.position.set(leftX + thick / 2, yCenter, posAlong);
        else mesh.position.set(rightX - thick / 2, yCenter, posAlong);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        houseGroup.add(mesh);
      };

      const getWorldCoord = (posAlong: number, offsetOutward: number): [number, number] => {
        if (dir === 'front') return [posAlong, frontZ - thick / 2 + offsetOutward];
        if (dir === 'back') return [posAlong, backZ + thick / 2 - offsetOutward];
        if (dir === 'left') return [leftX + thick / 2 - offsetOutward, posAlong];
        return [rightX - thick / 2 + offsetOutward, posAlong];
      };

      let wallPos = wallStart;
      for (const op of cleanOps) {
        // Solid pier before opening
        if (op.s > wallPos) {
          placeSegment((wallPos + op.s) / 2, op.s - wallPos, wallHeight, floorY + wallHeight / 2, wallMat);
        }

        const bayCenter = (op.s + op.e) / 2;
        const bayW = op.e - op.s;
        const isGarageDoor = op.type === 'door' && (op.label.includes('مرآب') || op.label.includes('كراج'));

        if (op.type === 'door') {
          const doorH = isGarageDoor ? 2.5 : 2.4;
          // Lintel header above door
          placeSegment(bayCenter, bayW, wallHeight - doorH, floorY + doorH + (wallHeight - doorH) / 2, wallMat);

          // Recessed door leaf
          const [dx, dz] = getWorldCoord(bayCenter, 0.02);
          const doorGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW - 0.12, doorH - 0.06, 0.12)
            : new THREE.BoxGeometry(0.12, doorH - 0.06, bayW - 0.12);
          const doorMesh = new THREE.Mesh(doorGeo, isGarageDoor ? garageDoorMat : doorMat);
          doorMesh.position.set(dx, floorY + doorH / 2, dz);
          doorMesh.castShadow = true;
          houseGroup.add(doorMesh);

          // Protruding Door Frame (Top lintel + Left & Right jambs)
          const [fx, fz] = getWorldCoord(bayCenter, 0.04);
          const dTopGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW + 0.08, 0.1, 0.3)
            : new THREE.BoxGeometry(0.3, 0.1, bayW + 0.08);
          const dTop = new THREE.Mesh(dTopGeo, frameMat);
          dTop.position.set(fx, floorY + doorH, fz);
          houseGroup.add(dTop);

          [-bayW / 2 + 0.04, bayW / 2 - 0.04].forEach((jOff) => {
            const [jx, jz] = getWorldCoord(bayCenter + jOff, 0.04);
            const jGeo = isHorizontal
              ? new THREE.BoxGeometry(0.09, doorH, 0.3)
              : new THREE.BoxGeometry(0.3, doorH, 0.09);
            const jamb = new THREE.Mesh(jGeo, frameMat);
            jamb.position.set(jx, floorY + doorH / 2, jz);
            houseGroup.add(jamb);
          });

          if (isGarageDoor) {
            // Horizontal sectional garage ribs
            for (let r = 0.5; r < doorH - 0.2; r += 0.55) {
              const [rx, rz] = getWorldCoord(bayCenter, 0.09);
              const ribGeo = isHorizontal
                ? new THREE.BoxGeometry(bayW - 0.16, 0.04, 0.04)
                : new THREE.BoxGeometry(0.04, 0.04, bayW - 0.16);
              const rib = new THREE.Mesh(ribGeo, frameMat);
              rib.position.set(rx, floorY + r, rz);
              houseGroup.add(rib);
            }
          } else {
            // Brass door handle & center split line + entrance steps on ground floor
            const [hx, hz] = getWorldCoord(bayCenter + (bayW > 1.1 ? 0.14 : bayW * 0.25), 0.11);
            const handle = new THREE.Mesh(
              new THREE.BoxGeometry(0.05, 0.38, 0.05),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 })
            );
            handle.position.set(hx, floorY + 1.1, hz);
            houseGroup.add(handle);

            if (floorIdx === 0) {
              // Entrance Canopy & Granite Steps
              const [cxOut, czOut] = getWorldCoord(bayCenter, 0.68);
              const canopyGeo = isHorizontal
                ? new THREE.BoxGeometry(bayW + 1.1, 0.16, 1.35)
                : new THREE.BoxGeometry(1.35, 0.16, bayW + 1.1);
              const canopy = new THREE.Mesh(canopyGeo, accentMat);
              canopy.position.set(cxOut, floorY + doorH + 0.18, czOut);
              canopy.castShadow = true;
              houseGroup.add(canopy);

              const [stX, stZ] = getWorldCoord(bayCenter, 0.55);
              const stepGeo = isHorizontal
                ? new THREE.BoxGeometry(bayW + 0.6, 0.16, 0.9)
                : new THREE.BoxGeometry(0.9, 0.16, bayW + 0.6);
              const stepMesh = new THREE.Mesh(stepGeo, slabMat);
              stepMesh.position.set(stX, 0.08, stZ);
              stepMesh.receiveShadow = true;
              houseGroup.add(stepMesh);
            }
          }
        } else {
          // Window Opening: sill below + lintel above + recessed glass + crisp protruding 4-side frame
          const sillH = 0.85;
          const winTop = 2.6;
          const winH = winTop - sillH;

          placeSegment(bayCenter, bayW, sillH, floorY + sillH / 2, wallMat);
          placeSegment(bayCenter, bayW, wallHeight - winTop, floorY + winTop + (wallHeight - winTop) / 2, wallMat);

          const [wx, wz] = getWorldCoord(bayCenter, 0.01);
          // High-contrast reflective architectural glass sheet
          const gGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW - 0.1, winH - 0.1, 0.05)
            : new THREE.BoxGeometry(0.05, winH - 0.1, bayW - 0.1);
          const gMesh = new THREE.Mesh(gGeo, glassMat);
          gMesh.position.set(wx, floorY + sillH + winH / 2, wz);
          houseGroup.add(gMesh);

          // 4-sided window perimeter frame + protruding stone sill
          const frameBarThick = 0.07;
          const [fx, fz] = getWorldCoord(bayCenter, 0.04);
          const topBarGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW + 0.06, frameBarThick, 0.28)
            : new THREE.BoxGeometry(0.28, frameBarThick, bayW + 0.06);
          const topBar = new THREE.Mesh(topBarGeo, frameMat);
          topBar.position.set(fx, floorY + winTop - frameBarThick / 2, fz);
          houseGroup.add(topBar);

          const sillGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW + 0.12, 0.08, 0.34)
            : new THREE.BoxGeometry(0.34, 0.08, bayW + 0.12);
          const botBar = new THREE.Mesh(sillGeo, accentMat);
          const [sxOut, szOut] = getWorldCoord(bayCenter, 0.06);
          botBar.position.set(sxOut, floorY + sillH, szOut);
          houseGroup.add(botBar);

          [-bayW / 2 + 0.035, bayW / 2 - 0.035].forEach((jOff) => {
            const [jx, jz] = getWorldCoord(bayCenter + jOff, 0.04);
            const sideGeo = isHorizontal
              ? new THREE.BoxGeometry(0.07, winH, 0.28)
              : new THREE.BoxGeometry(0.28, winH, 0.07);
            const sideJamb = new THREE.Mesh(sideGeo, frameMat);
            sideJamb.position.set(jx, floorY + sillH + winH / 2, jz);
            houseGroup.add(sideJamb);
          });

          // Center mullion
          const mulGeo = isHorizontal
            ? new THREE.BoxGeometry(0.06, winH, 0.14)
            : new THREE.BoxGeometry(0.14, winH, 0.06);
          const mul = new THREE.Mesh(mulGeo, frameMat);
          mul.position.set(fx, floorY + sillH + winH / 2, fz);
          houseGroup.add(mul);

          // Traditional / Andalusian Mashrabiya Lattice Louvers
          if (style === 'traditional' || style === 'andalusian') {
            const [mx, mz] = getWorldCoord(bayCenter, 0.14);
            for (let b = -2; b <= 2; b++) {
              const barGeo = new THREE.BoxGeometry(0.04, winH * 0.9, 0.04);
              const bar = new THREE.Mesh(barGeo, doorMat);
              if (isHorizontal) bar.position.set(mx + b * (bayW * 0.18), floorY + sillH + winH / 2, mz);
              else bar.position.set(mx, floorY + sillH + winH / 2, mz + b * (bayW * 0.18));
              houseGroup.add(bar);
            }
          }

          // Algerian wrought-iron grille frame on ground windows
          if (style === 'algerian' && floorIdx === 0) {
            const [gx, gz] = getWorldCoord(bayCenter, 0.13);
            for (let r = -1; r <= 1; r++) {
              const railGeo = isHorizontal
                ? new THREE.BoxGeometry(bayW * 0.9, 0.03, 0.03)
                : new THREE.BoxGeometry(0.03, 0.03, bayW * 0.9);
              const rail = new THREE.Mesh(railGeo, frameMat);
              rail.position.set(gx, floorY + sillH + winH / 2 + r * 0.42, gz);
              houseGroup.add(rail);
            }
          }
        }

        wallPos = op.e;
      }

      // Final solid wall pier
      if (wallPos < wallEnd) {
        placeSegment((wallPos + wallEnd) / 2, wallEnd - wallPos, wallHeight, floorY + wallHeight / 2, wallMat);
      }
    };

    // Render Each Floor
    for (let f = 0; f < floorsCount; f++) {
      if (selectedFloor3D !== 'all' && selectedFloor3D !== f) continue;

      const floorY = f * wallHeight;

      // Floor Concrete Slab matched to actual building footprint
      const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(bL + 0.1, 0.22, bW + 0.1), slabMat);
      slabMesh.position.set(bCx, floorY + 0.11, bCz);
      slabMesh.receiveShadow = true;
      slabMesh.castShadow = true;
      houseGroup.add(slabMesh);

      // Modern & Luxury floor slab cantilever eyebrows on open front facade
      if ((style === 'modern' || style === 'luxury' || style === 'minimalist') && hasFront && viewMode !== 'structural') {
        const browMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bL + 0.5, 0.14, 0.55),
          style === 'luxury' ? accentMat : slabMat
        );
        browMesh.position.set(bCx, floorY + wallHeight - 0.07, frontZ + 0.25);
        browMesh.castShadow = true;
        houseGroup.add(browMesh);
      }

      // Room Floor Tiles & Realistic Composite Furniture
      const roomsOnFloor = plan.rooms.filter((r) => r.floor === f);
      roomsOnFloor.forEach((rm) => {
        const rx = rm.x + rm.width / 2 - cx;
        const rz = rm.y + rm.length / 2 - cz;

        const isCourt = rm.nameAr.includes('فناء') || rm.nameAr.includes('وسط الدار') || rm.nameAr.includes('منور');
        const rTileMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(rm.color || '#3b82f6'),
          map: isCourt && (style === 'algerian' || style === 'andalusian') ? tex.zelligeMosaic : tex.paverTiles,
          roughness: 0.35,
        });
        const rTileMesh = new THREE.Mesh(new THREE.BoxGeometry(rm.width - 0.08, 0.05, rm.length - 0.08), rTileMat);
        rTileMesh.position.set(rx, floorY + 0.23, rz);
        rTileMesh.receiveShadow = true;
        houseGroup.add(rTileMesh);

        if (showFurniture && !isCourt && rm.category !== 'outdoor') {
          const furnY = floorY + 0.26;
          if (rm.category === 'living') {
            // Sofa base + backrest + pillows + coffee table
            const sofaW = Math.min(rm.width * 0.65, 2.4);
            const sofaBase = new THREE.Mesh(
              new THREE.BoxGeometry(sofaW, 0.38, 0.85),
              new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.82 })
            );
            sofaBase.position.set(rx, furnY + 0.19, rz - rm.length * 0.22);
            sofaBase.castShadow = true;
            houseGroup.add(sofaBase);

            const sofaBack = new THREE.Mesh(
              new THREE.BoxGeometry(sofaW, 0.42, 0.18),
              new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
            );
            sofaBack.position.set(rx, furnY + 0.45, rz - rm.length * 0.22 - 0.34);
            houseGroup.add(sofaBack);

            const tableMesh = new THREE.Mesh(
              new THREE.BoxGeometry(1.15, 0.34, 0.65),
              new THREE.MeshStandardMaterial({ map: tex.woodGrain, color: 0x92400e, roughness: 0.35 })
            );
            tableMesh.position.set(rx, furnY + 0.17, rz + 0.25);
            tableMesh.castShadow = true;
            houseGroup.add(tableMesh);
          } else if (rm.category === 'bedroom') {
            // Bed frame + mattress + blanket + 2 pillows + headboard
            const bedW = Math.min(rm.width * 0.65, 1.8);
            const bedMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
            const blanketMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.75 });

            const mattress = new THREE.Mesh(new THREE.BoxGeometry(bedW, 0.4, 2.0), bedMat);
            mattress.position.set(rx, furnY + 0.2, rz);
            mattress.castShadow = true;
            houseGroup.add(mattress);

            const blanket = new THREE.Mesh(new THREE.BoxGeometry(bedW + 0.04, 0.14, 1.25), blanketMat);
            blanket.position.set(rx, furnY + 0.36, rz + 0.36);
            houseGroup.add(blanket);

            const headboard = new THREE.Mesh(
              new THREE.BoxGeometry(bedW + 0.12, 0.95, 0.14),
              new THREE.MeshStandardMaterial({ map: tex.woodGrain, color: 0x451a03, roughness: 0.4 })
            );
            headboard.position.set(rx, furnY + 0.48, rz - 0.98);
            houseGroup.add(headboard);
          } else if (rm.category === 'kitchen') {
            const cW = Math.min(rm.width * 0.72, 2.8);
            const counter = new THREE.Mesh(
              new THREE.BoxGeometry(cW, 0.85, 0.65),
              new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25, metalness: 0.2 })
            );
            counter.position.set(rx, furnY + 0.425, rz - rm.length * 0.28);
            counter.castShadow = true;
            houseGroup.add(counter);

            const island = new THREE.Mesh(
              new THREE.BoxGeometry(cW * 0.65, 0.88, 0.75),
              new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 })
            );
            island.position.set(rx, furnY + 0.44, rz + 0.35);
            houseGroup.add(island);
          } else if (rm.category === 'bathroom') {
            const vanity = new THREE.Mesh(
              new THREE.BoxGeometry(Math.min(1.1, rm.width * 0.5), 0.75, 0.48),
              new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
            );
            vanity.position.set(rx - rm.width * 0.18, furnY + 0.375, rz - rm.length * 0.2);
            houseGroup.add(vanity);
          } else if (rm.category === 'garage') {
            // Detailed Car Silhouette
            const carMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.25 });
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 3.8), carMat);
            chassis.position.set(rx, furnY + 0.42, rz);
            chassis.castShadow = true;
            houseGroup.add(chassis);

            const cabin = new THREE.Mesh(
              new THREE.BoxGeometry(1.5, 0.45, 2.0),
              new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.4 })
            );
            cabin.position.set(rx, furnY + 0.9, rz - 0.1);
            houseGroup.add(cabin);
          }
        }
      });

      // 3D Staircase Flights
      if (hasStairs && f < floorsCount - 1) {
        const stairRoom =
          plan.rooms.find((r) => r.floor === f && r.category === 'hall' && r.nameAr.includes('درج')) || {
            x: L * 0.45,
            y: W * 0.35,
            width: 2.4,
            length: 3.6,
          };
        const sX = stairRoom.x + stairRoom.width / 2 - cx;
        const sZ = stairRoom.y + stairRoom.length / 2 - cz;
        const stepsCount = 12;
        const stepHeight = wallHeight / stepsCount;
        const stepDepth = (stairRoom.length * 0.8) / stepsCount;
        const stepWidth = Math.min(1.25, stairRoom.width * 0.6);

        const stepMat = new THREE.MeshStandardMaterial({ color: 0x475569, map: tex.paverTiles, roughness: 0.4 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.15 });

        for (let s = 0; s < stepsCount; s++) {
          const sMesh = new THREE.Mesh(new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth), stepMat);
          sMesh.position.set(sX, floorY + (s + 0.5) * stepHeight, sZ - stairRoom.length * 0.4 + (s + 0.5) * stepDepth);
          sMesh.castShadow = true;
          sMesh.receiveShadow = true;
          houseGroup.add(sMesh);
        }

        const railLen = Math.hypot(wallHeight, stairRoom.length * 0.8);
        const railMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, railLen, 8), railMat);
        railMesh.rotation.x = Math.atan2(stairRoom.length * 0.8, wallHeight);
        railMesh.position.set(sX + stepWidth / 2, floorY + wallHeight / 2 + 0.35, sZ);
        houseGroup.add(railMesh);
      }

      // Central Courtyard Fountain (وسط الدار)
      const courtRoom = plan.rooms.find(
        (r) => r.floor === 0 && (r.nameAr.includes('فناء') || r.nameAr.includes('وسط الدار') || r.nameAr.includes('منور'))
      );
      if (courtRoom && f === 0) {
        const crX = courtRoom.x + courtRoom.width / 2 - cx;
        const crZ = courtRoom.y + courtRoom.length / 2 - cz;
        const basin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.68, 0.85, 0.34, 8),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
        );
        basin.position.set(crX, floorY + 0.4, crZ);
        houseGroup.add(basin);

        const water = new THREE.Mesh(
          new THREE.CylinderGeometry(0.58, 0.58, 0.04, 8),
          new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, roughness: 0.08, transparent: true, opacity: 0.86 })
        );
        water.position.set(crX, floorY + 0.55, crZ);
        houseGroup.add(water);
      }

      // Build Exterior Walls Strictly Obeying openFacadeDirections & Building Footprint!
      if (viewMode !== 'structural') {
        const thick = 0.25;

        // 1. Front Wall
        if (hasFront) {
          buildOpenExteriorWall('front', f, floorY);
        } else {
          const fBlind = new THREE.Mesh(new THREE.BoxGeometry(bL, wallHeight, thick), blindPartyWallMat);
          fBlind.position.set(bCx, floorY + wallHeight / 2, frontZ - thick / 2);
          fBlind.castShadow = true;
          houseGroup.add(fBlind);
        }

        // 2. Back Wall
        if (hasBack) {
          buildOpenExteriorWall('back', f, floorY);
        } else {
          const bBlind = new THREE.Mesh(new THREE.BoxGeometry(bL, wallHeight, thick), blindPartyWallMat);
          bBlind.position.set(bCx, floorY + wallHeight / 2, backZ + thick / 2);
          bBlind.castShadow = true;
          houseGroup.add(bBlind);
        }

        // 3. Left Wall
        if (hasLeft) {
          buildOpenExteriorWall('left', f, floorY);
        } else {
          const lBlind = new THREE.Mesh(new THREE.BoxGeometry(thick, wallHeight, bW - thick * 2), blindPartyWallMat);
          lBlind.position.set(leftX + thick / 2, floorY + wallHeight / 2, bCz);
          lBlind.castShadow = true;
          houseGroup.add(lBlind);
        }

        // 4. Right Wall
        if (hasRight) {
          buildOpenExteriorWall('right', f, floorY);
        } else {
          const rBlind = new THREE.Mesh(new THREE.BoxGeometry(thick, wallHeight, bW - thick * 2), blindPartyWallMat);
          rBlind.position.set(rightX - thick / 2, floorY + wallHeight / 2, bCz);
          rBlind.castShadow = true;
          houseGroup.add(rBlind);
        }

        // Style-Specific Architectural Signature Details on Open Front Facade
        if (hasFront) {
          if (f === 0) {
            if (style === 'algerian' || style === 'andalusian') {
              // Horseshoe Arches Arcade + Zellige Frieze
              const archSpan = Math.min(1.25, bL * 0.14);
              const archXs = [bCx - archSpan * 1.1, bCx, bCx + archSpan * 1.1];
              const colMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.25 });
              const archMat = new THREE.MeshStandardMaterial({
                color: style === 'algerian' ? 0xb91c1c : 0x047857,
                roughness: 0.35,
              });
              archXs.forEach((ax) => {
                const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.3, 12), colMat);
                p1.position.set(ax - archSpan / 2, 1.15, frontZ + 0.85);
                p1.castShadow = true;
                houseGroup.add(p1);

                const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.3, 12), colMat);
                p2.position.set(ax + archSpan / 2, 1.15, frontZ + 0.85);
                p2.castShadow = true;
                houseGroup.add(p2);

                const torus = new THREE.Mesh(new THREE.TorusGeometry(archSpan / 2, 0.085, 12, 24, Math.PI), archMat);
                torus.position.set(ax, 2.3, frontZ + 0.85);
                houseGroup.add(torus);
              });

              const zelligeFrieze = new THREE.Mesh(
                new THREE.BoxGeometry(Math.min(4.2, bL * 0.55), 0.34, 0.18),
                new THREE.MeshStandardMaterial({ map: tex.zelligeMosaic, roughness: 0.25 })
              );
              zelligeFrieze.position.set(bCx, 3.0, frontZ + 0.85);
              houseGroup.add(zelligeFrieze);
            } else if (style === 'classic') {
              const classicColMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 0.18 });
              [-1.6, -0.55, 0.55, 1.6].forEach((cxPos) => {
                const col = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.75, 16), classicColMat);
                col.position.set(bCx + cxPos, 1.38, frontZ + 0.9);
                col.castShadow = true;
                houseGroup.add(col);
              });

              const pedShape = new THREE.Shape();
              pedShape.moveTo(-2.0, 0);
              pedShape.lineTo(2.0, 0);
              pedShape.lineTo(0, 0.95);
              pedShape.closePath();
              const pedMesh = new THREE.Mesh(
                new THREE.ExtrudeGeometry(pedShape, { depth: 0.28, bevelEnabled: false }),
                classicColMat
              );
              pedMesh.position.set(bCx, 2.75, frontZ + 0.78);
              pedMesh.castShadow = true;
              houseGroup.add(pedMesh);
            } else if (style === 'mediterranean') {
              for (let b = -2; b <= 2; b++) {
                const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 1.4), doorMat);
                beam.position.set(bCx + b * 0.7, 2.68, frontZ + 0.7);
                beam.castShadow = true;
                houseGroup.add(beam);
              }
            } else if (style === 'luxury') {
              const portal = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, wallHeight * floorsCount + 0.35, 0.24),
                new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.18, metalness: 0.45 })
              );
              portal.position.set(bCx - bL * 0.18, (wallHeight * floorsCount) / 2 + 0.18, frontZ + 0.08);
              portal.castShadow = true;
              houseGroup.add(portal);
            }
          }

          // Vertical Wood Louver Fins placed on corner pier (never blocking windows!)
          if (style === 'modern' || style === 'luxury') {
            for (let lv = 0; lv < 4; lv++) {
              const fin = new THREE.Mesh(new THREE.BoxGeometry(0.07, wallHeight * 0.94, 0.18), accentMat);
              fin.position.set(rightX - 0.95 + lv * 0.2, floorY + wallHeight / 2, frontZ + 0.06);
              fin.castShadow = true;
              houseGroup.add(fin);
            }
          }
        }

        // Balcony strictly placed on primary open facade (never over closed neighbor wall!)
        if (f > 0 && plan.params.hasBalcony) {
          const balDir: FacadeDirection = hasFront
            ? 'front'
            : hasLeft
            ? 'left'
            : hasRight
            ? 'right'
            : 'back';

          const balDepth = 1.4;
          const balW = (balDir === 'front' || balDir === 'back' ? bL : bW) * 0.44;
          const isHorizBal = balDir === 'front' || balDir === 'back';

          const bSlabGeo = isHorizBal
            ? new THREE.BoxGeometry(balW, 0.18, balDepth)
            : new THREE.BoxGeometry(balDepth, 0.18, balW);
          const bSlab = new THREE.Mesh(bSlabGeo, slabMat);

          const bRailGeo = isHorizBal
            ? new THREE.BoxGeometry(balW, 0.98, 0.05)
            : new THREE.BoxGeometry(0.05, 0.98, balW);
          const bRail = new THREE.Mesh(bRailGeo, glassMat);

          if (balDir === 'front') {
            bSlab.position.set(bCx, floorY + 0.09, frontZ + balDepth / 2);
            bRail.position.set(bCx, floorY + 0.62, frontZ + balDepth - 0.05);
          } else if (balDir === 'back') {
            bSlab.position.set(bCx, floorY + 0.09, backZ - balDepth / 2);
            bRail.position.set(bCx, floorY + 0.62, backZ - balDepth + 0.05);
          } else if (balDir === 'left') {
            bSlab.position.set(leftX - balDepth / 2, floorY + 0.09, bCz);
            bRail.position.set(leftX - balDepth + 0.05, floorY + 0.62, bCz);
          } else {
            bSlab.position.set(rightX + balDepth / 2, floorY + 0.09, bCz);
            bRail.position.set(rightX + balDepth - 0.05, floorY + 0.62, bCz);
          }
          bSlab.castShadow = true;
          houseGroup.add(bSlab);
          houseGroup.add(bRail);
        }
      }

      // Interior Partition Walls — FIXED ROTATION!
      const floorWalls = plan.walls.filter((w) => w.floor === f && !w.isExterior);
      const pWallMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        bumpMap: tex.stuccoBump,
        bumpScale: 0.015,
        roughness: 0.65,
      });

      floorWalls.forEach((w) => {
        const dx = w.x2 - w.x1;
        const dz = w.y2 - w.y1;
        const wlen = Math.hypot(dx, dz);
        if (wlen < 0.2) return;

        const wx = (w.x1 + w.x2) / 2 - cx;
        const wz = (w.y1 + w.y2) / 2 - cz;
        const pWall = new THREE.Mesh(
          new THREE.BoxGeometry(wlen, wallHeight * 0.92, w.thickness || 0.15),
          pWallMat
        );
        pWall.position.set(wx, floorY + wallHeight * 0.46, wz);
        pWall.rotation.y = -Math.atan2(dz, dx);
        pWall.castShadow = true;
        pWall.receiveShadow = true;
        houseGroup.add(pWall);
      });

      // Interior 3D Wooden Doors so room-to-room entries are clearly rendered inside the house
      const interiorDoors = plan.openings.filter((op) => op.floor === f && op.id?.startsWith('op-int-'));
      interiorDoors.forEach((op) => {
        const isVert = op.rotation === 90 || op.rotation === 270;
        const dx = op.x - cx + (isVert ? 0 : op.width / 2);
        const dz = op.y - cz + (isVert ? op.width / 2 : 0);
        const iDoorGeo = isVert
          ? new THREE.BoxGeometry(0.22, 2.25, op.width)
          : new THREE.BoxGeometry(op.width, 2.25, 0.22);
        const iDoor = new THREE.Mesh(iDoorGeo, doorMat);
        iDoor.position.set(dx, floorY + 1.125, dz);
        houseGroup.add(iDoor);
      });
    }

    // Structural Columns
    const colStoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.25,
    });
    const totalHeight = wallHeight * (selectedFloor3D === 'all' ? floorsCount : 1);

    plan.columns.forEach((col) => {
      const colMesh = new THREE.Mesh(
        new THREE.BoxGeometry(col.sizeX || 0.25, totalHeight, col.sizeY || 0.45),
        colStoneMat
      );
      colMesh.position.set(col.x - cx, totalHeight / 2, col.y - cz);
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      houseGroup.add(colMesh);
    });

    // Night Mode Architectural Sconce & Strip LED Lighting ONLY on Open Facades
    if (viewMode === 'night') {
      const sconceColor = new THREE.Color(lightHex);
      const sconceMat = new THREE.MeshStandardMaterial({
        color: sconceColor,
        emissive: sconceColor,
        emissiveIntensity: 1.0,
      });

      if (hasFront) {
        [bCx - bL * 0.24, bCx + bL * 0.24].forEach((lx) => {
          const pt = new THREE.PointLight(sconceColor, 2.8, 12);
          pt.position.set(lx, wallHeight * 0.82, frontZ + 0.7);
          houseGroup.add(pt);

          const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.12), sconceMat);
          sconce.position.set(lx, wallHeight * 0.82, frontZ + 0.08);
          houseGroup.add(sconce);
        });

        const ledStrip = new THREE.Mesh(
          new THREE.BoxGeometry(bL * 0.88, 0.04, 0.05),
          sconceMat
        );
        ledStrip.position.set(bCx, wallHeight * floorsCount - 0.08, frontZ + 0.12);
        houseGroup.add(ledStrip);
      }

      if (hasLeft) {
        const ptL = new THREE.PointLight(sconceColor, 2.2, 10);
        ptL.position.set(leftX - 0.7, wallHeight * 0.8, bCz);
        houseGroup.add(ptL);
      }
      if (hasRight) {
        const ptR = new THREE.PointLight(sconceColor, 2.2, 10);
        ptR.position.set(rightX + 0.7, wallHeight * 0.8, bCz);
        houseGroup.add(ptR);
      }
    }

    // Architectural Roof Rendering aligned to building footprint
    if (showRoof && selectedFloor3D === 'all') {
      const topY = wallHeight * floorsCount;

      if (
        roofType === 'sloped' ||
        style === 'algerian' ||
        style === 'andalusian' ||
        style === 'mediterranean'
      ) {
        const roofH = Math.min(3.4, Math.max(2.0, Math.min(bL, bW) * 0.3));
        const roofGeo = new THREE.ConeGeometry(Math.hypot(bL, bW) * 0.53 + 0.45, roofH, 4);
        const roofMat = new THREE.MeshStandardMaterial({
          map: tex.roofTiles,
          roughness: 0.48,
          metalness: 0.08,
        });
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(bCx, topY + roofH / 2, bCz);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.castShadow = true;
        houseGroup.add(roofMesh);

        const ridge = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.18, Math.max(bL, bW) * 0.42),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 })
        );
        ridge.position.set(bCx, topY + roofH + 0.04, bCz);
        houseGroup.add(ridge);

        if (style === 'andalusian') {
          const dome = new THREE.Mesh(
            new THREE.SphereGeometry(1.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.22, metalness: 0.15 })
          );
          dome.position.set(bCx, topY + roofH * 0.55, bCz);
          dome.castShadow = true;
          houseGroup.add(dome);

          const finial = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.08, 0.85, 8),
            new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.12 })
          );
          finial.position.set(bCx, topY + roofH * 0.55 + 1.6, bCz);
          houseGroup.add(finial);
        }
      } else {
        const roofSlab = new THREE.Mesh(
          new THREE.BoxGeometry(bL + 0.35, 0.24, bW + 0.35),
          new THREE.MeshStandardMaterial({ color: 0x334155, map: tex.paverTiles, roughness: 0.6 })
        );
        roofSlab.position.set(bCx, topY + 0.12, bCz);
        roofSlab.castShadow = true;
        houseGroup.add(roofSlab);

        const parapetH = style === 'traditional' ? 1.05 : 0.85;
        const pThick = 0.2;
        const pMat = wallMat;

        const addParapet = (w: number, d: number, px: number, pz: number) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(w, parapetH, d), pMat);
          m.position.set(px, topY + 0.24 + parapetH / 2, pz);
          m.castShadow = true;
          houseGroup.add(m);
        };
        addParapet(bL + 0.35, pThick, bCx, frontZ + 0.175 - pThick / 2);
        addParapet(bL + 0.35, pThick, bCx, backZ - 0.175 + pThick / 2);
        addParapet(pThick, bW + 0.35, leftX - 0.175 + pThick / 2, bCz);
        addParapet(pThick, bW + 0.35, rightX + 0.175 - pThick / 2, bCz);

        if (hasStairs) {
          const bhMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 3.0), wallMat);
          bhMesh.position.set(bCx + bL * 0.08, topY + 0.24 + 1.1, bCz);
          bhMesh.castShadow = true;
          houseGroup.add(bhMesh);

          const rDoor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.08), frameMat);
          rDoor.position.set(bCx + bL * 0.08, topY + 0.24 + 0.95, bCz + 1.52);
          houseGroup.add(rDoor);
        }
      }
    }

    // Damped Orbit Animation Loop
    let animationFrameId: number;
    const lookTargetY = (floorsCount * wallHeight) / 2.9;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate) {
        targetAngle.current.y += 0.0065;
      }

      // Smooth damping
      currentAngle.current.x += (targetAngle.current.x - currentAngle.current.x) * 0.14;
      currentAngle.current.y += (targetAngle.current.y - currentAngle.current.y) * 0.14;
      currentDistance.current += (targetDistance.current - currentDistance.current) * 0.16;

      const dist = currentDistance.current;
      const ax = currentAngle.current.x;
      const ay = currentAngle.current.y;

      camera.position.x = dist * Math.cos(ax) * Math.sin(ay);
      camera.position.y = dist * Math.sin(ax);
      camera.position.z = dist * Math.cos(ax) * Math.cos(ay);
      camera.lookAt(0, lookTargetY, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Mouse & Touch Orbit Controls
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

          targetAngle.current.y += deltaX * 0.008;
          targetAngle.current.x = Math.max(0.08, Math.min(Math.PI / 2 - 0.05, targetAngle.current.x + deltaY * 0.008));
          previousPointerPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2 && touchPinchDistance.current !== null) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const currentDist = Math.hypot(dx, dy);
          const delta = touchPinchDistance.current - currentDist;
          targetDistance.current = Math.max(9, Math.min(68, targetDistance.current + delta * 0.08));
          touchPinchDistance.current = currentDist;
        }
      } else {
        const mouseEv = e as MouseEvent;
        const deltaX = mouseEv.clientX - previousPointerPosition.current.x;
        const deltaY = mouseEv.clientY - previousPointerPosition.current.y;

        targetAngle.current.y += deltaX * 0.008;
        targetAngle.current.x = Math.max(0.08, Math.min(Math.PI / 2 - 0.05, targetAngle.current.x + deltaY * 0.008));
        previousPointerPosition.current = { x: mouseEv.clientX, y: mouseEv.clientY };
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      touchPinchDistance.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDistance.current = Math.max(9, Math.min(68, targetDistance.current + e.deltaY * 0.03));
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
      domElem.removeEventListener('webglcontextlost', onContextLost);
      domElem.removeEventListener('webglcontextrestored', onContextRestored);
      domElem.removeEventListener('mousedown', handlePointerDown);
      domElem.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);

      // Clean Three.js disposal
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      Object.values(tex).forEach((t) => t.dispose());

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [
    plan,
    showRoof,
    selectedFloor3D,
    viewMode,
    autoRotate,
    wallHex,
    accentHex,
    lightHex,
    openFacadeDirections,
    showFurniture,
    showFence,
    showGardenDecor,
    roofType,
    hasStairs,
    hasCourtyard,
    style,
    L,
    W,
    floorsCount
  ]);

  // Preset Camera Angles (right = +X, left = -X, front = +Z, back = -Z)
  const setCameraAngle = (preset: 'front' | 'back' | 'right' | 'left' | 'iso' | 'top') => {
    const isMobile = (containerRef.current?.clientWidth || 800) < 640;
    const distMult = isMobile ? 2.55 : 2.05;

    if (preset === 'front') {
      targetAngle.current = { x: 0.16, y: 0 };
      targetDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'back') {
      targetAngle.current = { x: 0.16, y: Math.PI };
      targetDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'right') {
      targetAngle.current = { x: 0.16, y: Math.PI / 2 };
      targetDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'left') {
      targetAngle.current = { x: 0.16, y: -Math.PI / 2 };
      targetDistance.current = Math.max(L, W) * distMult;
    } else if (preset === 'iso') {
      targetAngle.current = { x: Math.PI / 6, y: Math.PI / 5 };
      targetDistance.current = Math.max(L, W) * (distMult + 0.15);
    } else if (preset === 'top') {
      targetAngle.current = { x: Math.PI / 2 - 0.05, y: 0 };
      targetDistance.current = Math.max(L, W) * (distMult + 0.2);
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

  const handleZoomIn = () => {
    targetDistance.current = Math.max(9, targetDistance.current - 4);
  };

  const handleZoomOut = () => {
    targetDistance.current = Math.min(68, targetDistance.current + 4);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-4 w-full min-w-0 overflow-hidden">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
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

          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-800">
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setViewMode(viewMode === 'night' ? 'realistic' : 'night')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all font-bold ${
              viewMode === 'night'
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            {viewMode === 'night' ? <Moon className="w-4 h-4 text-cyan-400 animate-pulse" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{viewMode === 'night' ? 'إضاءة ليلية LED' : 'وضع نهاري'}</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'structural' ? 'realistic' : 'structural')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              viewMode === 'structural' ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>الهيكل الخرساني</span>
          </button>

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
        <div ref={containerRef} className="w-full h-[380px] sm:h-[480px] md:h-[540px] lg:h-[600px] cursor-grab active:cursor-grabbing touch-none" />

        {contextLost && (
          <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center text-xs text-amber-300 font-bold z-20">
            تمت إعادة تهيئة محرك العرض ثلاثي الأبعاد...
          </div>
        )}

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
            title="إبعاد (Zoom Out)"
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
            title="ملء الشاشة"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute top-3 right-3 max-w-[calc(100%-70px)] overflow-x-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 z-10 text-[11px] font-semibold text-slate-300">
          <span className="px-1.5 text-slate-500 hidden sm:inline shrink-0">منظور الواجهة:</span>
          <button onClick={() => setCameraAngle('front')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all shrink-0">
            أمامية
          </button>
          <button onClick={() => setCameraAngle('back')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all shrink-0">
            خلفية
          </button>
          <button onClick={() => setCameraAngle('right')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all shrink-0">
            يمين
          </button>
          <button onClick={() => setCameraAngle('left')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all shrink-0">
            يسار
          </button>
          <button onClick={() => setCameraAngle('top')} className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-all shrink-0">
            علوي
          </button>
        </div>

        <div className="absolute bottom-3 right-3 max-w-[calc(100%-24px)] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2 px-3 text-[11px] text-slate-200 flex items-center gap-2 pointer-events-none shadow-xl">
          <Rotate3D className="w-4 h-4 text-cyan-400 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
          <span className="truncate">اسحب للتدوير 360° • قرّب بالأصابع أو بعجلة الفأرة</span>
        </div>
      </div>
    </div>
  );
};
