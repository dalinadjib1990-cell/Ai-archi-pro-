import {
  BeamData,
  FoundationData,
  FurnitureCatalogType,
  FurnitureData,
  GeneratedHousePlan,
  OpeningData,
  RoomData,
  WallData,
} from '../types';

export interface FurnitureCatalogItem {
  type: FurnitureCatalogType;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  defaultWidth: number;
  defaultDepth: number;
  defaultHeight: number;
  defaultColor: string;
  categoryHint: RoomData['category'][];
}

/**
 * Complete 16-item (+ car) Smart Architectural Furniture Catalog
 */
export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  { type: 'bed', labelAr: 'سرير نوم', labelFr: 'Lit', labelEn: 'Bed', defaultWidth: 1.8, defaultDepth: 2.0, defaultHeight: 0.65, defaultColor: '#1d4ed8', categoryHint: ['bedroom'] },
  { type: 'wardrobe', labelAr: 'خزانة ملابس', labelFr: 'Armoire', labelEn: 'Wardrobe', defaultWidth: 1.8, defaultDepth: 0.6, defaultHeight: 2.1, defaultColor: '#78350f', categoryHint: ['bedroom'] },
  { type: 'desk', labelAr: 'مكتب عمل', labelFr: 'Bureau', labelEn: 'Desk', defaultWidth: 1.4, defaultDepth: 0.7, defaultHeight: 0.76, defaultColor: '#92400e', categoryHint: ['bedroom', 'living'] },
  { type: 'sofa', labelAr: 'أريكة / كنب', labelFr: 'Canapé', labelEn: 'Sofa', defaultWidth: 2.4, defaultDepth: 0.95, defaultHeight: 0.82, defaultColor: '#334155', categoryHint: ['living'] },
  { type: 'table', labelAr: 'طاولة', labelFr: 'Table', labelEn: 'Table', defaultWidth: 1.6, defaultDepth: 0.95, defaultHeight: 0.75, defaultColor: '#854d0e', categoryHint: ['living', 'kitchen'] },
  { type: 'chair', labelAr: 'كرسي', labelFr: 'Chaise', labelEn: 'Chair', defaultWidth: 0.55, defaultDepth: 0.55, defaultHeight: 0.85, defaultColor: '#475569', categoryHint: ['living', 'bedroom', 'kitchen'] },
  { type: 'tv', labelAr: 'تلفاز مع وحدة', labelFr: 'TV & Meuble', labelEn: 'TV Unit', defaultWidth: 1.6, defaultDepth: 0.4, defaultHeight: 1.15, defaultColor: '#0f172a', categoryHint: ['living', 'bedroom'] },
  { type: 'kitchen_counter', labelAr: 'منضدة مطبخ', labelFr: 'Comptoir Cuisine', labelEn: 'Kitchen Counter', defaultWidth: 2.4, defaultDepth: 0.7, defaultHeight: 0.9, defaultColor: '#e2e8f0', categoryHint: ['kitchen'] },
  { type: 'fridge', labelAr: 'ثلاجة', labelFr: 'Réfrigérateur', labelEn: 'Fridge', defaultWidth: 0.8, defaultDepth: 0.75, defaultHeight: 1.85, defaultColor: '#cbd5e1', categoryHint: ['kitchen'] },
  { type: 'washer', labelAr: 'غسالة', labelFr: 'Lave-linge', labelEn: 'Washer', defaultWidth: 0.65, defaultDepth: 0.65, defaultHeight: 0.85, defaultColor: '#f8fafc', categoryHint: ['bathroom', 'kitchen'] },
  { type: 'sink', labelAr: 'مغسلة', labelFr: 'Lavabo', labelEn: 'Sink', defaultWidth: 0.8, defaultDepth: 0.5, defaultHeight: 0.82, defaultColor: '#f8fafc', categoryHint: ['bathroom', 'kitchen'] },
  { type: 'toilet', labelAr: 'مرحاض', labelFr: 'WC', labelEn: 'Toilet', defaultWidth: 0.5, defaultDepth: 0.7, defaultHeight: 0.78, defaultColor: '#f8fafc', categoryHint: ['bathroom'] },
  { type: 'shower', labelAr: 'دش استحمام', labelFr: 'Douche', labelEn: 'Shower', defaultWidth: 0.95, defaultDepth: 0.95, defaultHeight: 2.05, defaultColor: '#38bdf8', categoryHint: ['bathroom'] },
  { type: 'lamp', labelAr: 'مصباح أرضي', labelFr: 'Lampadaire', labelEn: 'Floor Lamp', defaultWidth: 0.45, defaultDepth: 0.45, defaultHeight: 1.65, defaultColor: '#fbbf24', categoryHint: ['living', 'bedroom'] },
  { type: 'plant', labelAr: 'نبات زينة', labelFr: 'Plante', labelEn: 'Indoor Plant', defaultWidth: 0.55, defaultDepth: 0.55, defaultHeight: 1.25, defaultColor: '#16a34a', categoryHint: ['living', 'hall', 'outdoor', 'balcony'] },
  { type: 'decor', labelAr: 'عنصر ديكور / سجادة', labelFr: 'Décor / Tapis', labelEn: 'Decor / Rug', defaultWidth: 1.6, defaultDepth: 1.1, defaultHeight: 0.08, defaultColor: '#0ea5e9', categoryHint: ['living', 'bedroom', 'hall'] },
  { type: 'car', labelAr: 'سيارة', labelFr: 'Voiture', labelEn: 'Car', defaultWidth: 1.95, defaultDepth: 4.1, defaultHeight: 1.45, defaultColor: '#94a3b8', categoryHint: ['garage'] },
];

