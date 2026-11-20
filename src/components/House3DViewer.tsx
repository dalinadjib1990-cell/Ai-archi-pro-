import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
  Maximize,
  Footprints,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  AppLanguage,
  CameraPresetMode,
  DEFAULT_LAYERS,
  GeneratedHousePlan,
  LayerKey,
  LayerVisibilityMap,
} from '../types';
import type { FacadeDirection } from '../utils/proceduralGenerator';
import { deriveStructuralElements } from '../utils/cadGeometry';
import { buildFurnitureMeshGroup } from '../utils/furniture3DMeshes';
import { pickText } from '../utils/i18n';

interface House3DViewerProps {
  plan: GeneratedHousePlan;
  layers?: LayerVisibilityMap;
  explodedAmount?: number; // 0 to 1
  onExplodedChange?: (val: number) => void;
  viewModeExternal?: 'realistic' | 'structural' | 'night';
  onViewModeChange?: (mode: 'realistic' | 'structural' | 'night') => void;
  language?: AppLanguage;
  selectedRoomId?: string | null;
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

  const cStucco = makeCanvas(256, 256);
  const ctxS = cStucco.getContext('2d')!;
  ctxS.fillStyle = '#808080';
  ctxS.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const v = 105 + Math.floor(Math.random() * 48);
    ctxS.fillStyle = `rgb(${v},${v},${v})`;
    ctxS.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const stuccoBump = new THREE.CanvasTexture(cStucco);
  stuccoBump.wrapS = THREE.RepeatWrapping;
  stuccoBump.wrapT = THREE.RepeatWrapping;
  stuccoBump.repeat.set(3, 2);

  const cStone = makeCanvas(256, 256);
  const ctxSt = cStone.getContext('2d')!;
  ctxSt.fillStyle = baseWallHex;
  ctxSt.fillRect(0, 0, 256, 256);
  if (style === 'classic' || style === 'traditional' || style === 'luxury' || style === 'algerian' || style === 'mediterranean') {
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
    for (let i = 0; i < 700; i++) {
      ctxSt.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
      ctxSt.fillRect(Math.random() * 256, Math.random() * 256, 4, 4);
    }
  }
  const stoneAshlar = new THREE.CanvasTexture(cStone);
  stoneAshlar.wrapS = THREE.RepeatWrapping;
  stoneAshlar.wrapT = THREE.RepeatWrapping;
  stoneAshlar.repeat.set(2, 1.2);
  stoneAshlar.colorSpace = THREE.SRGBColorSpace;

  const cWood = makeCanvas(256, 256);
  const ctxW = cWood.getContext('2d')!;
  ctxW.fillStyle = '#7c3f16';
  ctxW.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    ctxW.fillStyle = y % 64 === 0 ? '#8c4a1d' : '#6c3511';
    ctxW.fillRect(0, y, 256, 30);
    ctxW.fillStyle = 'rgba(20, 10, 0, 0.25)';
    ctxW.fillRect(0, y + 30, 256, 2);
  }
  const woodGrain = new THREE.CanvasTexture(cWood);
  woodGrain.wrapS = THREE.RepeatWrapping;
  woodGrain.wrapT = THREE.RepeatWrapping;
  woodGrain.colorSpace = THREE.SRGBColorSpace;

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

  const cGr = makeCanvas(256, 256);
  const ctxG = cGr.getContext('2d')!;
  ctxG.fillStyle = nightMode ? '#064e3b' : '#166534';
  ctxG.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
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

function disposeGroupContents(root: THREE.Object3D) {
  const children = [...root.children];
  children.forEach((child) => {
    child.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      }
    });
    root.remove(child);
  });
}

