import * as THREE from 'three';
import { FurnitureData } from '../types';

/**
 * Creates a composite multi-part 3D THREE.Group for every item in the 16-item
 * architectural furniture catalog (plus garage car), scaled proportionally to
 * item.width x item.depth x item.height and centered around local origin (y=0 floor).
 */
export function buildFurnitureMeshGroup(
  item: FurnitureData,
  woodTexture?: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  const s = item.scale ?? 1;
  const w = Math.max(0.25, (item.width || 1.0) * s);
  const d = Math.max(0.25, (item.depth || 1.0) * s);
  const baseHex = item.color || '#334155';

  const makeStd = (hex: string | number, roughness = 0.65, metalness = 0.08, useWood = false) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      map: useWood ? woodTexture : undefined,
      roughness,
      metalness,
    });

  const addBox = (
    bw: number,
    bh: number,
    bd: number,
    px: number,
    py: number,
    pz: number,
    mat: THREE.Material,
    castShadow = true
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
    m.position.set(px, py, pz);
    m.castShadow = castShadow;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  switch (item.type) {
    case 'bed': {
      const frameMat = makeStd('#451a03', 0.42, 0.05, true);
      const sheetMat = makeStd('#f8fafc', 0.78);
      const blanketMat = makeStd(baseHex, 0.72);
      // Base + mattress + blanket + headboard + 2 pillows
      addBox(w, 0.22, d, 0, 0.11, 0, frameMat);
      addBox(w * 0.94, 0.24, d * 0.94, 0, 0.34, 0, sheetMat);
      addBox(w * 0.96, 0.08, d * 0.62, 0, 0.45, d * 0.16, blanketMat);
      addBox(w * 1.02, 0.92, 0.12, 0, 0.46, -d / 2 + 0.06, frameMat);
      addBox(w * 0.36, 0.1, 0.32, -w * 0.24, 0.5, -d * 0.32, sheetMat);
      addBox(w * 0.36, 0.1, 0.32, w * 0.24, 0.5, -d * 0.32, sheetMat);
      break;
    }

    case 'wardrobe': {
      const cabMat = makeStd(baseHex, 0.45, 0.08, true);
      const trimMat = makeStd('#cbd5e1', 0.25, 0.85);
      const h = item.height || 2.05;
      addBox(w, h, d, 0, h / 2, 0, cabMat);
      // Center seam + two vertical handles + top crown
      addBox(0.02, h * 0.92, 0.03, 0, h / 2, d / 2 + 0.015, trimMat, false);
      addBox(0.03, 0.35, 0.04, -0.08, h * 0.5, d / 2 + 0.025, trimMat, false);
      addBox(0.03, 0.35, 0.04, 0.08, h * 0.5, d / 2 + 0.025, trimMat, false);
      addBox(w + 0.06, 0.07, d + 0.04, 0, h + 0.035, 0, cabMat);
      break;
    }

    case 'desk': {
      const topMat = makeStd(baseHex, 0.35, 0.08, true);
      const legMat = makeStd('#0f172a', 0.3, 0.8);
      const h = item.height || 0.76;
      addBox(w, 0.06, d, 0, h - 0.03, 0, topMat);
      [-w / 2 + 0.06, w / 2 - 0.06].forEach((lx) => {
        [-d / 2 + 0.06, d / 2 - 0.06].forEach((lz) => {
          addBox(0.06, h - 0.06, 0.06, lx, (h - 0.06) / 2, lz, legMat);
        });
      });
      // Drawer pedestal
      addBox(w * 0.28, h * 0.65, d * 0.86, w * 0.32, h * 0.45, 0, topMat);
      break;
    }

    case 'sofa': {
      const fabricMat = makeStd(baseHex, 0.82);
      const cushionMat = makeStd('#64748b', 0.85);
      const legMat = makeStd('#0f172a', 0.35, 0.7);
      // Seat + backrest + left/right armrests + 2 seat cushions
      addBox(w, 0.28, d * 0.88, 0, 0.22, 0.05, fabricMat);
      addBox(w, 0.52, 0.2, 0, 0.5, -d / 2 + 0.1, fabricMat);
      addBox(0.16, 0.44, d * 0.9, -w / 2 + 0.08, 0.36, 0.04, fabricMat);
      addBox(0.16, 0.44, d * 0.9, w / 2 - 0.08, 0.36, 0.04, fabricMat);
      addBox(w * 0.4, 0.12, d * 0.65, -w * 0.22, 0.4, 0.06, cushionMat, false);
      addBox(w * 0.4, 0.12, d * 0.65, w * 0.22, 0.4, 0.06, cushionMat, false);
      [-w / 2 + 0.1, w / 2 - 0.1].forEach((lx) =>
        [-d / 2 + 0.1, d / 2 - 0.1].forEach((lz) => addBox(0.05, 0.08, 0.05, lx, 0.04, lz, legMat, false))
      );
      break;
    }

    case 'table': {
      const topMat = makeStd(baseHex, 0.32, 0.05, true);
      const legMat = makeStd('#1e293b', 0.3, 0.75);
      const h = item.height || 0.74;
      addBox(w, 0.06, d, 0, h - 0.03, 0, topMat);
      [-w / 2 + 0.08, w / 2 - 0.08].forEach((lx) => {
        [-d / 2 + 0.08, d / 2 - 0.08].forEach((lz) => {
          addBox(0.06, h - 0.06, 0.06, lx, (h - 0.06) / 2, lz, legMat);
        });
      });
      break;
    }

    case 'chair': {
      const seatMat = makeStd(baseHex, 0.65);
      const legMat = makeStd('#0f172a', 0.3, 0.75);
      addBox(w, 0.07, d, 0, 0.44, 0, seatMat);
      addBox(w, 0.44, 0.07, 0, 0.68, -d / 2 + 0.04, seatMat);
      [-w / 2 + 0.05, w / 2 - 0.05].forEach((lx) =>
        [-d / 2 + 0.05, d / 2 - 0.05].forEach((lz) => addBox(0.04, 0.42, 0.04, lx, 0.21, lz, legMat))
      );
      break;
    }

    case 'tv': {
      const consoleMat = makeStd('#475569', 0.4, 0.15, true);
      const screenMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        emissive: new THREE.Color(0x0ea5e9),
        emissiveIntensity: 0.18,
        roughness: 0.1,
        metalness: 0.4,
      });
      addBox(w, 0.42, d, 0, 0.21, 0, consoleMat);
      addBox(0.14, 0.16, 0.1, 0, 0.5, 0, makeStd('#0f172a', 0.3, 0.8));
      addBox(w * 0.88, 0.72, 0.05, 0, 0.92, 0, screenMat);
      break;
    }

    case 'kitchen_counter': {
      const baseMat = makeStd(baseHex, 0.35, 0.15);
      const stoneTopMat = makeStd('#1e293b', 0.2, 0.25);
      const steelMat = makeStd('#94a3b8', 0.2, 0.9);
      addBox(w, 0.84, d, 0, 0.42, 0, baseMat);
      addBox(w + 0.04, 0.05, d + 0.04, 0, 0.865, 0, stoneTopMat);
      // Integrated sink basin + stove burners
      addBox(w * 0.25, 0.03, d * 0.55, -w * 0.26, 0.895, 0, steelMat, false);
      addBox(w * 0.28, 0.03, d * 0.65, w * 0.24, 0.895, 0, makeStd('#0f172a', 0.15, 0.5), false);
      break;
    }

    case 'fridge': {
      const metalMat = makeStd(baseHex, 0.22, 0.78);
      const handleMat = makeStd('#334155', 0.25, 0.9);
      const h = item.height || 1.85;
      addBox(w, h, d, 0, h / 2, 0, metalMat);
      // Freezer split line + two vertical handles
      addBox(w + 0.01, 0.02, 0.02, 0, h * 0.68, d / 2 + 0.01, handleMat, false);
      addBox(0.03, 0.45, 0.04, -w * 0.36, h * 0.42, d / 2 + 0.025, handleMat, false);
      addBox(0.03, 0.28, 0.04, -w * 0.36, h * 0.82, d / 2 + 0.025, handleMat, false);
      break;
    }

    case 'washer': {
      const bodyMat = makeStd(baseHex, 0.25, 0.35);
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.5 });
      const h = item.height || 0.85;
      addBox(w, h, d, 0, h / 2, 0, bodyMat);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.28, w * 0.28, 0.05, 18), glassMat);
      drum.rotation.x = Math.PI / 2;
      drum.position.set(0, h * 0.46, d / 2 + 0.02);
      group.add(drum);
      addBox(w * 0.85, 0.12, 0.04, 0, h * 0.86, d / 2 + 0.02, makeStd('#334155', 0.3, 0.6), false);
      break;
    }

    case 'sink': {
      const cabMat = makeStd(baseHex, 0.25, 0.15);
      const chromeMat = makeStd('#cbd5e1', 0.15, 0.95);
      addBox(w, 0.72, d, 0, 0.36, 0, cabMat);
      addBox(w + 0.04, 0.08, d + 0.04, 0, 0.76, 0, makeStd('#ffffff', 0.15));
      // Faucet stem & spout
      addBox(0.04, 0.18, 0.04, 0, 0.89, -d * 0.28, chromeMat, false);
      addBox(0.04, 0.04, 0.14, 0, 0.96, -d * 0.18, chromeMat, false);
      break;
    }

    case 'toilet': {
      const porcMat = makeStd(baseHex, 0.15, 0.05);
      // Pedestal + bowl + tank
      addBox(w * 0.68, 0.36, d * 0.65, 0, 0.18, d * 0.1, porcMat);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.32, 0.1, 14), porcMat);
      bowl.position.set(0, 0.39, d * 0.12);
      group.add(bowl);
      addBox(w * 0.88, 0.42, d * 0.3, 0, 0.56, -d / 2 + d * 0.16, porcMat);
      break;
    }

    case 'shower': {
      const trayMat = makeStd('#f8fafc', 0.25);
      const glassWallMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.32,
        roughness: 0.08,
        metalness: 0.2,
      });
      const frameMat = makeStd('#0f172a', 0.25, 0.85);
      addBox(w, 0.08, d, 0, 0.04, 0, trayMat);
      addBox(w, 2.0, 0.03, 0, 1.04, d / 2 - 0.02, glassWallMat, false);
      addBox(0.03, 2.0, d, w / 2 - 0.02, 1.04, 0, glassWallMat, false);
      addBox(0.05, 2.05, 0.05, w / 2 - 0.02, 1.025, d / 2 - 0.02, frameMat);
      // Shower head
      addBox(0.18, 0.04, 0.18, -w * 0.2, 1.95, -d * 0.2, makeStd('#cbd5e1', 0.15, 0.9), false);
      break;
    }

    case 'lamp': {
      const poleMat = makeStd('#0f172a', 0.25, 0.85);
      const shadeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseHex),
        emissive: new THREE.Color('#fde68a'),
        emissiveIntensity: 0.55,
        roughness: 0.4,
      });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.45, 0.05, 14), poleMat);
      base.position.y = 0.025;
      group.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.4, 8), poleMat);
      pole.position.y = 0.72;
      pole.castShadow = true;
      group.add(pole);
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.32, w * 0.48, 0.32, 14), shadeMat);
      shade.position.y = 1.48;
      group.add(shade);
      break;
    }

    case 'plant': {
      const potMat = makeStd('#92400e', 0.65);
      const leafMat = makeStd(baseHex, 0.7);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.36, w * 0.26, 0.38, 12), potMat);
      pot.position.y = 0.19;
      pot.castShadow = true;
      group.add(pot);
      const bush1 = new THREE.Mesh(new THREE.DodecahedronGeometry(w * 0.42, 0), leafMat);
      bush1.position.y = 0.62;
      bush1.castShadow = true;
      group.add(bush1);
      const bush2 = new THREE.Mesh(new THREE.DodecahedronGeometry(w * 0.28, 0), leafMat);
      bush2.position.set(w * 0.12, 0.92, 0);
      group.add(bush2);
      break;
    }

    case 'decor': {
      const rugMat = makeStd(baseHex, 0.92);
      const borderMat = makeStd('#f8fafc', 0.85);
      addBox(w, 0.025, d, 0, 0.015, 0, rugMat, false);
      addBox(w * 0.72, 0.03, d * 0.72, 0, 0.018, 0, borderMat, false);
      break;
    }

    case 'car': {
      const carMat = makeStd(baseHex, 0.22, 0.78);
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.08, metalness: 0.4 });
      const wheelMat = makeStd('#0f172a', 0.85);
      addBox(w * 0.92, 0.5, d * 0.94, 0, 0.38, 0, carMat);
      addBox(w * 0.78, 0.42, d * 0.5, 0, 0.82, -d * 0.04, glassMat);
      [-w * 0.45, w * 0.45].forEach((wx) => {
        [-d * 0.32, d * 0.32].forEach((wz) => {
          const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14), wheelMat);
          tire.rotation.z = Math.PI / 2;
          tire.position.set(wx, 0.28, wz);
          group.add(tire);
        });
      });
      break;
    }

    default: {
      addBox(w, item.height || 0.7, d, 0, (item.height || 0.7) / 2, 0, makeStd(baseHex, 0.6));
      break;
    }
  }

  group.rotation.y = -(item.rotation * Math.PI) / 180;
  return group;
}