export function getCatalogItem(type: string): FurnitureCatalogItem {
  return (
    FURNITURE_CATALOG.find((c) => c.type === type) ||
    FURNITURE_CATALOG[3]
  );
}

/**
 * Snaps a coordinate point to existing wall endpoints / lines or 0.25m CAD grid.
 */
export function snapPointToWalls(
  x: number,
  y: number,
  floorWalls: WallData[],
  snapRadius = 0.35
): { x: number; y: number; snappedToWall: boolean } {
  let bestX = Math.round(x * 4) / 4; // 25cm grid
  let bestY = Math.round(y * 4) / 4;
  let bestDist = snapRadius;
  let snappedToWall = false;

  for (const w of floorWalls) {
    const d1 = Math.hypot(w.x1 - x, w.y1 - y);
    if (d1 < bestDist) {
      bestDist = d1;
      bestX = w.x1;
      bestY = w.y1;
      snappedToWall = true;
    }
    const d2 = Math.hypot(w.x2 - x, w.y2 - y);
    if (d2 < bestDist) {
      bestDist = d2;
      bestX = w.x2;
      bestY = w.y2;
      snappedToWall = true;
    }

    // Orthogonal projection onto wall segment
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > 0.01) {
      const t = Math.max(0, Math.min(1, ((x - w.x1) * dx + (y - w.y1) * dy) / lenSq));
      const px = w.x1 + t * dx;
      const py = w.y1 + t * dy;
      const dp = Math.hypot(px - x, py - y);
      if (dp < bestDist * 0.85) {
        bestDist = dp;
        bestX = Number(px.toFixed(2));
        bestY = Number(py.toFixed(2));
        snappedToWall = true;
      }
    }
  }

  return { x: Number(bestX.toFixed(2)), y: Number(bestY.toFixed(2)), snappedToWall };
}

/**
 * Adds a wall while automatically splitting any existing wall at T-junction intersections
 * so wall corners & intersections stay topologically connected.
 */