export const House3DViewer: React.FC<House3DViewerProps> = ({
  plan,
  layers = DEFAULT_LAYERS,
  explodedAmount = 0,
  onExplodedChange,
  viewModeExternal,
  onViewModeChange,
  language = 'ar',
  selectedRoomId = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showRoof, setShowRoof] = useState<boolean>(true);
  const [selectedFloor3D, setSelectedFloor3D] = useState<number | 'all'>('all');
  const [internalViewMode, setInternalViewMode] = useState<'realistic' | 'structural' | 'night'>('realistic');
  const viewMode = viewModeExternal ?? internalViewMode;
  const setViewMode = (m: 'realistic' | 'structural' | 'night') => {
    setInternalViewMode(m);
    onViewModeChange?.(m);
  };

  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<CameraPresetMode>('iso');
  const [internalExploded, setInternalExploded] = useState<number>(explodedAmount);
  const activeExploded = onExplodedChange ? explodedAmount : internalExploded;
  const setActiveExploded = (val: number) => {
    setInternalExploded(val);
    onExplodedChange?.(val);
  };

  const [contextLost, setContextLost] = useState<boolean>(false);

  // Persistent Three.js refs (WebGLRenderer + Scene + Camera + Lights NEVER recreated on minor prop updates)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    sun: THREE.DirectionalLight;
    fill: THREE.DirectionalLight;
    hemi: THREE.HemisphereLight;
  } | null>(null);
  const texturesRef = useRef<ProceduralTextures | null>(null);

  // Live animation refs read inside RAF without triggering WebGL re-init
  const autoRotateRef = useRef<boolean>(autoRotate);
  autoRotateRef.current = autoRotate;
  const cameraModeRef = useRef<CameraPresetMode>(cameraMode);
  cameraModeRef.current = cameraMode;
  const explodedRef = useRef<number>(activeExploded);
  explodedRef.current = activeExploded;
  const showRoofRef = useRef<boolean>(showRoof);
  showRoofRef.current = showRoof;
  const layersRef = useRef<LayerVisibilityMap>(layers);
  layersRef.current = layers;

  // Orbit state
  const isDragging = useRef<boolean>(false);
  const previousPointerPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchPinchDistance = useRef<number | null>(null);
  const targetAngle = useRef<{ x: number; y: number }>({ x: Math.PI / 6, y: Math.PI / 5 });
  const currentAngle = useRef<{ x: number; y: number }>({ x: Math.PI / 6, y: Math.PI / 5 });
  const targetDistance = useRef<number>(28);
  const currentDistance = useRef<number>(28);
  const lookTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, 0));

  // Walk mode state (eye-level position & yaw/pitch)
  const walkPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.65, 2.5));
  const walkYawPitch = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: -0.04 });
  const keysPressed = useRef<Record<string, boolean>>({});
  const activeWalkFloor = selectedFloor3D === 'all' ? 0 : selectedFloor3D;

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

  const site = plan.params.siteSettings;
  const showFurnitureParam = plan.params.showFurniture ?? true;
  const showFence = site ? site.hasFence : (plan.params.showFence ?? true);
  const showGardenDecor = plan.params.showGardenDecor ?? true;

  // =========================================================================
  // 1. PERSISTENT WEBGL ENGINE INITIALIZATION (Runs ONCE on mount)
  // =========================================================================
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
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.0055);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.15, 400);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    // Cap pixel ratio for mobile & software WebGL stability
    const gl = renderer.getContext();
    const rendererInfo = gl?.getParameter(gl.RENDERER) || '';
    const isSoftwareGL = typeof rendererInfo === 'string' && /swiftshader|llvmpipe|software/i.test(rendererInfo);
    renderer.setPixelRatio(isSoftwareGL ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGL;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Neutral IBL environment via RoomEnvironment (reflections without washed-out glare)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

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

    // Three-Point Studio + Sun Lighting
    const ambient = new THREE.AmbientLight(0xf8fafc, 0.65);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff7ed, 1.45);
    sun.position.set(28, 42, 26);
    sun.castShadow = !isSoftwareGL;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x38bdf8, 0.42);
    fill.position.set(-25, 18, -22);
    scene.add(fill);

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.42);
    scene.add(hemi);
    lightsRef.current = { ambient, sun, fill, hemi };

    const houseGroup = new THREE.Group();
    houseGroupRef.current = houseGroup;
    scene.add(houseGroup);

    // Pointer / Touch / Keyboard Handlers
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
      let deltaX = 0;
      let deltaY = 0;

      if ('touches' in e) {
        if (e.touches.length === 1) {
          deltaX = e.touches[0].clientX - previousPointerPosition.current.x;
          deltaY = e.touches[0].clientY - previousPointerPosition.current.y;
          previousPointerPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2 && touchPinchDistance.current !== null) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const currentDist = Math.hypot(dx, dy);
          const delta = touchPinchDistance.current - currentDist;
          targetDistance.current = Math.max(7, Math.min(72, targetDistance.current + delta * 0.08));
          touchPinchDistance.current = currentDist;
          return;
        }
      } else {
        const mouseEv = e as MouseEvent;
        deltaX = mouseEv.clientX - previousPointerPosition.current.x;
        deltaY = mouseEv.clientY - previousPointerPosition.current.y;
        previousPointerPosition.current = { x: mouseEv.clientX, y: mouseEv.clientY };
      }

      if (cameraModeRef.current === 'walk') {
        walkYawPitch.current.yaw -= deltaX * 0.0055;
        walkYawPitch.current.pitch = Math.max(-0.55, Math.min(0.65, walkYawPitch.current.pitch - deltaY * 0.0045));
      } else {
        targetAngle.current.y += deltaX * 0.008;
        targetAngle.current.x = Math.max(0.06, Math.min(Math.PI / 2 - 0.04, targetAngle.current.x + deltaY * 0.008));
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      touchPinchDistance.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cameraModeRef.current === 'walk') {
        const forward = new THREE.Vector3(-Math.sin(walkYawPitch.current.yaw), 0, -Math.cos(walkYawPitch.current.yaw));
        walkPosRef.current.addScaledVector(forward, -e.deltaY * 0.008);
      } else {
        targetDistance.current = Math.max(7, Math.min(72, targetDistance.current + e.deltaY * 0.03));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handlePointerDown);
    domElem.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Preallocated scratch vectors for RAF loop (no per-frame GC allocation)
    const walkForward = new THREE.Vector3();
    const walkRight = new THREE.Vector3();
    const walkLookTarget = new THREE.Vector3();
    const clock = new THREE.Clock();
    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());

      // Smooth Exploded View & Roof animations across child floor groups
      const expTarget = explodedRef.current;
      const hg = houseGroupRef.current;
      if (hg) {
        hg.children.forEach((grp) => {
          const floorIdx = grp.userData.floorIdx;
          const isRoof = grp.userData.isRoof;
          const isFoundation = grp.userData.layerKey === 'foundations';
          if (typeof floorIdx === 'number') {
            const desiredOffsetY = isRoof
              ? expTarget * (floorIdx * 2.8 + 3.2)
              : isFoundation
              ? -expTarget * 1.4
              : expTarget * floorIdx * 2.8;
            grp.position.y = THREE.MathUtils.damp(grp.position.y, desiredOffsetY, 8, dt);
          }
        });
      }

      if (cameraModeRef.current === 'walk') {
        const speed = 4.2 * dt;
        const yaw = walkYawPitch.current.yaw;
        const pitch = walkYawPitch.current.pitch;
        walkForward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
        walkRight.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) walkPosRef.current.addScaledVector(walkForward, speed);
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) walkPosRef.current.addScaledVector(walkForward, -speed);
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) walkPosRef.current.addScaledVector(walkRight, -speed);
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) walkPosRef.current.addScaledVector(walkRight, speed);

        camera.position.lerp(walkPosRef.current, 0.25);
        walkLookTarget.set(
          camera.position.x - Math.sin(yaw) * Math.cos(pitch) * 5,
          camera.position.y + Math.sin(pitch) * 5,
          camera.position.z - Math.cos(yaw) * Math.cos(pitch) * 5
        );
        camera.lookAt(walkLookTarget);
      } else {
        if (autoRotateRef.current) {
          targetAngle.current.y += 0.38 * dt;
        }
        currentAngle.current.x = THREE.MathUtils.damp(currentAngle.current.x, targetAngle.current.x, 8, dt);
        currentAngle.current.y = THREE.MathUtils.damp(currentAngle.current.y, targetAngle.current.y, 8, dt);
        currentDistance.current = THREE.MathUtils.damp(currentDistance.current, targetDistance.current, 9, dt);

        const dist = currentDistance.current;
        const ax = currentAngle.current.x;
        const ay = currentAngle.current.y;

        camera.position.set(
          dist * Math.cos(ax) * Math.sin(ay),
          dist * Math.sin(ax),
          dist * Math.cos(ax) * Math.cos(ay)
        );
        camera.lookAt(lookTargetRef.current);
      }

      renderer.render(scene, camera);
    };
    animate();

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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      disposeGroupContents(scene);
      envRT.dispose();
      if (texturesRef.current) {
        (Object.values(texturesRef.current) as THREE.Texture[]).forEach((t) => t.dispose());
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // =========================================================================
  // 2. INCREMENTAL SCENE GEOMETRY BUILDER (Preserves WebGLRenderer & Camera!)
  // =========================================================================
  useEffect(() => {
    const scene = sceneRef.current;
    const houseGroup = houseGroupRef.current;
    const lights = lightsRef.current;
    const renderer = rendererRef.current;
    if (!scene || !houseGroup || !lights || !renderer) return;

    // Update sky/atmosphere & lighting smoothly
    const isNight = viewMode === 'night';
    const bgHex = isNight ? 0x050a18 : 0x0f172a;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, isNight ? 0.0085 : 0.0052);
    renderer.toneMappingExposure = isNight ? 1.05 : 1.12;

    lights.ambient.color.setHex(isNight ? 0x1e293b : 0xf8fafc);
    lights.ambient.intensity = isNight ? 0.42 : 0.68;
    lights.sun.color.setHex(isNight ? 0x60a5fa : 0xfff7ed);
    lights.sun.intensity = isNight ? 0.52 : 1.48;
    lights.fill.intensity = isNight ? 0.45 : 0.4;
    lights.hemi.color.setHex(isNight ? 0x1e3a8a : 0xe0f2fe);
    lights.hemi.intensity = isNight ? 0.35 : 0.44;

    const wallHeight = 3.2;
    lookTargetRef.current.set(0, (floorsCount * wallHeight) / 3.0, 0);

    // Clear old meshes & textures inside houseGroup
    disposeGroupContents(houseGroup);
    if (texturesRef.current) {
      (Object.values(texturesRef.current) as THREE.Texture[]).forEach((t) => t.dispose());
    }

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

    const tex = createProceduralTextures(wallHex, roofTileColorStr, style, isNight);
    texturesRef.current = tex;

    const addToLayer = <T extends THREE.Object3D>(
      obj: T,
      layerKey: LayerKey,
      floorIdx = 0,
      isRoof = false
    ): T => {
      obj.userData.layerKey = layerKey;
      obj.userData.floorIdx = floorIdx;
      obj.userData.isRoof = isRoof;
      houseGroup.add(obj);
      return obj;
    };

    const cx = L / 2;
    const cz = W / 2;

    // Core architectural PBR materials
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallHex),
      map: tex.stoneAshlar,
      bumpMap: tex.stuccoBump,
      bumpScale: style === 'modern' || style === 'minimalist' ? 0.015 : 0.045,
      roughness: style === 'luxury' ? 0.25 : 0.55,
      metalness: 0.04,
      transparent: viewMode === 'structural',
      opacity: viewMode === 'structural' ? 0.22 : 1.0,
    });

    const blindPartyWallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallHex).multiplyScalar(0.88),
      bumpMap: tex.stuccoBump,
      bumpScale: 0.03,
      roughness: 0.78,
      transparent: viewMode === 'structural',
      opacity: viewMode === 'structural' ? 0.22 : 1.0,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      map: accentHex.toLowerCase() === '#92400e' || accentHex.toLowerCase() === '#451a03' ? tex.woodGrain : undefined,
      roughness: accentHex.toLowerCase() === '#0f172a' ? 0.18 : 0.42,
      metalness: accentHex.toLowerCase() === '#0f172a' || accentHex.toLowerCase() === '#64748b' ? 0.65 : 0.1,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: isNight ? 0xfef08a : 0x0284c7,
      emissive: isNight ? new THREE.Color(0xf59e0b) : new THREE.Color(0x0c4a6e),
      emissiveIntensity: isNight ? 0.45 : 0.28,
      transparent: true,
      opacity: isNight ? 0.78 : 0.74,
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

    // Compute Building Footprint Bounds from exterior walls or indoor rooms
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

    // -------------------------------------------------------------------------
    // LAYER: LAND / GROUND
    // -------------------------------------------------------------------------
    const landGrp = addToLayer(new THREE.Group(), 'land', 0);
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(L, bL) * 3 + 18, Math.max(W, bW) * 3 + 18),
      new THREE.MeshStandardMaterial({ map: tex.lawnGrass, roughness: 0.92 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.07, 0);
    groundMesh.receiveShadow = true;
    landGrp.add(groundMesh);

    // -------------------------------------------------------------------------
    // LAYER: SITE ELEMENTS (Patio, Road, Driveway, Fence, Gate, Pool)
    // -------------------------------------------------------------------------
    const siteGrp = addToLayer(new THREE.Group(), 'site', 0);
    const pMinX = leftX - (hasLeft ? 1.1 : 0.12);
    const pMaxX = rightX + (hasRight ? 1.1 : 0.12);
    const pMinZ = backZ - (hasBack ? 1.1 : 0.12);
    const pMaxZ = frontZ + (hasFront ? 1.3 : 0.12);

    if (!site || site.hasPatio) {
      const patioMesh = new THREE.Mesh(
        new THREE.BoxGeometry(pMaxX - pMinX, 0.1, pMaxZ - pMinZ),
        new THREE.MeshStandardMaterial({ map: tex.paverTiles, color: 0x94a3b8, roughness: 0.55 })
      );
      patioMesh.position.set((pMinX + pMaxX) / 2, -0.02, (pMinZ + pMaxZ) / 2);
      patioMesh.receiveShadow = true;
      siteGrp.add(patioMesh);
    }

    if (hasFront) {
      const roadMesh = new THREE.Mesh(
        new THREE.BoxGeometry(totalFenceW + 10, 0.06, 4.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
      );
      roadMesh.position.set(fenceCenterX, -0.05, fenceMaxZ + 2.3);
      roadMesh.receiveShadow = true;
      siteGrp.add(roadMesh);

      if ((site ? site.hasDriveway : plan.params.hasGarage) && plan.params.hasGarage) {
        const garageRm = plan.rooms.find((r) => r.floor === 0 && r.category === 'garage');
        const driveX = garageRm ? garageRm.x + garageRm.width / 2 - cx : bCx + bL * 0.28;
        const driveLen = Math.max(1.8, fenceMaxZ - frontZ);
        const drivewayMesh = new THREE.Mesh(
          new THREE.BoxGeometry(garageRm ? Math.min(3.8, garageRm.width * 0.9) : 3.4, 0.07, driveLen + 0.4),
          new THREE.MeshStandardMaterial({ map: tex.paverTiles, color: 0x475569, roughness: 0.6 })
        );
        drivewayMesh.position.set(driveX, -0.015, frontZ + driveLen / 2);
        drivewayMesh.receiveShadow = true;
        siteGrp.add(drivewayMesh);
      }
    }

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
        siteGrp.add(m);
      };

      addFenceSeg(totalFenceW, fenceH, fThick, fenceCenterX, fenceH / 2, fenceMinZ);
      addFenceSeg(fThick, fenceH, totalFenceD, fenceMinX, fenceH / 2, fenceCenterZ);
      addFenceSeg(fThick, fenceH, totalFenceD, fenceMaxX, fenceH / 2, fenceCenterZ);

      const gateWidth = !site || site.hasGate ? Math.min(3.8, totalFenceW * 0.35) : 0;
      const sideFenceW = Math.max(0.5, (totalFenceW - gateWidth) / 2);
      const fZ = fenceMaxZ;
      addFenceSeg(sideFenceW, fenceH, fThick, fenceMinX + sideFenceW / 2, fenceH / 2, fZ);
      addFenceSeg(sideFenceW, fenceH, fThick, fenceMaxX - sideFenceW / 2, fenceH / 2, fZ);

      if (gateWidth > 0) {
        [-gateWidth / 2, gateWidth / 2].forEach((gx) => {
          const pil = new THREE.Mesh(new THREE.BoxGeometry(0.45, fenceH + 0.35, 0.45), fenceCapMat);
          pil.position.set(fenceCenterX + gx, (fenceH + 0.35) / 2, fZ);
          pil.castShadow = true;
          siteGrp.add(pil);
        });
        const gateMesh = new THREE.Mesh(
          new THREE.BoxGeometry(gateWidth - 0.15, fenceH * 0.85, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
        );
        gateMesh.position.set(fenceCenterX, (fenceH * 0.85) / 2, fZ);
        siteGrp.add(gateMesh);
      }
    }

    const showPool = site ? site.hasPool : (showGardenDecor && plan.params.hasGarden);
    if (showPool) {
      const poolSideX = hasLeft ? leftX - 1.1 - poolW / 2 : hasRight ? rightX + 1.1 + poolW / 2 : null;
      if (poolSideX !== null) {
        const rimMesh = new THREE.Mesh(
          new THREE.BoxGeometry(poolW + 0.45, 0.1, poolL + 0.45),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
        );
        rimMesh.position.set(poolSideX, 0.02, bCz);
        rimMesh.receiveShadow = true;
        siteGrp.add(rimMesh);

        const poolMesh = new THREE.Mesh(
          new THREE.BoxGeometry(poolW, 0.06, poolL),
          new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            emissive: isNight ? new THREE.Color(0x0ea5e9) : new THREE.Color(0x000000),
            emissiveIntensity: isNight ? 0.5 : 0,
            roughness: 0.08,
            metalness: 0.2,
            transparent: true,
            opacity: 0.88,
          })
        );
        poolMesh.position.set(poolSideX, 0.06, bCz);
        siteGrp.add(poolMesh);
      }
    }

    // -------------------------------------------------------------------------
    // LAYER: PLANTS & TREES
    // -------------------------------------------------------------------------
    const plantsGrp = addToLayer(new THREE.Group(), 'plants', 0);
    if (showGardenDecor && plan.params.hasGarden) {
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
        plantsGrp.add(trunk);

        const crown1 = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.1, 8), foliageMat);
        crown1.position.set(pos.x, 2.9, pos.z);
        crown1.castShadow = true;
        plantsGrp.add(crown1);

        const crown2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 8), foliageMat);
        crown2.position.set(pos.x, 3.8, pos.z);
        crown2.castShadow = true;
        plantsGrp.add(crown2);
      });
    }

    // -------------------------------------------------------------------------
    // LAYER: FOUNDATIONS (Isolated Footings + Ground Tie Beams)
    // -------------------------------------------------------------------------
    const { foundations, beams } =
      plan.foundations && plan.beams
        ? { foundations: plan.foundations, beams: plan.beams }
        : deriveStructuralElements(plan);

    const foundationsGrp = addToLayer(new THREE.Group(), 'foundations', 0);
    const footingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.65, metalness: 0.1 });
    foundations.forEach((fnd) => {
      const fMesh = new THREE.Mesh(new THREE.BoxGeometry(fnd.width, fnd.depth, fnd.length), footingMat);
      fMesh.position.set(fnd.x - cx, -fnd.depth / 2 - 0.02, fnd.y - cz);
      fMesh.receiveShadow = true;
      foundationsGrp.add(fMesh);
    });

    // Helper: Build segmented exterior wall with TRUE recessed window & door openings
    const buildOpenExteriorWall = (
      dir: FacadeDirection,
      floorIdx: number,
      floorY: number,
      wallGrp: THREE.Group,
      doorGrp: THREE.Group,
      winGrp: THREE.Group
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
          const clampedStart = Math.max(
            wallStart + 0.25,
            Math.min(wallEnd - Math.min(op.width, span - 0.6) - 0.25, startPos)
          );
          return {
            ...op,
            s: clampedStart,
            e: clampedStart + Math.min(op.width, span - 0.5),
          };
        })
        .sort((a, b) => a.s - b.s);

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
        const geo = isHorizontal ? new THREE.BoxGeometry(len, h, thick) : new THREE.BoxGeometry(thick, h, len);
        const mesh = new THREE.Mesh(geo, mat);
        if (dir === 'front') mesh.position.set(posAlong, yCenter, frontZ - thick / 2);
        else if (dir === 'back') mesh.position.set(posAlong, yCenter, backZ + thick / 2);
        else if (dir === 'left') mesh.position.set(leftX + thick / 2, yCenter, posAlong);
        else mesh.position.set(rightX - thick / 2, yCenter, posAlong);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        wallGrp.add(mesh);
      };

      const getWorldCoord = (posAlong: number, offsetOutward: number): [number, number] => {
        if (dir === 'front') return [posAlong, frontZ - thick / 2 + offsetOutward];
        if (dir === 'back') return [posAlong, backZ + thick / 2 - offsetOutward];
        if (dir === 'left') return [leftX + thick / 2 - offsetOutward, posAlong];
        return [rightX - thick / 2 + offsetOutward, posAlong];
      };

      let wallPos = wallStart;
      for (const op of cleanOps) {
        if (op.s > wallPos) {
          placeSegment((wallPos + op.s) / 2, op.s - wallPos, wallHeight, floorY + wallHeight / 2, wallMat);
        }

        const bayCenter = (op.s + op.e) / 2;
        const bayW = op.e - op.s;
        const isGarageDoor = op.type === 'door' && (op.label.includes('مرآب') || op.label.includes('كراج'));

        if (op.type === 'door') {
          const doorH = isGarageDoor ? 2.5 : 2.4;
          placeSegment(bayCenter, bayW, wallHeight - doorH, floorY + doorH + (wallHeight - doorH) / 2, wallMat);

          const [dx, dz] = getWorldCoord(bayCenter, 0.02);
          const doorGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW - 0.12, doorH - 0.06, 0.12)
            : new THREE.BoxGeometry(0.12, doorH - 0.06, bayW - 0.12);
          const doorMesh = new THREE.Mesh(doorGeo, isGarageDoor ? garageDoorMat : doorMat);
          doorMesh.position.set(dx, floorY + doorH / 2, dz);
          doorMesh.castShadow = true;
          doorGrp.add(doorMesh);

          const [fx, fz] = getWorldCoord(bayCenter, 0.04);
          const dTopGeo = isHorizontal ? new THREE.BoxGeometry(bayW + 0.08, 0.1, 0.3) : new THREE.BoxGeometry(0.3, 0.1, bayW + 0.08);
          const dTop = new THREE.Mesh(dTopGeo, frameMat);
          dTop.position.set(fx, floorY + doorH, fz);
          doorGrp.add(dTop);

          [-bayW / 2 + 0.04, bayW / 2 - 0.04].forEach((jOff) => {
            const [jx, jz] = getWorldCoord(bayCenter + jOff, 0.04);
            const jGeo = isHorizontal ? new THREE.BoxGeometry(0.09, doorH, 0.3) : new THREE.BoxGeometry(0.3, doorH, 0.09);
            const jamb = new THREE.Mesh(jGeo, frameMat);
            jamb.position.set(jx, floorY + doorH / 2, jz);
            doorGrp.add(jamb);
          });

          if (!isGarageDoor && floorIdx === 0) {
            const [cxOut, czOut] = getWorldCoord(bayCenter, 0.68);
            const canopyGeo = isHorizontal
              ? new THREE.BoxGeometry(bayW + 1.1, 0.16, 1.35)
              : new THREE.BoxGeometry(1.35, 0.16, bayW + 1.1);
            const canopy = new THREE.Mesh(canopyGeo, accentMat);
            canopy.position.set(cxOut, floorY + doorH + 0.18, czOut);
            canopy.castShadow = true;
            doorGrp.add(canopy);
          }
        } else {
          const sillH = 0.85;
          const winTop = 2.6;
          const winH = winTop - sillH;

          placeSegment(bayCenter, bayW, sillH, floorY + sillH / 2, wallMat);
          placeSegment(bayCenter, bayW, wallHeight - winTop, floorY + winTop + (wallHeight - winTop) / 2, wallMat);

          const [wx, wz] = getWorldCoord(bayCenter, 0.01);
          const gGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW - 0.1, winH - 0.1, 0.05)
            : new THREE.BoxGeometry(0.05, winH - 0.1, bayW - 0.1);
          const gMesh = new THREE.Mesh(gGeo, glassMat);
          gMesh.position.set(wx, floorY + sillH + winH / 2, wz);
          winGrp.add(gMesh);

          const frameBarThick = 0.07;
          const [fx, fz] = getWorldCoord(bayCenter, 0.04);
          const topBarGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW + 0.06, frameBarThick, 0.28)
            : new THREE.BoxGeometry(0.28, frameBarThick, bayW + 0.06);
          const topBar = new THREE.Mesh(topBarGeo, frameMat);
          topBar.position.set(fx, floorY + winTop - frameBarThick / 2, fz);
          winGrp.add(topBar);

          const sillGeo = isHorizontal
            ? new THREE.BoxGeometry(bayW + 0.12, 0.08, 0.34)
            : new THREE.BoxGeometry(0.34, 0.08, bayW + 0.12);
          const botBar = new THREE.Mesh(sillGeo, accentMat);
          const [sxOut, szOut] = getWorldCoord(bayCenter, 0.06);
          botBar.position.set(sxOut, floorY + sillH, szOut);
          winGrp.add(botBar);

          [-bayW / 2 + 0.035, bayW / 2 - 0.035].forEach((jOff) => {
            const [jx, jz] = getWorldCoord(bayCenter + jOff, 0.04);
            const sideGeo = isHorizontal ? new THREE.BoxGeometry(0.07, winH, 0.28) : new THREE.BoxGeometry(0.28, winH, 0.07);
            const sideJamb = new THREE.Mesh(sideGeo, frameMat);
            sideJamb.position.set(jx, floorY + sillH + winH / 2, jz);
            winGrp.add(sideJamb);
          });

          const mulGeo = isHorizontal ? new THREE.BoxGeometry(0.06, winH, 0.14) : new THREE.BoxGeometry(0.14, winH, 0.06);
          const mul = new THREE.Mesh(mulGeo, frameMat);
          mul.position.set(fx, floorY + sillH + winH / 2, fz);
          winGrp.add(mul);
        }

        wallPos = op.e;
      }

      if (wallPos < wallEnd) {
        placeSegment((wallPos + wallEnd) / 2, wallEnd - wallPos, wallHeight, floorY + wallHeight / 2, wallMat);
      }
    };

    // -------------------------------------------------------------------------
    // BUILD FLOORS (SLABS, WALLS, DOORS, WINDOWS, FURNITURE, BEAMS, COLUMNS)
    // -------------------------------------------------------------------------
    const pWallMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      bumpMap: tex.stuccoBump,
      bumpScale: 0.015,
      roughness: 0.65,
      transparent: viewMode === 'structural',
      opacity: viewMode === 'structural' ? 0.25 : 1.0,
    });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.35, metalness: 0.2 });
    const colStoneMat = new THREE.MeshStandardMaterial({
      color: viewMode === 'structural' ? 0xfb7185 : 0x475569,
      roughness: 0.35,
      metalness: 0.25,
    });

    for (let f = 0; f < floorsCount; f++) {
      if (selectedFloor3D !== 'all' && selectedFloor3D !== f) continue;
      const floorY = f * wallHeight;

      const slabsGrp = addToLayer(new THREE.Group(), 'slabs', f);
      const wallsGrp = addToLayer(new THREE.Group(), 'walls', f);
      const doorsGrp = addToLayer(new THREE.Group(), 'doors', f);
      const winsGrp = addToLayer(new THREE.Group(), 'windows', f);
      const furnGrp = addToLayer(new THREE.Group(), 'furniture', f);
      const beamsGrp = addToLayer(new THREE.Group(), 'beams', f);
      const colsGrp = addToLayer(new THREE.Group(), 'columns', f);

      // Floor Concrete Slab
      const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(bL + 0.1, 0.22, bW + 0.1), slabMat);
      slabMesh.position.set(bCx, floorY + 0.11, bCz);
      slabMesh.receiveShadow = true;
      slabMesh.castShadow = true;
      slabsGrp.add(slabMesh);

      if ((style === 'modern' || style === 'luxury' || style === 'minimalist') && hasFront && viewMode !== 'structural') {
        const browMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bL + 0.5, 0.14, 0.55),
          style === 'luxury' ? accentMat : slabMat
        );
        browMesh.position.set(bCx, floorY + wallHeight - 0.07, frontZ + 0.25);
        browMesh.castShadow = true;
        wallsGrp.add(browMesh);
      }

      // Room floor tiles + highlight selection ring
      const roomsOnFloor = plan.rooms.filter((r) => r.floor === f);
      roomsOnFloor.forEach((rm) => {
        const rx = rm.x + rm.width / 2 - cx;
        const rz = rm.y + rm.length / 2 - cz;
        const isCourt = rm.nameAr.includes('فناء') || rm.nameAr.includes('وسط الدار') || rm.nameAr.includes('منور');
        const isSel = selectedRoomId === rm.id;
        const rTileMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(isSel ? '#38bdf8' : rm.color || '#3b82f6'),
          map: isCourt && (style === 'algerian' || style === 'andalusian') ? tex.zelligeMosaic : tex.paverTiles,
          roughness: 0.35,
          emissive: isSel ? new THREE.Color('#0284c7') : new THREE.Color('#000000'),
          emissiveIntensity: isSel ? 0.25 : 0,
        });
        const rTileMesh = new THREE.Mesh(new THREE.BoxGeometry(rm.width - 0.08, 0.05, rm.length - 0.08), rTileMat);
        rTileMesh.position.set(rx, floorY + 0.23, rz);
        rTileMesh.receiveShadow = true;
        slabsGrp.add(rTileMesh);
      });

      // Render 16-Item Smart Furniture from plan.furniture!
      if (showFurnitureParam) {
        const floorFurn = plan.furniture.filter((fn) => fn.floor === f);
        floorFurn.forEach((fn) => {
          const itemGrp = buildFurnitureMeshGroup(fn, tex.woodGrain);
          itemGrp.position.set(fn.x + fn.width / 2 - cx, floorY + 0.26, fn.y + fn.depth / 2 - cz);
          furnGrp.add(itemGrp);
        });
      }

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
          slabsGrp.add(sMesh);
        }

        const railLen = Math.hypot(wallHeight, stairRoom.length * 0.8);
        const railMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, railLen, 8), railMat);
        railMesh.rotation.x = Math.atan2(stairRoom.length * 0.8, wallHeight);
        railMesh.position.set(sX + stepWidth / 2, floorY + wallHeight / 2 + 0.35, sZ);
        slabsGrp.add(railMesh);
      }

      // Exterior Walls with True Facade Openings
      const thick = 0.25;
      if (hasFront) buildOpenExteriorWall('front', f, floorY, wallsGrp, doorsGrp, winsGrp);
      else {
        const fBlind = new THREE.Mesh(new THREE.BoxGeometry(bL, wallHeight, thick), blindPartyWallMat);
        fBlind.position.set(bCx, floorY + wallHeight / 2, frontZ - thick / 2);
        fBlind.castShadow = true;
        wallsGrp.add(fBlind);
      }

      if (hasBack) buildOpenExteriorWall('back', f, floorY, wallsGrp, doorsGrp, winsGrp);
      else {
        const bBlind = new THREE.Mesh(new THREE.BoxGeometry(bL, wallHeight, thick), blindPartyWallMat);
        bBlind.position.set(bCx, floorY + wallHeight / 2, backZ + thick / 2);
        bBlind.castShadow = true;
        wallsGrp.add(bBlind);
      }

      if (hasLeft) buildOpenExteriorWall('left', f, floorY, wallsGrp, doorsGrp, winsGrp);
      else {
        const lBlind = new THREE.Mesh(new THREE.BoxGeometry(thick, wallHeight, bW - thick * 2), blindPartyWallMat);
        lBlind.position.set(leftX + thick / 2, floorY + wallHeight / 2, bCz);
        lBlind.castShadow = true;
        wallsGrp.add(lBlind);
      }

      if (hasRight) buildOpenExteriorWall('right', f, floorY, wallsGrp, doorsGrp, winsGrp);
      else {
        const rBlind = new THREE.Mesh(new THREE.BoxGeometry(thick, wallHeight, bW - thick * 2), blindPartyWallMat);
        rBlind.position.set(rightX - thick / 2, floorY + wallHeight / 2, bCz);
        rBlind.castShadow = true;
        wallsGrp.add(rBlind);
      }

      // Style Signature Ornamentation
      if (hasFront && f === 0 && viewMode !== 'structural') {
        if (style === 'algerian' || style === 'andalusian') {
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
            wallsGrp.add(p1);
            const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.3, 12), colMat);
            p2.position.set(ax + archSpan / 2, 1.15, frontZ + 0.85);
            wallsGrp.add(p2);
            const torus = new THREE.Mesh(new THREE.TorusGeometry(archSpan / 2, 0.085, 12, 24, Math.PI), archMat);
            torus.position.set(ax, 2.3, frontZ + 0.85);
            wallsGrp.add(torus);
          });
        } else if (style === 'classic') {
          const classicColMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 0.18 });
          [-1.6, -0.55, 0.55, 1.6].forEach((cxPos) => {
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.75, 16), classicColMat);
            col.position.set(bCx + cxPos, 1.38, frontZ + 0.9);
            wallsGrp.add(col);
          });
        }
      }

      // Balcony
      if (f > 0 && plan.params.hasBalcony) {
        const balDir: FacadeDirection = hasFront ? 'front' : hasLeft ? 'left' : hasRight ? 'right' : 'back';
        const balDepth = 1.4;
        const balW = (balDir === 'front' || balDir === 'back' ? bL : bW) * 0.44;
        const isHorizBal = balDir === 'front' || balDir === 'back';
        const bSlab = new THREE.Mesh(
          isHorizBal ? new THREE.BoxGeometry(balW, 0.18, balDepth) : new THREE.BoxGeometry(balDepth, 0.18, balW),
          slabMat
        );
        const bRail = new THREE.Mesh(
          isHorizBal ? new THREE.BoxGeometry(balW, 0.98, 0.05) : new THREE.BoxGeometry(0.05, 0.98, balW),
          glassMat
        );
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
        slabsGrp.add(bSlab);
        winsGrp.add(bRail);
      }

      // Interior Partition Walls (respecting wall.height & structural wallType highlight)
      const floorWalls = plan.walls.filter((w) => w.floor === f && !w.isExterior);
      floorWalls.forEach((w) => {
        const dx = w.x2 - w.x1;
        const dz = w.y2 - w.y1;
        const wlen = Math.hypot(dx, dz);
        if (wlen < 0.2) return;
        const wh = (w.height ?? wallHeight) * 0.94;
        const wx = (w.x1 + w.x2) / 2 - cx;
        const wz = (w.y1 + w.y2) / 2 - cz;
        const pWall = new THREE.Mesh(
          new THREE.BoxGeometry(wlen, wh, w.thickness || 0.15),
          w.wallType === 'structural' && viewMode === 'structural' ? beamMat : pWallMat
        );
        pWall.position.set(wx, floorY + wh / 2, wz);
        pWall.rotation.y = -Math.atan2(dz, dx);
        pWall.castShadow = true;
        pWall.receiveShadow = true;
        wallsGrp.add(pWall);
      });

      // Interior Doors
      const interiorDoors = plan.openings.filter((op) => op.floor === f && op.id?.startsWith('op-int-'));
      interiorDoors.forEach((op) => {
        const isVert = op.rotation === 90 || op.rotation === 270;
        const dx = op.x - cx + (isVert ? 0 : op.width / 2);
        const dz = op.y - cz + (isVert ? op.width / 2 : 0);
        const iDoor = new THREE.Mesh(
          isVert ? new THREE.BoxGeometry(0.22, 2.25, op.width) : new THREE.BoxGeometry(op.width, 2.25, 0.22),
          doorMat
        );
        iDoor.position.set(dx, floorY + 1.125, dz);
        doorsGrp.add(iDoor);
      });

      // Columns for this floor
      plan.columns.forEach((col) => {
        const colMesh = new THREE.Mesh(
          new THREE.BoxGeometry(col.sizeX || 0.25, wallHeight, col.sizeY || 0.45),
          colStoneMat
        );
        colMesh.position.set(col.x - cx, floorY + wallHeight / 2, col.y - cz);
        colMesh.castShadow = true;
        colMesh.receiveShadow = true;
        colsGrp.add(colMesh);
      });

      // Tie Beams at ceiling level of this floor
      beams
        .filter((b) => b.floor === f)
        .forEach((b) => {
          const dx = b.x2 - b.x1;
          const dz = b.y2 - b.y1;
          const blen = Math.hypot(dx, dz);
          if (blen < 0.2) return;
          const bMesh = new THREE.Mesh(
            new THREE.BoxGeometry(blen, b.depth || 0.4, b.width || 0.25),
            beamMat
          );
          bMesh.position.set((b.x1 + b.x2) / 2 - cx, floorY + wallHeight - (b.depth || 0.4) / 2, (b.y1 + b.y2) / 2 - cz);
          bMesh.rotation.y = -Math.atan2(dz, dx);
          beamsGrp.add(bMesh);
        });
    }

    // Structural Axis Grid helper when in Structure Mode
    if (viewMode === 'structural') {
      const colsGridGrp = addToLayer(new THREE.Group(), 'columns', 0);
      const gridHelper = new THREE.GridHelper(Math.max(L, W) + 4, Math.max(L, W) + 4, 0xf43f5e, 0x334155);
      gridHelper.position.set(0, 0.02, 0);
      colsGridGrp.add(gridHelper);
    }

    // -------------------------------------------------------------------------
    // LAYER: NIGHT LIGHTING & GARDEN LIGHTS
    // -------------------------------------------------------------------------
    const lightingGrp = addToLayer(new THREE.Group(), 'lighting', 0);
    if (isNight || (site?.hasGardenLights ?? true)) {
      const sconceColor = new THREE.Color(lightHex);
      const sconceMat = new THREE.MeshStandardMaterial({
        color: sconceColor,
        emissive: sconceColor,
        emissiveIntensity: isNight ? 1.0 : 0.4,
      });

      if (hasFront) {
        [bCx - bL * 0.24, bCx + bL * 0.24].forEach((lx) => {
          if (isNight) {
            const pt = new THREE.PointLight(sconceColor, 2.5, 11);
            pt.position.set(lx, wallHeight * 0.82, frontZ + 0.7);
            lightingGrp.add(pt);
          }
          const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.12), sconceMat);
          sconce.position.set(lx, wallHeight * 0.82, frontZ + 0.08);
          lightingGrp.add(sconce);
        });

        // Warm garden path bollards
        [-bL * 0.35, bL * 0.35].forEach((bx) => {
          const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.65, 8), sconceMat);
          bollard.position.set(bCx + bx, 0.325, fenceMaxZ - 0.8);
          lightingGrp.add(bollard);
        });
      }
    }

    // -------------------------------------------------------------------------
    // LAYER: ROOF
    // -------------------------------------------------------------------------
    const roofGrp = addToLayer(new THREE.Group(), 'roof', Math.max(0, floorsCount - 1), true);
    const topY = wallHeight * floorsCount;

    if (
      roofType === 'sloped' ||
      style === 'algerian' ||
      style === 'andalusian' ||
      style === 'mediterranean'
    ) {
      const roofH = Math.min(3.4, Math.max(2.0, Math.min(bL, bW) * 0.3));
      const roofMesh = new THREE.Mesh(
        new THREE.ConeGeometry(Math.hypot(bL, bW) * 0.53 + 0.45, roofH, 4),
        new THREE.MeshStandardMaterial({ map: tex.roofTiles, roughness: 0.48, metalness: 0.08 })
      );
      roofMesh.position.set(bCx, topY + roofH / 2, bCz);
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.castShadow = true;
      roofGrp.add(roofMesh);

      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.18, Math.max(bL, bW) * 0.42),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 })
      );
      ridge.position.set(bCx, topY + roofH + 0.04, bCz);
      roofGrp.add(ridge);
    } else {
      const roofSlab = new THREE.Mesh(
        new THREE.BoxGeometry(bL + 0.35, 0.24, bW + 0.35),
        new THREE.MeshStandardMaterial({ color: 0x334155, map: tex.paverTiles, roughness: 0.6 })
      );
      roofSlab.position.set(bCx, topY + 0.12, bCz);
      roofSlab.castShadow = true;
      roofGrp.add(roofSlab);

      const parapetH = style === 'traditional' ? 1.05 : 0.85;
      const pThick = 0.2;
      const addParapet = (w: number, d: number, px: number, pz: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, parapetH, d), wallMat);
        m.position.set(px, topY + 0.24 + parapetH / 2, pz);
        m.castShadow = true;
        roofGrp.add(m);
      };
      addParapet(bL + 0.35, pThick, bCx, frontZ + 0.175 - pThick / 2);
      addParapet(bL + 0.35, pThick, bCx, backZ - 0.175 + pThick / 2);
      addParapet(pThick, bW + 0.35, leftX - 0.175 + pThick / 2, bCz);
      addParapet(pThick, bW + 0.35, rightX + 0.175 - pThick / 2, bCz);

      if (hasStairs) {
        const bhMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 3.0), wallMat);
        bhMesh.position.set(bCx + bL * 0.08, topY + 0.24 + 1.1, bCz);
        bhMesh.castShadow = true;
        roofGrp.add(bhMesh);
      }
    }
  }, [
    plan,
    selectedFloor3D,
    viewMode,
    wallHex,
    accentHex,
    lightHex,
    openFacadeDirections,
    showFurnitureParam,
    showFence,
    showGardenDecor,
    roofType,
    hasStairs,
    hasCourtyard,
    style,
    L,
    W,
    floorsCount,
    selectedRoomId,
  ]);

  // =========================================================================
  // 3. ZERO-REBUILD VISIBILITY UPDATE (13 Layers + Roof Toggle)
  // =========================================================================
  useEffect(() => {
    const hg = houseGroupRef.current;
    if (!hg) return;
    hg.children.forEach((grp) => {
      const key = grp.userData.layerKey as LayerKey | undefined;
      const isRoof = Boolean(grp.userData.isRoof);
      if (!key) return;
      if (isRoof) {
        grp.visible = showRoof && layers.roof && selectedFloor3D === 'all';
      } else if (key === 'beams') {
        grp.visible = layers.beams && (viewMode === 'structural' || activeExploded > 0.05);
      } else if (key === 'foundations') {
        grp.visible = layers.foundations && (viewMode === 'structural' || activeExploded > 0.05);
      } else {
        grp.visible = layers[key] ?? true;
      }
    });
  }, [layers, showRoof, selectedFloor3D, viewMode, activeExploded, plan]);

  // Preset Camera Switcher (including Interior First-Person Walk Mode)
  const setCameraPreset = (preset: CameraPresetMode) => {
    setCameraMode(preset);
    if (preset === 'walk') {
      const firstRoom =
        plan.rooms.find((r) => r.floor === activeWalkFloor && r.category === 'living') ||
        plan.rooms.find((r) => r.floor === activeWalkFloor);
      const wx = firstRoom ? firstRoom.x + firstRoom.width / 2 - L / 2 : 0;
      const wz = firstRoom ? firstRoom.y + firstRoom.length / 2 - W / 2 : 0;
      walkPosRef.current.set(wx, activeWalkFloor * 3.2 + 1.65, wz);
      walkYawPitch.current = { yaw: 0, pitch: -0.02 };
      setAutoRotate(false);
      return;
    }

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

  const nudgeWalk = (fwd: number, strafe: number) => {
    const yaw = walkYawPitch.current.yaw;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    walkPosRef.current.x += fx * fwd + rx * strafe;
    walkPosRef.current.z += fz * fwd + rz * strafe;
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3 w-full min-w-0 overflow-hidden">
      {/* Compact Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowRoof(!showRoof)}
            className={`min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showRoof
                ? 'bg-cyan-600 border-cyan-500 text-white shadow-sm'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
          >
            {showRoof ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>
              {showRoof
                ? pickText(language, 'السقف ظاهر', 'Toit visible', 'Roof On')
                : pickText(language, 'السقف مخفي', 'Toit masqué', 'Roof Off')}
            </span>
          </button>

          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-800">
            <button
              onClick={() => setSelectedFloor3D('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedFloor3D === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {pickText(language, 'الكل', 'Tout', 'All')}
            </button>
            {Array.from({ length: floorsCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFloor3D(idx)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  selectedFloor3D === idx ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {idx === 0 ? pickText(language, 'الأرضي', 'RDC', 'G') : `F${idx}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setViewMode(viewMode === 'night' ? 'realistic' : 'night')}
            className={`min-h-[38px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-bold transition-all ${
              viewMode === 'night'
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            {viewMode === 'night' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{viewMode === 'night' ? pickText(language, 'ليلي', 'Nuit', 'Night') : pickText(language, 'نهاري', 'Jour', 'Day')}</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'structural' ? 'realistic' : 'structural')}
            className={`min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all font-bold ${
              viewMode === 'structural'
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{pickText(language, 'الهيكل الإنشائي', 'Structure', 'Structure')}</span>
          </button>

          <button
            onClick={() => setCameraPreset(cameraMode === 'walk' ? 'iso' : 'walk')}
            className={`min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all font-bold ${
              cameraMode === 'walk'
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>{pickText(language, 'جولة داخلية', 'Visite 1P', 'Walk')}</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              autoRotate ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
            <span>360°</span>
          </button>
        </div>
      </div>

      {/* Exploded View Slider Bar */}
      <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-cyan-300 font-bold shrink-0">
          <Layers className="w-3.5 h-3.5" />
          <span>{pickText(language, 'تفكيك الطوابق (Exploded)', 'Vue Éclatée', 'Exploded View')}</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={activeExploded}
          onChange={(e) => setActiveExploded(parseFloat(e.target.value))}
          className="flex-1 accent-cyan-500 cursor-pointer"
        />
        <span className="font-mono text-cyan-400 w-10 text-left">{Math.round(activeExploded * 100)}%</span>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
        <div
          ref={containerRef}
          className="w-full h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] cursor-grab active:cursor-grabbing touch-none"
        />

        {contextLost && (
          <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center text-xs text-amber-300 font-bold z-20">
            {pickText(language, 'تمت إعادة تهيئة محرك العرض ثلاثي الأبعاد...', 'Réinitialisation WebGL...', 'Reinitializing WebGL...')}
          </div>
        )}

        {/* Top-Left Zoom Controls */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-2xl z-10">
          <button
            onClick={() => (targetDistance.current = Math.max(7, targetDistance.current - 3.5))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => (targetDistance.current = Math.min(72, targetDistance.current + 3.5))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCameraPreset('iso')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Top-Right Camera Angle Presets */}
        <div className="absolute top-3 right-3 max-w-[calc(100%-70px)] overflow-x-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 z-10 text-[11px] font-semibold text-slate-300">
          {(
            [
              ['iso', pickText(language, 'منظور', 'Iso', 'Iso')],
              ['front', pickText(language, 'أمامية', 'Avant', 'Front')],
              ['back', pickText(language, 'خلفية', 'Arrière', 'Back')],
              ['right', pickText(language, 'يمين', 'Droite', 'Right')],
              ['left', pickText(language, 'يسار', 'Gauche', 'Left')],
              ['top', pickText(language, 'علوي', 'Haut', 'Top')],
            ] as [CameraPresetMode, string][]
          ).map(([preset, lbl]) => (
            <button
              key={preset}
              onClick={() => setCameraPreset(preset)}
              className={`px-2 py-1 rounded-lg transition-all shrink-0 ${
                cameraMode === preset ? 'bg-cyan-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Walk Mode Touch D-Pad Overlay (Appears only in Walk Mode) */}
        {cameraMode === 'walk' && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 rounded-xl p-2 z-10 flex flex-col items-center gap-1">
            <button onClick={() => nudgeWalk(1.1, 0)} className="p-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-white">
              <ArrowUp className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => nudgeWalk(0, -1.0)} className="p-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-white">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={() => nudgeWalk(-1.1, 0)} className="p-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-white">
                <ArrowDown className="w-4 h-4" />
              </button>
              <button onClick={() => nudgeWalk(0, 1.0)} className="p-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-white">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Structural Mode Engineering Disclaimer */}
        {viewMode === 'structural' && (
          <div className="absolute bottom-12 right-3 left-3 sm:left-auto max-w-md bg-rose-950/90 backdrop-blur-md border border-rose-500/50 rounded-xl p-2 px-3 text-[11px] text-rose-200 z-10">
            {pickText(
              language,
              'وضع الهيكل الإنشائي التقديري: القواعد والأعمدة والجسور استرشادية وتخضع لمراجعة مهندس مدني مختص وفحص التربة.',
              'Mode Structure préliminaire : validation obligatoire par un ingénieur génie civil.',
              'Preliminary Structure View: Foundations, columns & beams require certified structural engineer sign-off.'
            )}
          </div>
        )}

        {/* Bottom Helper Banner (Non-obstructive) */}
        <div className="absolute bottom-3 right-3 max-w-[calc(100%-24px)] bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl py-1.5 px-3 text-[11px] text-slate-200 flex items-center gap-2 pointer-events-none">
          <Rotate3D className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">
            {cameraMode === 'walk'
              ? pickText(language, 'وضع المشي: اسحب للنظر وحرّك بالأسهم أو WASD', 'Visite : glissez pour regarder, flèches/WASD pour avancer', 'Walk Mode: Drag to look, WASD/Arrows to walk')
              : pickText(language, 'اسحب للتدوير 360° • قرّب بالأصابع أو بعجلة الفأرة', 'Glisser pour pivoter • Pincer / Molette pour zoomer', 'Drag to orbit 360° • Pinch or scroll to zoom')}
          </span>
        </div>
      </div>
    </div>
  );
};