export function addWallWithJunctionSnapping(
  walls: WallData[],
  newWall: WallData
): WallData[] {
  const floorWalls = walls.filter((w) => w.floor === newWall.floor);
  const otherWalls = walls.filter((w) => w.floor !== newWall.floor);

  const p1 = snapPointToWalls(newWall.x1, newWall.y1, floorWalls, 0.35);
  const p2 = snapPointToWalls(newWall.x2, newWall.y2, floorWalls, 0.35);

  const cleanNew: WallData = {
    ...newWall,
    x1: p1.x,
    y1: p1.y,
    x2: p2.x,
    y2: p2.y,
    height: newWall.height ?? 3.2,
    wallType: newWall.wallType ?? (newWall.isExterior ? 'exterior' : 'interior'),
  };

  if (Math.hypot(cleanNew.x2 - cleanNew.x1, cleanNew.y2 - cleanNew.y1) < 0.3) {
    return walls;
  }

  // Split any wall where cleanNew's endpoints touch strictly inside the existing segment
  const resultingFloorWalls: WallData[] = [];
  for (const w of floorWalls) {
    let splitPoint: { x: number; y: number } | null = null;
    for (const pt of [
      { x: cleanNew.x1, y: cleanNew.y1 },
      { x: cleanNew.x2, y: cleanNew.y2 },
    ]) {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 0.25) continue;
      const t = ((pt.x - w.x1) * dx + (pt.y - w.y1) * dy) / lenSq;
      if (t > 0.08 && t < 0.92) {
        const projX = w.x1 + t * dx;
        const projY = w.y1 + t * dy;
        if (Math.hypot(pt.x - projX, pt.y - projY) < 0.18) {
          splitPoint = { x: Number(projX.toFixed(2)), y: Number(projY.toFixed(2)) };
          break;
        }
      }
    }

    if (splitPoint) {
      resultingFloorWalls.push(
        { ...w, id: `${w.id}-a`, x2: splitPoint.x, y2: splitPoint.y },
        { ...w, id: `${w.id}-b`, x1: splitPoint.x, y1: splitPoint.y }
      );
    } else {
      resultingFloorWalls.push(w);
    }
  }

  resultingFloorWalls.push(cleanNew);
  return [...otherWalls, ...resultingFloorWalls];
}

/**
 * Automatic Closed-Loop Room Detection from orthogonal & near-orthogonal wall graphs.
 * Preserves names/categories of matching existing rooms and creates new RoomData entries
 * for any newly enclosed wall loops.
 */
export function detectClosedRoomsFromWalls(
  walls: WallData[],
  existingRooms: RoomData[],
  floor: number
): RoomData[] {
  const floorWalls = walls.filter((w) => w.floor === floor);
  const otherFloorRooms = existingRooms.filter((r) => r.floor !== floor);
  const currentFloorExisting = existingRooms.filter((r) => r.floor === floor);

  if (floorWalls.length < 4) {
    return existingRooms;
  }

  // Collect snapped X and Y grid lines from all wall endpoints
  const snapCoord = (v: number) => Number((Math.round(v * 10) / 10).toFixed(1));
  const xsSet = new Set<number>();
  const ysSet = new Set<number>();
  floorWalls.forEach((w) => {
    xsSet.add(snapCoord(w.x1));
    xsSet.add(snapCoord(w.x2));
    ysSet.add(snapCoord(w.y1));
    ysSet.add(snapCoord(w.y2));
  });

  // Merge coordinates within 0.25m
  const mergeNear = (vals: number[]) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const out: number[] = [];
    for (const v of sorted) {
      if (out.length === 0 || v - out[out.length - 1] > 0.25) out.push(v);
    }
    return out;
  };

  const xs = mergeNear(Array.from(xsSet));
  const ys = mergeNear(Array.from(ysSet));
  if (xs.length < 2 || ys.length < 2) return existingRooms;

  const hasHorizWallBetween = (y: number, xA: number, xB: number) =>
    floorWalls.some((w) => {
      if (Math.abs(w.y1 - y) > 0.32 || Math.abs(w.y2 - y) > 0.32) return false;
      const wMin = Math.min(w.x1, w.x2) - 0.3;
      const wMax = Math.max(w.x1, w.x2) + 0.3;
      return wMin <= xA && wMax >= xB;
    });

  const hasVertWallBetween = (x: number, yA: number, yB: number) =>
    floorWalls.some((w) => {
      if (Math.abs(w.x1 - x) > 0.32 || Math.abs(w.x2 - x) > 0.32) return false;
      const wMin = Math.min(w.y1, w.y2) - 0.3;
      const wMax = Math.max(w.y1, w.y2) + 0.3;
      return wMin <= yA && wMax >= yB;
    });

  // Grid cell flood-fill union for enclosed cells (elementary faces)
  const cols = xs.length - 1;
  const rows = ys.length - 1;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const detectedBoxes: { x: number; y: number; width: number; length: number }[] = [];

  // Mark exterior cells via BFS from boundary
  const isOutside = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && !hasHorizWallBetween(ys[0], xs[c], xs[c + 1])) queue.push([r, c]);
      if (r === rows - 1 && !hasHorizWallBetween(ys[rows], xs[c], xs[c + 1])) queue.push([r, c]);
      if (c === 0 && !hasVertWallBetween(xs[0], ys[r], ys[r + 1])) queue.push([r, c]);
      if (c === cols - 1 && !hasVertWallBetween(xs[cols], ys[r], ys[r + 1])) queue.push([r, c]);
    }
  }
  for (const [r, c] of queue) {
    if (!isOutside[r][c]) isOutside[r][c] = true;
  }
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    // up
    if (r > 0 && !isOutside[r - 1][c] && !hasHorizWallBetween(ys[r], xs[c], xs[c + 1])) {
      isOutside[r - 1][c] = true;
      queue.push([r - 1, c]);
    }
    // down
    if (r < rows - 1 && !isOutside[r + 1][c] && !hasHorizWallBetween(ys[r + 1], xs[c], xs[c + 1])) {
      isOutside[r + 1][c] = true;
      queue.push([r + 1, c]);
    }
    // left
    if (c > 0 && !isOutside[r][c - 1] && !hasVertWallBetween(xs[c], ys[r], ys[r + 1])) {
      isOutside[r][c - 1] = true;
      queue.push([r, c - 1]);
    }
    // right
    if (c < cols - 1 && !isOutside[r][c + 1] && !hasVertWallBetween(xs[c + 1], ys[r], ys[r + 1])) {
      isOutside[r][c + 1] = true;
      queue.push([r, c + 1]);
    }
  }

  // Group enclosed contiguous cells into room bounding rectangles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited[r][c] || isOutside[r][c]) continue;
      const comp: [number, number][] = [[r, c]];
      visited[r][c] = true;
      let idx = 0;
      while (idx < comp.length) {
        const [cr, cc] = comp[idx++];
        if (cr > 0 && !visited[cr - 1][cc] && !isOutside[cr - 1][cc] && !hasHorizWallBetween(ys[cr], xs[cc], xs[cc + 1])) {
          visited[cr - 1][cc] = true;
          comp.push([cr - 1, cc]);
        }
        if (cr < rows - 1 && !visited[cr + 1][cc] && !isOutside[cr + 1][cc] && !hasHorizWallBetween(ys[cr + 1], xs[cc], xs[cc + 1])) {
          visited[cr + 1][cc] = true;
          comp.push([cr + 1, cc]);
        }
        if (cc > 0 && !visited[cr][cc - 1] && !isOutside[cr][cc - 1] && !hasVertWallBetween(xs[cc], ys[cr], ys[cr + 1])) {
          visited[cr][cc - 1] = true;
          comp.push([cr, cc - 1]);
        }
        if (cc < cols - 1 && !visited[cr][cc + 1] && !isOutside[cr][cc + 1] && !hasVertWallBetween(xs[cc + 1], ys[cr], ys[cr + 1])) {
          visited[cr][cc + 1] = true;
          comp.push([cr, cc + 1]);
        }
      }

      const minR = Math.min(...comp.map(([rr]) => rr));
      const maxR = Math.max(...comp.map(([rr]) => rr));
      const minC = Math.min(...comp.map(([, cc]) => cc));
      const maxC = Math.max(...comp.map(([, cc]) => cc));
      const bx = xs[minC];
      const by = ys[minR];
      const bw = Number((xs[maxC + 1] - bx).toFixed(1));
      const bl = Number((ys[maxR + 1] - by).toFixed(1));
      if (bw >= 1.2 && bl >= 1.2) {
        detectedBoxes.push({ x: bx, y: by, width: bw, length: bl });
      }
    }
  }

  if (detectedBoxes.length === 0) return existingRooms;

  // Match detected loops back to existing rooms or create fresh rooms
  const usedExisting = new Set<string>();
  const nextFloorRooms: RoomData[] = detectedBoxes.map((box, idx) => {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.length / 2;
    const match = currentFloorExisting.find(
      (r) =>
        !usedExisting.has(r.id) &&
        cx >= r.x - 0.3 &&
        cx <= r.x + r.width + 0.3 &&
        cy >= r.y - 0.3 &&
        cy <= r.y + r.length + 0.3
    );

    const area = Number((box.width * box.length).toFixed(1));
    if (match) {
      usedExisting.add(match.id);
      return {
        ...match,
        x: box.x,
        y: box.y,
        width: box.width,
        length: box.length,
        area,
      };
    }

    const cat: RoomData['category'] = area < 6.5 ? 'bathroom' : area < 11 ? 'bedroom' : 'living';
    return {
      id: `det-r-${floor}-${idx + 1}-${Date.now().toString().slice(-4)}`,
      nameAr: cat === 'bathroom' ? `فضاء خدمات ${idx + 1}` : `غرفة جديدة ${idx + 1}`,
      nameEn: `Detected Room ${idx + 1}`,
      width: box.width,
      length: box.length,
      area,
      floor,
      color: cat === 'bathroom' ? '#06b6d4' : cat === 'bedroom' ? '#6366f1' : '#3b82f6',
      description: 'تم اكتشاف الغرفة تلقائياً من الجدران المغلقة.',
      x: box.x,
      y: box.y,
      category: cat,
    };
  });

  // Keep non-walled outdoor/balcony spaces from existing floor
  const outdoorSpaces = currentFloorExisting.filter((r) => r.category === 'outdoor' || r.category === 'balcony');
  return [...otherFloorRooms, ...nextFloorRooms, ...outdoorSpaces];
}

/**
 * Clamps furniture coordinates strictly inside its containing room (or house bounds)
 * and snaps to adjacent wall within 0.25m if desired.
 */
export function clampFurnitureToRoom(
  item: FurnitureData,
  rooms: RoomData[],
  lotL: number,
  lotW: number,
  snapToRoomWalls = true
): FurnitureData {
  const floorRooms = rooms.filter((r) => r.floor === item.floor);
  const cx = item.x + item.width / 2;
  const cy = item.y + item.depth / 2;

  const targetRoom =
    floorRooms.find((r) => r.id === item.roomId) ||
    floorRooms.find((r) => cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.length);

  let nx = item.x;
  let ny = item.y;

  if (targetRoom) {
    const pad = 0.12;
    const minX = targetRoom.x + pad;
    const minY = targetRoom.y + pad;
    const maxX = Math.max(minX, targetRoom.x + targetRoom.width - item.width - pad);
    const maxY = Math.max(minY, targetRoom.y + targetRoom.length - item.depth - pad);
    nx = Math.max(minX, Math.min(maxX, nx));
    ny = Math.max(minY, Math.min(maxY, ny));

    if (snapToRoomWalls) {
      if (Math.abs(nx - minX) < 0.22) nx = minX;
      if (Math.abs(nx - maxX) < 0.22) nx = maxX;
      if (Math.abs(ny - minY) < 0.22) ny = minY;
      if (Math.abs(ny - maxY) < 0.22) ny = maxY;
    }
  } else {
    nx = Math.max(0.25, Math.min(lotL - item.width - 0.25, nx));
    ny = Math.max(0.25, Math.min(lotW - item.depth - 0.25, ny));
  }

  return {
    ...item,
    x: Number(nx.toFixed(2)),
    y: Number(ny.toFixed(2)),
    roomId: targetRoom?.id,
  };
}

function isNearDoorway(x: number, y: number, w: number, d: number, doors: OpeningData[]): boolean {
  const fcx = x + w / 2;
  const fcy = y + d / 2;
  for (const op of doors) {
    const dcx = op.rotation === 90 || op.rotation === 270 ? op.x : op.x + op.width / 2;
    const dcy = op.rotation === 90 || op.rotation === 270 ? op.y + op.width / 2 : op.y;
    const clearance = Math.max(0.95, op.width * 0.85);
    if (Math.hypot(fcx - dcx, fcy - dcy) < clearance + Math.min(w, d) * 0.45) {
      return true;
    }
  }
  return false;
}

/**
 * SMART FURNISH: Automatically arranges realistic, non-blocking furniture
 * inside every room based on room category, dimensions, and doorway clearance.
 */
export function smartFurnishPlan(plan: GeneratedHousePlan): GeneratedHousePlan {
  const newFurniture: FurnitureData[] = [];
  let fIdx = 1;

  const pushItem = (
    rm: RoomData,
    type: FurnitureCatalogType,
    x: number,
    y: number,
    w: number,
    d: number,
    rotation: number,
    customLabel?: string,
    customColor?: string
  ) => {
    const catItem = getCatalogItem(type);
    const floorDoors = plan.openings.filter((o) => o.floor === rm.floor && o.type === 'door');
    const clampedW = Number(Math.min(Math.max(0.35, rm.width - 0.35), w).toFixed(2));
    const clampedD = Number(Math.min(Math.max(0.35, rm.length - 0.35), d).toFixed(2));
    let px = Math.max(rm.x + 0.15, Math.min(rm.x + rm.width - clampedW - 0.15, x));
    let py = Math.max(rm.y + 0.15, Math.min(rm.y + rm.length - clampedD - 0.15, y));

    // If conflicting with doorway swing, shift slightly away toward center
    if (isNearDoorway(px, py, clampedW, clampedD, floorDoors)) {
      px = Number((rm.x + (rm.width - clampedW) / 2).toFixed(2));
      py = Number((rm.y + (rm.length - clampedD) / 2).toFixed(2));
    }

    newFurniture.push({
      id: `sf-${fIdx++}`,
      type,
      label: customLabel || catItem.labelAr,
      x: Number(px.toFixed(2)),
      y: Number(py.toFixed(2)),
      width: clampedW,
      depth: clampedD,
      height: catItem.defaultHeight,
      color: customColor || catItem.defaultColor,
      scale: 1,
      rotation,
      floor: rm.floor,
      roomId: rm.id,
    });
  };

  for (const rm of plan.rooms) {
    if (rm.category === 'bedroom') {
      const isMaster = rm.nameAr.includes('ماستر') || rm.nameAr.includes('رئيسي');
      const bedW = isMaster ? 1.85 : 1.45;
      const bedD = 1.95;
      pushItem(rm, 'bed', rm.x + (rm.width - bedW) / 2, rm.y + 0.25, bedW, bedD, 0, isMaster ? 'سرير ماستر كينج' : 'سرير نوم');
      if (rm.width >= 3.2) {
        pushItem(rm, 'wardrobe', rm.x + 0.2, rm.y + rm.length - 0.78, Math.min(1.8, rm.width * 0.45), 0.58, 0);
      }
      if (rm.width >= 3.6 && rm.length >= 3.4) {
        pushItem(rm, 'desk', rm.x + rm.width - 1.35, rm.y + rm.length - 0.85, 1.15, 0.62, 0);
        pushItem(rm, 'chair', rm.x + rm.width - 1.0, rm.y + rm.length - 1.42, 0.5, 0.5, 0);
      }
      pushItem(rm, 'lamp', rm.x + 0.22, rm.y + 0.25, 0.4, 0.4, 0);
    } else if (rm.category === 'living') {
      const sofaW = Math.min(2.6, Math.max(1.6, rm.width * 0.55));
      pushItem(rm, 'sofa', rm.x + (rm.width - sofaW) / 2, rm.y + 0.3, sofaW, 0.9, 0);
      pushItem(rm, 'decor', rm.x + (rm.width - 1.8) / 2, rm.y + (rm.length - 1.2) / 2, 1.8, 1.2, 0, 'سجادة صالة');
      pushItem(rm, 'table', rm.x + (rm.width - 1.2) / 2, rm.y + (rm.length - 0.65) / 2, 1.2, 0.65, 0, 'طاولة ضيافة');
      pushItem(rm, 'tv', rm.x + (rm.width - 1.5) / 2, rm.y + rm.length - 0.55, 1.5, 0.36, 180);
      if (rm.width >= 3.8) {
        pushItem(rm, 'plant', rm.x + 0.22, rm.y + rm.length - 0.72, 0.5, 0.5, 0);
        pushItem(rm, 'lamp', rm.x + rm.width - 0.65, rm.y + 0.25, 0.42, 0.42, 0);
      }
    } else if (rm.category === 'kitchen') {
      const cW = Math.min(2.6, rm.width - 1.1);
      pushItem(rm, 'kitchen_counter', rm.x + 0.2, rm.y + 0.2, cW, 0.68, 0);
      pushItem(rm, 'fridge', rm.x + rm.width - 0.92, rm.y + 0.2, 0.75, 0.72, 0);
      if (rm.length >= 3.2) {
        pushItem(rm, 'table', rm.x + (rm.width - 1.2) / 2, rm.y + rm.length - 1.05, 1.2, 0.75, 0, 'طاولة مطبخ');
      }
    } else if (rm.category === 'bathroom') {
      pushItem(rm, 'sink', rm.x + 0.18, rm.y + 0.18, 0.75, 0.48, 0);
      pushItem(rm, 'toilet', rm.x + rm.width - 0.68, rm.y + 0.18, 0.48, 0.68, 0);
      if (rm.length >= 2.1) {
        pushItem(rm, 'shower', rm.x + 0.18, rm.y + rm.length - 1.08, 0.9, 0.9, 0);
      }
      if (rm.width >= 2.2 && rm.length >= 2.2) {
        pushItem(rm, 'washer', rm.x + rm.width - 0.82, rm.y + rm.length - 0.82, 0.62, 0.62, 0);
      }
    } else if (rm.category === 'garage') {
      pushItem(rm, 'car', rm.x + (rm.width - 1.9) / 2, rm.y + (rm.length - 4.0) / 2, 1.9, 4.0, 0);
    } else if (rm.category === 'hall' || rm.category === 'outdoor' || rm.category === 'balcony') {
      if (rm.width >= 2.2 && rm.length >= 2.2) {
        pushItem(rm, 'plant', rm.x + 0.25, rm.y + 0.25, 0.55, 0.55, 0);
      }
    }
  }

  return {
    ...plan,
    params: { ...plan.params, showFurniture: true },
    furniture: newFurniture,
  };
}

/**
 * Derives isolated footings (foundations) and concrete tie beams for 3D Structure Mode & Specs.
 */
export function deriveStructuralElements(plan: GeneratedHousePlan): {
  foundations: FoundationData[];
  beams: BeamData[];
} {
  const foundations: FoundationData[] = plan.columns.map((col, i) => ({
    id: `fnd-${i + 1}`,
    x: col.x,
    y: col.y,
    width: 1.35,
    length: 1.35,
    depth: 0.45,
    columnId: col.id,
  }));

  const beams: BeamData[] = [];
  const floors = Math.max(1, plan.params.floorsCount || 1);
  // Group column grid rows & columns by Y and X
  const uniqueXs = Array.from(new Set(plan.columns.map((c) => Number(c.x.toFixed(1))))).sort((a, b) => a - b);
  const uniqueYs = Array.from(new Set(plan.columns.map((c) => Number(c.y.toFixed(1))))).sort((a, b) => a - b);

  for (let f = 0; f < floors; f++) {
    let bIdx = 1;
    // Beams along X for every column row Y
    if (uniqueXs.length >= 2) {
      const minX = uniqueXs[0];
      const maxX = uniqueXs[uniqueXs.length - 1];
      for (const gy of uniqueYs) {
        beams.push({
          id: `bm-${f}-x-${bIdx++}`,
          x1: minX,
          y1: gy,
          x2: maxX,
          y2: gy,
          width: 0.25,
          depth: 0.42,
          floor: f,
        });
      }
    }
    // Beams along Y for every column line X
    if (uniqueYs.length >= 2) {
      const minY = uniqueYs[0];
      const maxY = uniqueYs[uniqueYs.length - 1];
      for (const gx of uniqueXs) {
        beams.push({
          id: `bm-${f}-y-${bIdx++}`,
          x1: gx,
          y1: minY,
          x2: gx,
          y2: maxY,
          width: 0.25,
          depth: 0.42,
          floor: f,
        });
      }
    }
  }

  return { foundations, beams };
}
