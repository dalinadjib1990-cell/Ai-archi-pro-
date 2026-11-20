import {
  HouseInputParams,
  GeneratedHousePlan,
  RoomData,
  ColumnData,
  WallData,
  OpeningData,
  FurnitureData,
  ArchitecturalStyle,
  RoofType,
  FacadeImageData
} from '../types';

export type FacadeDirection = 'front' | 'back' | 'right' | 'left';

export interface ValidationResult {
  isValid: boolean;
  warning?: string;
  suggestion?: string;
  minAreaNeeded: number;
  totalLotArea: number;
  totalBuiltAreaAvailable: number;
  estimatedFloorsNeeded: number;
}

/**
 * Normalizes openFacadeDirections so it always matches facadesCount
 * and guarantees at least the main street facade ('front') is open.
 */
export function normalizeOpenFacades(params: HouseInputParams): FacadeDirection[] {
  const count = Math.max(1, Math.min(4, Number(params.facadesCount) || 2));
  const allOrder: FacadeDirection[] = ['front', 'left', 'back', 'right'];

  const provided = Array.isArray(params.openFacadeDirections)
    ? params.openFacadeDirections.filter((d): d is FacadeDirection =>
        d === 'front' || d === 'back' || d === 'right' || d === 'left'
      )
    : [];

  const unique: FacadeDirection[] = [];
  if (provided.includes('front')) unique.push('front');
  for (const dir of provided) {
    if (!unique.includes(dir)) unique.push(dir);
  }
  if (!unique.includes('front')) {
    unique.unshift('front');
  }

  for (const fallbackDir of allOrder) {
    if (unique.length >= count) break;
    if (!unique.includes(fallbackDir)) unique.push(fallbackDir);
  }

  return unique.slice(0, count);
}

/**
 * Validates whether user inputs can physically fit the requested rooms and spaces,
 * and suggests adjustments if there is an area deficit or contradiction.
 */
export function validateHouseInputs(params: HouseInputParams): ValidationResult {
  const L = Math.max(1, Number(params.length) || 15);
  const W = Math.max(1, Number(params.width) || 10);
  const floors = Math.max(1, Number(params.floorsCount) || 1);
  const lotArea = Number((L * W).toFixed(1));

  const bedCount = Math.max(1, Number(params.bedroomsCount) || 3);
  const bathCount = Math.max(1, Number(params.bathroomsCount) || 2);
  const livingCount = Math.max(1, Number(params.livingRoomsCount) || 1);
  const kitchenCount = Math.max(1, Number(params.kitchensCount) || 1);

  let netRoomsArea = 0;
  netRoomsArea += 20 + (bedCount - 1) * 12;
  netRoomsArea += livingCount * 20;
  netRoomsArea += kitchenCount * 11;
  netRoomsArea += bathCount * 4.2;

  if (params.hasMajlis) netRoomsArea += 20;
  if (params.hasGarage) netRoomsArea += params.garageCapacity === 2 ? 30 : 17;
  if (params.hasGarden) netRoomsArea += 16;
  if (params.hasStairs || floors > 1) netRoomsArea += 9;
  if (params.hasCourtyard) netRoomsArea += 14;

  const grossAreaNeeded = Math.round(netRoomsArea * 1.15);
  const maxFootprint = Math.round(lotArea * 0.92);
  const totalBuiltAreaAvailable = Math.round(maxFootprint * floors);
  const estimatedFloorsNeeded = Math.ceil(grossAreaNeeded / Math.max(30, maxFootprint));

  if (grossAreaNeeded > totalBuiltAreaAvailable) {
    const deficit = grossAreaNeeded - totalBuiltAreaAvailable;
    const suggestedFloors = Math.max(floors + 1, estimatedFloorsNeeded);
    const suggestedLength = Math.ceil(Math.sqrt((grossAreaNeeded / floors) * (L / W)));
    const suggestedWidth = Math.ceil(suggestedLength / (L / W));

    return {
      isValid: false,
      warning: `المساحة المطلوبة للغرف والمرافق المختارة (${grossAreaNeeded}م²) تتجاوز مساحة البناء المتاحة (${totalBuiltAreaAvailable}م² عبر ${floors} طابق). عجز المساحة حوالي ${deficit}م².`,
      suggestion: `نقترح زيادة عدد الطوابق إلى ${suggestedFloors} طوابق، أو تكبير أبعاد الأرض لتصبح ${suggestedLength}م × ${suggestedWidth}م على الأقل، أو تقليل عدد الغرف لتناسب مساحة الأرض.`,
      minAreaNeeded: grossAreaNeeded,
      totalLotArea: lotArea,
      totalBuiltAreaAvailable,
      estimatedFloorsNeeded
    };
  }

  if (params.targetBuiltArea && params.targetBuiltArea > 0) {
    if (params.targetBuiltArea < grossAreaNeeded * 0.85) {
      return {
        isValid: false,
        warning: `مساحة البناء المحددة (${params.targetBuiltArea}م²) غير كافية لاستيعاب ${bedCount} غرف نوم و ${livingCount} صالات و ${bathCount} حمامات (${grossAreaNeeded}م² كحد أدنى).`,
        suggestion: `نقترح رفع مساحة البناء المطلوبة إلى ${grossAreaNeeded}م² أو تقليل عدد الغرف والمرافق.`,
        minAreaNeeded: grossAreaNeeded,
        totalLotArea: lotArea,
        totalBuiltAreaAvailable,
        estimatedFloorsNeeded
      };
    }
  }

  return {
    isValid: true,
    minAreaNeeded: grossAreaNeeded,
    totalLotArea: lotArea,
    totalBuiltAreaAvailable,
    estimatedFloorsNeeded
  };
}

/**
 * Generates style-accurate local facade image descriptors (no fragile external URLs).
 */
export function buildStyleFacadeImages(
  style: ArchitecturalStyle,
  roofType: RoofType,
  L: number,
  W: number,
  openDirs: FacadeDirection[],
  params: HouseInputParams,
  idPrefix: string
): FacadeImageData[] {
  const facadeSummary = openDirs
    .map((d) => (d === 'front' ? 'الأمامية' : d === 'back' ? 'الخلفية' : d === 'left' ? 'اليسرى' : 'اليمنى'))
    .join(' و');

  const mainUrl =
    style === 'algerian' || style === 'andalusian' || style === 'mediterranean'
      ? '/images/facades/algerian.jpg'
      : style === 'classic' || style === 'traditional'
      ? '/images/facades/classic.jpg'
      : '/images/facades/modern.jpg';

  const secondaryUrl =
    style === 'algerian' || style === 'andalusian'
      ? '/images/facades/classic.jpg'
      : '/images/facades/algerian.jpg';

  return [
    {
      id: `${idPrefix}-1`,
      title: `المنظور الرئيسي (${style}) — ${openDirs.length} واجهات مفتوحة`,
      description: `تجسيد لطراز (${style}) بأبعاد ${L}×${W}م مع توجيه الفتحات حصرياً نحو الواجهات المفتوحة (${facadeSummary}) وسقف ${roofType === 'flat' ? 'مسطح' : 'مائل'}.`,
      url: mainUrl,
      prompt: `Photorealistic ${style} exterior villa facade ${L}x${W}m, ${openDirs.length} open facades (${openDirs.join(', ')}), ${roofType} roof, ${params.wallMaterial || ''}, ${params.customNotes || ''}`
    },
    {
      id: `${idPrefix}-2`,
      title: 'الإضاءة المعمارية الليلية (Night LED View)',
      description: 'توزيع وحدات الإضاءة المخفية LED والسبوتلايت على الكتل البارزة والمدخل الرئيسي.',
      url: '/images/facades/night.jpg',
      prompt: `Luxury ${style} villa exterior at twilight blue hour with warm 2700K architectural LED lighting`
    },
    {
      id: `${idPrefix}-3`,
      title: 'المدخل والفناء المعماري (Courtyard & Entry)',
      description: `تنسيق الفضاء الخارجي والمدخل حسب الواجهات المفتوحة (${facadeSummary}) مع لمسات خامة: ${params.wallMaterial || 'حجر وخشب'}.`,
      url: secondaryUrl,
      prompt: `${style} house entrance archway and landscaped patio for ${L}x${W}m plot`
    }
  ];
}

interface PartitionBox {
  x: number;
  y: number;
  w: number;
  l: number;
}

/**
 * Slices a rectangular zone horizontally (left-to-right columns) into proportional rooms.
 */
function sliceColumns(box: PartitionBox, weights: number[]): PartitionBox[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const result: PartitionBox[] = [];
  let cursorX = box.x;
  weights.forEach((wt, idx) => {
    const isLast = idx === weights.length - 1;
    const w = isLast ? Number((box.x + box.w - cursorX).toFixed(2)) : Number(((box.w * wt) / total).toFixed(2));
    result.push({
      x: Number(cursorX.toFixed(2)),
      y: Number(box.y.toFixed(2)),
      w: Math.max(1.2, w),
      l: Number(box.l.toFixed(2))
    });
    cursorX += w;
  });
  return result;
}

/**
 * Slices a rectangular zone vertically (top-to-bottom rows) into proportional rooms.
 */
function sliceRows(box: PartitionBox, weights: number[]): PartitionBox[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const result: PartitionBox[] = [];
  let cursorY = box.y;
  weights.forEach((wt, idx) => {
    const isLast = idx === weights.length - 1;
    const l = isLast ? Number((box.y + box.l - cursorY).toFixed(2)) : Number(((box.l * wt) / total).toFixed(2));
    result.push({
      x: Number(box.x.toFixed(2)),
      y: Number(cursorY.toFixed(2)),
      w: Number(box.w.toFixed(2)),
      l: Math.max(1.2, l)
    });
    cursorY += l;
  });
  return result;
}

/**
 * Deterministic geometry builder: derives CAD walls, facade-respecting openings (windows & doors),
 * columns, and realistic furniture directly from rooms and openFacadeDirections.
 */
export function buildPlanGeometryFromRooms(
  rooms: RoomData[],
  params: HouseInputParams,
  bounds?: { offsetX: number; offsetY: number; footprintL: number; footprintW: number }
): {
  walls: WallData[];
  columns: ColumnData[];
  openings: OpeningData[];
  furniture: FurnitureData[];
} {
  const L = Math.max(6, Math.min(60, Number(params.length) || 15));
  const W = Math.max(5, Math.min(50, Number(params.width) || 10));
  const floors = Math.max(1, Math.min(4, Number(params.floorsCount) || 1));
  const openDirs = normalizeOpenFacades(params);

  const indoorAll = rooms.filter((r) => r.category !== 'outdoor' && r.category !== 'balcony');
  let offsetX = bounds?.offsetX ?? 0;
  let offsetY = bounds?.offsetY ?? 0;
  let footprintL = bounds?.footprintL ?? L;
  let footprintW = bounds?.footprintW ?? W;

  if (!bounds && indoorAll.length > 0) {
    const rawMinX = Math.max(0, Math.min(...indoorAll.map((r) => r.x)) - 0.25);
    const rawMaxX = Math.min(L, Math.max(...indoorAll.map((r) => r.x + r.width)) + 0.25);
    const rawMinY = Math.max(0, Math.min(...indoorAll.map((r) => r.y)) - 0.25);
    const rawMaxY = Math.min(W, Math.max(...indoorAll.map((r) => r.y + r.length)) + 0.25);
    const snappedMinX = rawMinX <= 0.6 ? 0 : Number(rawMinX.toFixed(1));
    const snappedMaxX = rawMaxX >= L - 0.6 ? L : Number(rawMaxX.toFixed(1));
    const snappedMinY = rawMinY <= 0.6 ? 0 : Number(rawMinY.toFixed(1));
    const snappedMaxY = rawMaxY >= W - 0.6 ? W : Number(rawMaxY.toFixed(1));
    if (snappedMaxX - snappedMinX >= 4.0 && snappedMaxY - snappedMinY >= 4.0) {
      offsetX = snappedMinX;
      offsetY = snappedMinY;
      footprintL = Number((snappedMaxX - snappedMinX).toFixed(2));
      footprintW = Number((snappedMaxY - snappedMinY).toFixed(2));
    }
  }

  const minX = offsetX;
  const maxX = Number((offsetX + footprintL).toFixed(2));
  const minY = offsetY;
  const maxY = Number((offsetY + footprintW).toFixed(2));

  // 1. Structural Column Grid (~3.8m - 4.4m spans)
  const colsCountX = Math.max(3, Math.ceil(footprintL / 4.2) + 1);
  const colsCountY = Math.max(3, Math.ceil(footprintW / 4.0) + 1);
  const columns: ColumnData[] = [];
  let colId = 1;
  const stepColX = (footprintL - 0.4) / (colsCountX - 1);
  const stepColY = (footprintW - 0.4) / (colsCountY - 1);

  for (let ix = 0; ix < colsCountX; ix++) {
    for (let iy = 0; iy < colsCountY; iy++) {
      const cx = Number((offsetX + 0.2 + ix * stepColX).toFixed(2));
      const cy = Number((offsetY + 0.2 + iy * stepColY).toFixed(2));
      const axisChar = String.fromCharCode(65 + ix);
      columns.push({
        id: `c-${colId++}`,
        x: cx,
        y: cy,
        sizeX: 0.25,
        sizeY: 0.45,
        gridAxis: `${axisChar}-${iy + 1}`,
        floorSpan: floors > 1 ? `كامل الطوابق (0 - ${floors - 1})` : 'الطابق الأرضي'
      });
    }
  }

  // 2. Walls (Exterior + Deduplicated Interior Partitions)
  const walls: WallData[] = [];
  const wallKeys = new Set<string>();

  const addWallOnce = (wall: WallData) => {
    const a = `${wall.x1.toFixed(1)},${wall.y1.toFixed(1)}`;
    const b = `${wall.x2.toFixed(1)},${wall.y2.toFixed(1)}`;
    const key = a < b ? `${wall.floor}:${a}-${b}` : `${wall.floor}:${b}-${a}`;
    if (!wallKeys.has(key)) {
      wallKeys.add(key);
      walls.push(wall);
    }
  };

  for (let f = 0; f < floors; f++) {
    // Exterior walls: back (y=minY), right (x=maxX), front (y=maxY), left (x=minX)
    walls.push(
      { id: `w-${f}-back`, x1: minX, y1: minY, x2: maxX, y2: minY, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-right`, x1: maxX, y1: minY, x2: maxX, y2: maxY, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-front`, x1: maxX, y1: maxY, x2: minX, y2: maxY, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-left`, x1: minX, y1: maxY, x2: minX, y2: minY, thickness: 0.25, isExterior: true, floor: f }
    );

    const floorRooms = rooms.filter((r) => r.floor === f && r.category !== 'balcony');
    floorRooms.forEach((rm, idx) => {
      const rx1 = Number(rm.x.toFixed(2));
      const ry1 = Number(rm.y.toFixed(2));
      const rx2 = Number((rm.x + rm.width).toFixed(2));
      const ry2 = Number((rm.y + rm.length).toFixed(2));

      // Only add interior edges that are NOT coincident with exterior boundary
      if (Math.abs(ry1 - minY) > 0.25) {
        addWallOnce({ id: `pw-${f}-${idx}-t`, x1: rx1, y1: ry1, x2: rx2, y2: ry1, thickness: 0.15, isExterior: false, floor: f });
      }
      if (Math.abs(rx2 - maxX) > 0.25) {
        addWallOnce({ id: `pw-${f}-${idx}-r`, x1: rx2, y1: ry1, x2: rx2, y2: ry2, thickness: 0.15, isExterior: false, floor: f });
      }
      if (Math.abs(ry2 - maxY) > 0.25) {
        addWallOnce({ id: `pw-${f}-${idx}-b`, x1: rx1, y1: ry2, x2: rx2, y2: ry2, thickness: 0.15, isExterior: false, floor: f });
      }
      if (Math.abs(rx1 - minX) > 0.25) {
        addWallOnce({ id: `pw-${f}-${idx}-l`, x1: rx1, y1: ry1, x2: rx1, y2: ry2, thickness: 0.15, isExterior: false, floor: f });
      }
    });
  }

  // 3. Facade-Aware Exterior & Courtyard Openings (Zero openings on closed party walls!)
  const openings: OpeningData[] = [];
  let opId = 1;
  const eps = 0.65; // tolerance from wall edge to detect room adjacency

  const isDaylightCategory = (cat: RoomData['category']) =>
    cat === 'living' || cat === 'bedroom' || cat === 'kitchen';

  for (let f = 0; f < floors; f++) {
    const floorRooms = rooms.filter((r) => r.floor === f);
    const courtyard = rooms.find((r) => r.floor === 0 && (r.nameAr.includes('فناء') || r.nameAr.includes('وسط الدار') || r.nameAr.includes('منور')));

    let mainEntrancePlaced = f !== 0;

    // A) FRONT WALL (y = maxY) — Open only if 'front' is in openDirs
    if (openDirs.includes('front')) {
      const indoorFloor = floorRooms.filter((r) => r.category !== 'outdoor' && r.category !== 'balcony');
      let frontRooms = indoorFloor.filter((r) => Math.abs((r.y + r.length) - maxY) <= eps);
      if (frontRooms.length === 0 && indoorFloor.length > 0) {
        const maxFloorY = Math.max(...indoorFloor.map((r) => r.y + r.length));
        frontRooms = indoorFloor.filter((r) => Math.abs((r.y + r.length) - maxFloorY) <= 1.2);
      }
      let frontWindowCount = 0;

      for (const rm of frontRooms) {
        if (rm.category === 'garage' && f === 0) {
          const gW = Number(Math.min(3.0, Math.max(2.2, rm.width * 0.72)).toFixed(2));
          openings.push({
            id: `op-${opId++}`,
            type: 'door',
            x: Number((rm.x + (rm.width - gW) / 2).toFixed(2)),
            y: Number((maxY - 0.12).toFixed(2)),
            width: gW,
            rotation: 0,
            label: 'باب المرآب الأوتوماتيكي',
            floor: f
          });
          continue;
        }

        if (!mainEntrancePlaced && (rm.category === 'living' || rm.category === 'hall' || frontRooms[0]?.id === rm.id)) {
          const dW = 1.4;
          openings.push({
            id: `op-${opId++}`,
            type: 'door',
            x: Number((rm.x + Math.min(0.6, Math.max(0.25, rm.width * 0.15))).toFixed(2)),
            y: Number((maxY - 0.12).toFixed(2)),
            width: dW,
            rotation: 0,
            label: 'المدخل الرئيسي الفاخر',
            floor: f
          });
          mainEntrancePlaced = true;

          // Remaining front wall of this room gets a window if wide enough
          if (rm.width > 3.4) {
            const winW = Number(Math.min(2.4, Math.max(1.2, rm.width * 0.42)).toFixed(2));
            openings.push({
              id: `op-${opId++}`,
              type: 'window',
              x: Number((rm.x + rm.width - winW - 0.35).toFixed(2)),
              y: Number((maxY - 0.12).toFixed(2)),
              width: winW,
              rotation: 0,
              label: `نافذة ${rm.nameAr}`,
              floor: f
            });
            frontWindowCount++;
          }
        } else if (isDaylightCategory(rm.category)) {
          const winW = Number(Math.min(2.6, Math.max(1.1, rm.width * 0.52)).toFixed(2));
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((rm.x + (rm.width - winW) / 2).toFixed(2)),
            y: Number((maxY - 0.12).toFixed(2)),
            width: winW,
            rotation: 0,
            label: `نافذة ${rm.nameAr}`,
            floor: f
          });
          frontWindowCount++;
        } else if (rm.category === 'bathroom') {
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((rm.x + Math.max(0.2, (rm.width - 0.8) / 2)).toFixed(2)),
            y: Number((maxY - 0.12).toFixed(2)),
            width: 0.8,
            rotation: 0,
            label: `هواية ${rm.nameAr}`,
            floor: f
          });
          frontWindowCount++;
        }
      }

      if (f === 0 && !mainEntrancePlaced) {
        openings.push({
          id: `op-${opId++}`,
          type: 'door',
          x: Number((minX + footprintL * 0.22).toFixed(2)),
          y: Number((maxY - 0.12).toFixed(2)),
          width: 1.4,
          rotation: 0,
          label: 'المدخل الرئيسي الفاخر',
          floor: 0
        });
      }

      if (frontWindowCount === 0) {
        openings.push({
          id: `op-${opId++}`,
          type: 'window',
          x: Number((minX + footprintL * 0.58).toFixed(2)),
          y: Number((maxY - 0.12).toFixed(2)),
          width: Number(Math.min(2.2, footprintL * 0.24).toFixed(2)),
          rotation: 0,
          label: f === 0 ? 'نافذة الواجهة الرئيسية' : `نافذة الطابق ${f}`,
          floor: f
        });
      }
    }

    // B) BACK WALL (y = minY) — Open ONLY if 'back' is in openDirs
    if (openDirs.includes('back')) {
      const backRooms = floorRooms.filter((r) => Math.abs(r.y - minY) <= eps && r.category !== 'outdoor' && r.category !== 'balcony');
      for (const rm of backRooms) {
        if (isDaylightCategory(rm.category)) {
          const winW = Number(Math.min(2.4, Math.max(1.1, rm.width * 0.5)).toFixed(2));
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((rm.x + (rm.width - winW) / 2).toFixed(2)),
            y: Number((minY + 0.12).toFixed(2)),
            width: winW,
            rotation: 180,
            label: `نافذة خلفية - ${rm.nameAr}`,
            floor: f
          });
        } else if (rm.category === 'bathroom') {
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((rm.x + Math.max(0.2, (rm.width - 0.8) / 2)).toFixed(2)),
            y: Number((minY + 0.12).toFixed(2)),
            width: 0.8,
            rotation: 180,
            label: `هواية ${rm.nameAr}`,
            floor: f
          });
        }
      }
    }

    // C) LEFT WALL (x = minX) — Open ONLY if 'left' is in openDirs
    if (openDirs.includes('left')) {
      const leftRooms = floorRooms.filter((r) => Math.abs(r.x - minX) <= eps && r.category !== 'outdoor' && r.category !== 'balcony');
      for (const rm of leftRooms) {
        if (isDaylightCategory(rm.category)) {
          const winW = Number(Math.min(2.2, Math.max(1.0, rm.length * 0.46)).toFixed(2));
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((minX + 0.12).toFixed(2)),
            y: Number((rm.y + (rm.length - winW) / 2).toFixed(2)),
            width: winW,
            rotation: 90,
            label: `نافذة يسار - ${rm.nameAr}`,
            floor: f
          });
        } else if (rm.category === 'bathroom') {
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((minX + 0.12).toFixed(2)),
            y: Number((rm.y + Math.max(0.2, (rm.length - 0.8) / 2)).toFixed(2)),
            width: 0.8,
            rotation: 90,
            label: `هواية ${rm.nameAr}`,
            floor: f
          });
        }
      }
    }

    // D) RIGHT WALL (x = maxX) — Open ONLY if 'right' is in openDirs
    if (openDirs.includes('right')) {
      const rightRooms = floorRooms.filter((r) => Math.abs((r.x + r.width) - maxX) <= eps && r.category !== 'outdoor' && r.category !== 'balcony');
      for (const rm of rightRooms) {
        if (rm.category === 'garage' && f === 0 && !openDirs.includes('front')) {
          openings.push({
            id: `op-${opId++}`,
            type: 'door',
            x: Number((maxX - 0.12).toFixed(2)),
            y: Number((rm.y + 0.4).toFixed(2)),
            width: 2.6,
            rotation: 270,
            label: 'باب المرآب الجانبي',
            floor: f
          });
        } else if (isDaylightCategory(rm.category)) {
          const winW = Number(Math.min(2.2, Math.max(1.0, rm.length * 0.46)).toFixed(2));
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((maxX - 0.12).toFixed(2)),
            y: Number((rm.y + (rm.length - winW) / 2).toFixed(2)),
            width: winW,
            rotation: 270,
            label: `نافذة يمين - ${rm.nameAr}`,
            floor: f
          });
        } else if (rm.category === 'bathroom') {
          openings.push({
            id: `op-${opId++}`,
            type: 'window',
            x: Number((maxX - 0.12).toFixed(2)),
            y: Number((rm.y + Math.max(0.2, (rm.length - 0.8) / 2)).toFixed(2)),
            width: 0.8,
            rotation: 270,
            label: `هواية ${rm.nameAr}`,
            floor: f
          });
        }
      }
    }

    // E) COURTYARD / LIGHTWELL OPENINGS (Ensures daylight when facades are closed!)
    if (courtyard) {
      const cy1 = courtyard.y;
      const cy2 = courtyard.y + courtyard.length;
      const cx1 = courtyard.x;
      const cx2 = courtyard.x + courtyard.width;

      for (const rm of floorRooms) {
        if (rm.id === courtyard.id || rm.category === 'outdoor') continue;
        // Touching courtyard top/bottom
        const overlapX = Math.min(rm.x + rm.width, cx2) - Math.max(rm.x, cx1);
        const overlapY = Math.min(rm.y + rm.length, cy2) - Math.max(rm.y, cy1);

        if (overlapX >= 1.2 && (Math.abs((rm.y + rm.length) - cy1) <= 0.4 || Math.abs(rm.y - cy2) <= 0.4)) {
          const isTopNeighbor = Math.abs((rm.y + rm.length) - cy1) <= 0.4;
          const winX = Math.max(rm.x, cx1) + (overlapX - Math.min(1.6, overlapX * 0.6)) / 2;
          openings.push({
            id: `op-${opId++}`,
            type: rm.category === 'living' ? 'door' : 'window',
            x: Number(winX.toFixed(2)),
            y: Number((isTopNeighbor ? cy1 : cy2).toFixed(2)),
            width: Number(Math.min(1.6, overlapX * 0.6).toFixed(2)),
            rotation: 0,
            label: `إطلالة الفناء - ${rm.nameAr}`,
            floor: f
          });
        } else if (overlapY >= 1.2 && (Math.abs((rm.x + rm.width) - cx1) <= 0.4 || Math.abs(rm.x - cx2) <= 0.4)) {
          const isLeftNeighbor = Math.abs((rm.x + rm.width) - cx1) <= 0.4;
          const winY = Math.max(rm.y, cy1) + (overlapY - Math.min(1.5, overlapY * 0.6)) / 2;
          openings.push({
            id: `op-${opId++}`,
            type: rm.category === 'living' ? 'door' : 'window',
            x: Number((isLeftNeighbor ? cx1 : cx2).toFixed(2)),
            y: Number(winY.toFixed(2)),
            width: Number(Math.min(1.5, overlapY * 0.6).toFixed(2)),
            rotation: 90,
            label: `إطلالة الفناء - ${rm.nameAr}`,
            floor: f
          });
        }
      }
    }

    // F) Interior Doors between rooms
    floorRooms.forEach((rm, idx) => {
      if (rm.category === 'outdoor' || rm.category === 'balcony' || rm.category === 'hall') return;
      const doorW = rm.category === 'bathroom' ? 0.8 : 0.95;
      // Put interior door on inner wall facing center of house
      const centerX = minX + footprintL / 2;
      const centerY = minY + footprintW / 2;
      const rmCx = rm.x + rm.width / 2;
      const rmCy = rm.y + rm.length / 2;

      if (Math.abs(rmCy - centerY) >= Math.abs(rmCx - centerX)) {
        const onTopWall = rmCy > centerY;
        const dy = onTopWall ? rm.y : rm.y + rm.length;
        if (Math.abs(dy - minY) > 0.55 && Math.abs(dy - maxY) > 0.55) {
          openings.push({
            id: `op-int-${f}-${idx}`,
            type: 'door',
            x: Number((rm.x + Math.max(0.25, (rm.width - doorW) / 2)).toFixed(2)),
            y: Number(dy.toFixed(2)),
            width: doorW,
            rotation: 0,
            label: `باب ${rm.nameAr}`,
            floor: f
          });
        }
      } else {
        const onLeftWall = rmCx > centerX;
        const dx = onLeftWall ? rm.x : rm.x + rm.width;
        if (Math.abs(dx - minX) > 0.55 && Math.abs(dx - maxX) > 0.55) {
          openings.push({
            id: `op-int-${f}-${idx}`,
            type: 'door',
            x: Number(dx.toFixed(2)),
            y: Number((rm.y + Math.max(0.25, (rm.length - doorW) / 2)).toFixed(2)),
            width: doorW,
            rotation: 90,
            label: `باب ${rm.nameAr}`,
            floor: f
          });
        }
      }
    });
  }

  // 4. Contextual Furniture inside every room
  const furniture: FurnitureData[] = [];
  rooms.forEach((rm, idx) => {
    if (rm.category === 'living') {
      const sW = Number(Math.min(3.2, Math.max(1.8, rm.width * 0.62)).toFixed(2));
      const sD = Number(Math.min(1.8, Math.max(0.9, rm.length * 0.38)).toFixed(2));
      furniture.push({
        id: `furn-sofa-${idx}`,
        type: 'sofa',
        label: rm.nameAr.includes('مجلس') ? 'مجلس استقبال فاخر' : 'طقم كنب الصالة',
        x: Number((rm.x + (rm.width - sW) / 2).toFixed(2)),
        y: Number((rm.y + 0.45).toFixed(2)),
        width: sW,
        depth: sD,
        rotation: 0,
        floor: rm.floor
      });
      if (rm.width >= 3.8 && rm.length >= 3.6) {
        furniture.push({
          id: `furn-table-${idx}`,
          type: 'table',
          label: 'طاولة ضيافة / طعام',
          x: Number((rm.x + (rm.width - 1.8) / 2).toFixed(2)),
          y: Number((rm.y + rm.length - 1.5).toFixed(2)),
          width: 1.8,
          depth: 0.95,
          rotation: 0,
          floor: rm.floor
        });
      }
    } else if (rm.category === 'bedroom') {
      const isMaster = rm.nameAr.includes('الماستر') || rm.nameAr.includes('رئيسي');
      const bW = Number(Math.min(rm.width - 0.8, isMaster ? 2.0 : 1.6).toFixed(2));
      const bD = Number(Math.min(rm.length - 0.8, 2.0).toFixed(2));
      furniture.push({
        id: `furn-bed-${idx}`,
        type: 'bed',
        label: isMaster ? 'سرير كينج ماستر' : 'سرير نوم',
        x: Number((rm.x + (rm.width - bW) / 2).toFixed(2)),
        y: Number((rm.y + 0.45).toFixed(2)),
        width: bW,
        depth: bD,
        rotation: 0,
        floor: rm.floor
      });
    } else if (rm.category === 'kitchen') {
      const kW = Number(Math.min(rm.width - 0.6, 2.8).toFixed(2));
      furniture.push({
        id: `furn-kit-${idx}`,
        type: 'kitchen_counter',
        label: 'خزائن وجزيرة المطبخ',
        x: Number((rm.x + 0.3).toFixed(2)),
        y: Number((rm.y + 0.3).toFixed(2)),
        width: kW,
        depth: 0.85,
        rotation: 0,
        floor: rm.floor
      });
    } else if (rm.category === 'garage') {
      const cW = Number(Math.min(rm.width - 0.7, 1.95).toFixed(2));
      const cD = Number(Math.min(rm.length - 0.8, 4.2).toFixed(2));
      furniture.push({
        id: `furn-car-${idx}`,
        type: 'car',
        label: 'سيارة بالمرآب',
        x: Number((rm.x + (rm.width - cW) / 2).toFixed(2)),
        y: Number((rm.y + (rm.length - cD) / 2).toFixed(2)),
        width: cW,
        depth: cD,
        rotation: 0,
        floor: rm.floor
      });
    }
  });

  return { walls, columns, openings, furniture };
}

/**
 * Deterministic Parametric 3D House Plan Generator
 * Respects openFacadeDirections (front = y=footprintW, back = y=0, left = x=0, right = x=footprintL)
 * without random overlap: daylight rooms sit along open facades or an automatic courtyard lightwell,
 * while blind/service rooms (bathrooms, stairs) pack along closed party walls.
 */
export function generateProceduralPlan(
  params: HouseInputParams,
  optionVariant: number = 0
): GeneratedHousePlan {
  const L = Math.max(6, Math.min(60, Number(params.length) || 15));
  const W = Math.max(5, Math.min(50, Number(params.width) || 10));
  const lotArea = Number((L * W).toFixed(1));
  const floors = Math.max(1, Math.min(4, Number(params.floorsCount) || 1));
  const style: ArchitecturalStyle = params.style || 'modern';
  const roofType: RoofType = params.roofType || 'flat';
  const openDirs = normalizeOpenFacades(params);
  const normalizedParams: HouseInputParams = {
    ...params,
    facadesCount: openDirs.length,
    openFacadeDirections: openDirs
  };

  const bedroomsCount = Math.max(1, Math.min(10, Number(params.bedroomsCount) || 3));
  const bathroomsCount = Math.max(1, Math.min(8, Number(params.bathroomsCount) || 2));
  const livingRoomsCount = Math.max(1, Math.min(5, Number(params.livingRoomsCount) || 1));
  const kitchensCount = Math.max(1, Math.min(3, Number(params.kitchensCount) || 1));

  // Footprint & setbacks
  let footprintL = L;
  let footprintW = W;
  let offsetX = 0;
  let offsetY = 0;

  if (params.targetBuiltArea && params.targetBuiltArea > 0) {
    const singleFloorTarget = params.targetBuiltArea / floors;
    if (singleFloorTarget < lotArea * 0.94) {
      const scale = Math.sqrt(singleFloorTarget / lotArea);
      footprintL = Number(Math.max(5.5, L * scale).toFixed(1));
      footprintW = Number(Math.max(5.0, W * scale).toFixed(1));
      // Keep closed walls flush to party boundary, pull back only on open sides
      const freeX = (openDirs.includes('left') ? 1 : 0) + (openDirs.includes('right') ? 1 : 0);
      const freeY = (openDirs.includes('front') ? 1 : 0) + (openDirs.includes('back') ? 1 : 0);
      offsetX = freeX === 2 ? Number(((L - footprintL) / 2).toFixed(1)) : openDirs.includes('left') ? Number((L - footprintL).toFixed(1)) : 0;
      offsetY = freeY === 2 ? Number(((W - footprintW) / 2).toFixed(1)) : openDirs.includes('back') ? Number((W - footprintW).toFixed(1)) : 0;
      if (!openDirs.includes('left') && !openDirs.includes('right')) {
        offsetX = Number(((L - footprintL) / 2).toFixed(1));
      }
      if (!openDirs.includes('back') && openDirs.includes('front')) {
        // Party wall at back (y=0), front open setback
        offsetY = 0;
      }
    }
  }

  const openDirAr = openDirs
    .map((d) => (d === 'front' ? 'الأمامية' : d === 'back' ? 'الخلفية' : d === 'left' ? 'اليسرى' : 'اليمنى'))
    .join(' + ');

  const optionMetaVariants = [
    {
      title: 'الخيار 1: توزيع عصري مفتوح موجه للواجهات',
      badge: 'أعلى إضاءة وتدفق ✨',
      desc: `توزيع يضع فضاءات الاستقبال والمعيشة على الواجهات المفتوحة (${openDirAr}) والخدمات على الجدران الصماء.`
    },
    {
      title: 'الخيار 2: توزيع ملكي مفصول (جناح ضيوف معزول)',
      badge: 'أعلى خصوصية للعائلة 🏛️',
      desc: `فصل تام لمدخل ومجلس الضيوف بواجهة مستقلة عن جناح العائلة مع توجيه مثالي للنوافذ (${openDirAr}).`
    },
    {
      title: 'الخيار 3: نمط فناء وسطي (وسط الدار ومنور إضاءة)',
      badge: 'تراثي ومنعش مناخياً 🌿',
      desc: `فناء وسطي مفتوح يمدّ كافة الغرف الداخلية والخلفيات بالضوء والتهوية دون كشف الجيران.`
    },
    {
      title: 'الخيار 4: توزيع جناح مدمج على حرف L مع حديقة',
      badge: 'استغلال ذكي للأرض 📐',
      desc: `تركيز الكتلة السكنية لإفساح حديقة وجلسة عائلية محمية نحو الجهات المفتوحة (${openDirAr}).`
    },
    {
      title: 'الخيار 5: أجنحة فندقية فاخرة بإطلالات متقابلة',
      badge: 'فخامة وإطلالة 💎',
      desc: `تنظيم فندقي يرفع نسبة الغرف المطلة على الشوارع والحدائق المفتوحة (${openDirAr}).`
    }
  ];

  const variant = ((optionVariant % 5) + 5) % 5;
  const optMeta = optionMetaVariants[variant];

  const pad = 0.25;
  const bX0 = Number((offsetX + pad).toFixed(2));
  const bY0 = Number((offsetY + pad).toFixed(2));
  const bW = Number((footprintL - pad * 2).toFixed(2));
  const bL = Number((footprintW - pad * 2).toFixed(2));

  // Automatically enable courtyard/lightwell when facades <= 2 or explicitly requested
  const autoLightwell = openDirs.length <= 2 && bL >= 8.5;
  const includeCourtyard =
    Boolean(params.hasCourtyard) || variant === 2 || style === 'andalusian' || style === 'algerian' || autoLightwell;
  const needStairs = Boolean(params.hasStairs) || floors > 1;

  // Determine mirror polarity so open side gets light & variants meaningfully differ
  const preferLeftForGuest =
    variant === 1
      ? openDirs.includes('right') && !openDirs.includes('left')
      : openDirs.includes('left') || !openDirs.includes('right');

  const rooms: RoomData[] = [];
  let rCount = 1;

  const pushRoom = (
    nameAr: string,
    nameEn: string,
    box: PartitionBox,
    floor: number,
    category: RoomData['category'],
    color: string,
    description: string,
    customId?: string
  ) => {
    const w = Number(Math.max(1.4, box.w).toFixed(1));
    const l = Number(Math.max(1.4, box.l).toFixed(1));
    rooms.push({
      id: customId || `r-${rCount++}`,
      nameAr,
      nameEn,
      width: w,
      length: l,
      area: Number((w * l).toFixed(1)),
      floor,
      color,
      description,
      x: Number(box.x.toFixed(1)),
      y: Number(box.y.toFixed(1)),
      category
    });
  };

  // ========================
  // FLOOR 0 NON-OVERLAPPING BANDS
  // Front Band (y near bY0 + bL -> street side 'front'), Middle Core Band, Back Band (y near bY0 -> 'back')
  // ========================
  const frontBandRatio = floors === 1 ? 0.36 : 0.44;
  const midBandRatio = includeCourtyard || needStairs ? 0.24 : 0.14;
  const backBandRatio = Number((1 - frontBandRatio - midBandRatio).toFixed(2));

  const [backBand, midBand, frontBand] = sliceRows(
    { x: bX0, y: bY0, w: bW, l: bL },
    [backBandRatio, midBandRatio, frontBandRatio]
  );

  // --- FRONT BAND (Facing 'front' open street at y = maxY) ---
  // Contains: Majlis (if enabled), Main Living Room (or combined reception), Garage (if enabled)
  const frontItems: {
    nameAr: string;
    nameEn: string;
    cat: RoomData['category'];
    color: string;
    desc: string;
    weight: number;
  }[] = [];

  if (params.hasMajlis) {
    frontItems.push({
      nameAr: variant === 1 ? 'مجلس الضيوف المستقل (المدخل الملكي)' : 'مجلس الضيوف وصالون الاستقبال',
      nameEn: 'Majlis Reception',
      cat: 'living',
      color: style === 'algerian' || style === 'traditional' ? '#d97706' : '#2563eb',
      desc: 'مجلس استقبال رسمي يطل مباشرة على الواجهة الأمامية المفتوحة بمدخل مستقل.',
      weight: 1.35
    });
  }

  frontItems.push({
    nameAr: 'صالة المعيشة العائلية الرئيسية',
    nameEn: 'Family Living 1',
    cat: 'living',
    color: '#8b5cf6',
    desc: 'صالة رئيسية مفتوحة ذات واجهة زجاجية مطلة على الشارع/الفناء لتهوية وإضاءة طبيعية.',
    weight: params.hasMajlis ? 1.45 : 2.1
  });

  if (params.hasGarage) {
    frontItems.push({
      nameAr: `مرآب السيارات (${params.garageCapacity === 2 ? 'سيارتين' : 'سيارة'})`,
      nameEn: 'Garage',
      cat: 'garage',
      color: '#64748b',
      desc: 'مرآب مغطى على الواجهة الأمامية بباب أوتوماتيكي ومدخل مباشر للمنزل.',
      weight: params.garageCapacity === 2 ? 1.35 : 0.95
    });
  }

  // Flip horizontal order based on variant & open left/right facade
  const orderedFront = preferLeftForGuest ? frontItems : [...frontItems].reverse();
  const frontBoxes = sliceColumns(
    frontBand,
    orderedFront.map((i) => i.weight)
  );
  orderedFront.forEach((item, idx) => {
    pushRoom(item.nameAr, item.nameEn, frontBoxes[idx], 0, item.cat, item.color, item.desc);
  });

  // --- MIDDLE CORE BAND (Courtyard/Lightwell, Stairs, Bathrooms) ---
  // Put bathrooms on CLOSED neighbor side if one side is closed!
  const midItems: {
    nameAr: string;
    nameEn: string;
    cat: RoomData['category'];
    color: string;
    desc: string;
    weight: number;
    id?: string;
  }[] = [];

  // Guest/Ground Bathroom sits toward closed wall
  const groundBaths = floors === 1 ? Math.max(1, bathroomsCount) : params.hasMajlis ? 1 : 1;
  midItems.push({
    nameAr: params.hasMajlis ? 'مغاسل وحمام الضيوف' : 'حمام الطابق الأرضي',
    nameEn: 'Ground Bathroom',
    cat: 'bathroom',
    color: '#06b6d4',
    desc: 'خدمات صحية مموضعة في المنطقة الخلفية/الجانبية المغلقة لحفظ الواجهات المفتوحة للغرف.',
    weight: 0.75
  });

  if (needStairs) {
    midItems.push({
      nameAr: 'الدرج الرئيسي والبهو',
      nameEn: 'Main Staircase',
      cat: 'hall',
      color: '#64748b',
      desc: 'نواة السلم الخرساني والموزع المركزي الذي يربط كافة الطوابق.',
      weight: 0.95,
      id: 'r-stairs-0'
    });
  }

  if (includeCourtyard) {
    midItems.push({
      nameAr:
        style === 'algerian'
          ? 'وسط الدار (فناء مغاربي مفتوح)'
          : openDirs.length <= 2
          ? 'منور وفناء تهوية داخلي مشمس'
          : 'الفناء الداخلي المشمس (كورت يارد)',
      nameEn: 'Central Courtyard',
      cat: 'outdoor',
      color: '#06b6d4',
      desc: 'فناء مفتوح للسماء يمنح الغرف المحيطة إضاءة وتهوية طبيعية رغم إغلاق واجهات الجيران.',
      weight: 1.45
    });
  } else {
    midItems.push({
      nameAr: 'بهو التوزيع الداخلي',
      nameEn: 'Central Lobby',
      cat: 'hall',
      color: '#475569',
      desc: 'موزع حركي يربط الفضاءات الأمامية بالمطبخ والغرف الخلفية.',
      weight: 1.15
    });
  }

  if (floors === 1 && bathroomsCount >= 2) {
    midItems.push({
      id: 'r-bath-shared-0',
      nameAr: 'حمام العائلة المشترك',
      nameEn: 'Family Bathroom',
      cat: 'bathroom',
      color: '#14b8a6',
      desc: 'حمام عائلي متكامل بتهوية نحو المنور أو الواجهة المفتوحة.',
      weight: 0.75
    });
  }

  // Place bathrooms against closed left or right wall when applicable
  const rightClosed = !openDirs.includes('right');
  const orderedMid = rightClosed ? [...midItems].reverse() : midItems;
  const midBoxes = sliceColumns(
    midBand,
    orderedMid.map((i) => i.weight)
  );
  orderedMid.forEach((item, idx) => {
    pushRoom(item.nameAr, item.nameEn, midBoxes[idx], 0, item.cat, item.color, item.desc, item.id);
  });

  // --- BACK BAND (y near bY0) ---
  // Contains: Kitchen(s), Garden (if enabled), and Bedrooms if floors === 1
  const backItems: {
    nameAr: string;
    nameEn: string;
    cat: RoomData['category'];
    color: string;
    desc: string;
    weight: number;
    id?: string;
  }[] = [];

  for (let k = 1; k <= kitchensCount; k++) {
    backItems.push({
      nameAr: k === 1 ? (variant === 0 ? 'المطبخ الأمريكي المفتوح مع طعام' : 'المطبخ الرئيسي') : `مطبخ تحضيري ${k}`,
      nameEn: `Kitchen ${k}`,
      cat: 'kitchen',
      color: '#f59e0b',
      desc: openDirs.includes('back') || openDirs.includes('left') || openDirs.includes('right')
        ? 'مطبخ مجهز بتهوية وإضاءة طبيعية نحو الواجهة المفتوحة.'
        : 'مطبخ مجهز بتهوية مباشرة نحو الفناء/المنور الداخلي.',
      weight: k === 1 ? 1.25 : 0.9
    });
  }

  if (params.hasGarden) {
    backItems.push({
      nameAr: 'الحديقة والجلسة الخضراء',
      nameEn: 'Outdoor Garden',
      cat: 'outdoor',
      color: '#10b981',
      desc: 'مساحة خضراء للجلوس والتهوية المتكاملة ضمن حدود الأرض.',
      weight: 1.2
    });
  }

  // If 1 floor, distribute bedrooms across Back Band (and Front corner if needed)
  if (floors === 1) {
    for (let b = 1; b <= bedroomsCount; b++) {
      const isMaster = b === 1;
      backItems.push({
        id: `r-bed-${b}`,
        nameAr: isMaster ? 'جناح النوم الرئيسي (الماستر)' : `غرفة نوم ${b}`,
        nameEn: isMaster ? 'Master Bedroom' : `Bedroom ${b}`,
        cat: 'bedroom',
        color: isMaster ? '#6366f1' : '#3b82f6',
        desc: 'غرفة نوم متصلة بالواجهات المفتوحة أو الفناء الداخلي للتهوية والإضاءة.',
        weight: isMaster ? 1.35 : 1.05
      });
    }
  } else if (livingRoomsCount >= 2) {
    backItems.push({
      nameAr: 'صالة الطعام والمقلط العائلي',
      nameEn: 'Dining Room',
      cat: 'living',
      color: '#a855f7',
      desc: 'قاعة طعام متصلة بالمطبخ وتطل على الحديقة أو الفناء الداخلي.',
      weight: 1.2
    });
  }

  // Keep garden/bedrooms toward whichever side is open (back/left/right)
  const orderedBack = openDirs.includes('right') && !openDirs.includes('left') ? [...backItems].reverse() : backItems;
  if (orderedBack.length > 4) {
    // Split into 2 rows inside backBand so bedrooms remain spacious
    const [bRow1, bRow2] = sliceRows(backBand, [0.5, 0.5]);
    const half = Math.ceil(orderedBack.length / 2);
    const r1Items = orderedBack.slice(0, half);
    const r2Items = orderedBack.slice(half);
    const r1Boxes = sliceColumns(bRow1, r1Items.map((i) => i.weight));
    const r2Boxes = sliceColumns(bRow2, r2Items.map((i) => i.weight));
    r1Items.forEach((it, i) => pushRoom(it.nameAr, it.nameEn, r1Boxes[i], 0, it.cat, it.color, it.desc, it.id));
    r2Items.forEach((it, i) => pushRoom(it.nameAr, it.nameEn, r2Boxes[i], 0, it.cat, it.color, it.desc, it.id));
  } else {
    const backBoxes = sliceColumns(
      backBand,
      orderedBack.map((i) => i.weight)
    );
    orderedBack.forEach((item, idx) => {
      pushRoom(item.nameAr, item.nameEn, backBoxes[idx], 0, item.cat, item.color, item.desc, item.id);
    });
  }

  // ========================
  // UPPER FLOORS (f = 1 .. floors - 1)
  // Non-overlapping zones prioritizing bedrooms along open facades & bathrooms on closed sides
  // ========================
  if (floors > 1) {
    const upperFloorsCount = floors - 1;
    const stairRef = rooms.find((r) => r.id === 'r-stairs-0');

    for (let f = 1; f < floors; f++) {
      // Match the exact 3 horizontal bands from Floor 0 so stairs & courtyard voids never collide
      const [upBackZone, upMidZone, upFrontZone] = sliceRows(
        { x: bX0, y: bY0, w: bW, l: bL },
        [backBandRatio, midBandRatio, frontBandRatio]
      );

      // Staircase Landing at consistent X,Y inside upMidZone
      if (needStairs && stairRef) {
        pushRoom(
          `موزع الدرج (طابق ${f})`,
          `Staircase Landing Floor ${f}`,
          { x: stairRef.x, y: upMidZone.y, w: stairRef.width, l: upMidZone.l },
          f,
          'hall',
          '#64748b',
          'بهو وصول علوي يربط أجنحة النوم والصالة العلوية.',
          `r-stairs-${f}`
        );
      }

      // Distribute bedrooms fairly per floor
      const bedsStart = Math.floor(((f - 1) * bedroomsCount) / upperFloorsCount) + 1;
      const bedsEnd = Math.floor((f * bedroomsCount) / upperFloorsCount);
      const bedsOnThisFloor: number[] = [];
      for (let b = bedsStart; b <= bedsEnd; b++) bedsOnThisFloor.push(b);

      const hasUpperLiving = f === 1 && livingRoomsCount >= 2;
      const hasExtraLiving = f >= 2 && livingRoomsCount >= f + 1;
      const bathsHere = Math.max(1, Math.round(Math.max(1, bathroomsCount - 1) / upperFloorsCount));

      const frontUpperItems: {
        nameAr: string;
        nameEn: string;
        cat: RoomData['category'];
        color: string;
        desc: string;
        weight: number;
        id?: string;
      }[] = [];

      const backUpperItems: {
        nameAr: string;
        nameEn: string;
        cat: RoomData['category'];
        color: string;
        desc: string;
        weight: number;
        id?: string;
      }[] = [];

      bedsOnThisFloor.forEach((bNum, idx) => {
        const isMaster = bNum === 1;
        const item = {
          id: `r-bed-${bNum}`,
          nameAr: isMaster
            ? style === 'algerian'
              ? 'جناح الماستر الرئيسي (غرفة النوم الكبرى)'
              : 'جناح غرفة النوم الرئيسية (الماستر)'
            : `غرفة نوم ${bNum} (${bNum === 2 ? 'الأطفال' : bNum === 3 ? 'الشباب' : 'إضافية'})`,
          nameEn: isMaster ? 'Master Bedroom Suite' : `Bedroom ${bNum}`,
          cat: 'bedroom' as const,
          color: isMaster ? '#6366f1' : '#3b82f6',
          desc: isMaster
            ? 'جناح ماستر بإطلالة مباشرة على الواجهة المفتوحة مع حمام خاص وخزانة ملابس.'
            : 'غرفة نوم مريحة بتوجيه طبيعي للإضاءة والتهوية.',
          weight: isMaster ? 1.45 : 1.1
        };

        if (isMaster || idx % 2 === 0) {
          frontUpperItems.push(item);
        } else {
          backUpperItems.push(item);
        }
      });

      if (hasUpperLiving || hasExtraLiving) {
        frontUpperItems.push({
          nameAr: `صالة الجلوس العلوية (${f === 1 ? 'الأول' : `طابق ${f}`})`,
          nameEn: `Upper Living ${f}`,
          cat: 'living',
          color: '#8b5cf6',
          desc: 'صالة معيشة عائلية علوية بإطلالة على الواجهة الأمامية أو الشرفة.',
          weight: 1.25
        });
      }

      if (params.hasBalcony && f === 1) {
        frontUpperItems.push({
          nameAr: style === 'algerian' ? 'شرفة وتراس مشمس (سطيحة)' : 'شرفة وتراس إطلالة بانورامية',
          nameEn: 'Balcony Terrace',
          cat: 'balcony',
          color: '#ec4899',
          desc: 'شرفة مطلة على الواجهة المفتوحة فقط مع درابزين حماية زجاجي.',
          weight: 0.9
        });
      }

      // Place upper bathrooms either in upMidZone (beside stair shaft, at most once per side) or backUpperItems
      const midSpaceRight = stairRef ? (bX0 + bW) - (stairRef.x + stairRef.width) : bW;
      const midSpaceLeft = stairRef ? stairRef.x - bX0 : 0;
      let placedLeftMid = false;
      let placedRightMid = false;

      for (let hb = 1; hb <= bathsHere; hb++) {
        const bathName = f === 1 && hb === 1 ? 'حمام جناح الماستر الخاص' : `حمام علوي ${hb}`;
        if (!placedLeftMid && midSpaceLeft >= 2.2) {
          placedLeftMid = true;
          pushRoom(
            bathName,
            `Upper Bath ${hb}`,
            { x: bX0, y: upMidZone.y, w: Math.min(2.6, midSpaceLeft), l: upMidZone.l },
            f,
            'bathroom',
            '#14b8a6',
            'حمام مجهز بتهوية صحية وأطقم راقية وتكسيات بورسلان.',
            `r-bath-${f}-${hb}`
          );
        } else if (!placedRightMid && midSpaceRight >= 2.2) {
          placedRightMid = true;
          const bx = stairRef ? stairRef.x + stairRef.width : bX0;
          pushRoom(
            bathName,
            `Upper Bath ${hb}`,
            { x: bx, y: upMidZone.y, w: Math.min(2.6, midSpaceRight), l: upMidZone.l },
            f,
            'bathroom',
            '#14b8a6',
            'حمام مجهز بتهوية صحية وأطقم راقية وتكسيات بورسلان.',
            `r-bath-${f}-${hb}`
          );
        } else {
          backUpperItems.push({
            id: `r-bath-${f}-${hb}`,
            nameAr: bathName,
            nameEn: `Upper Bath ${hb}`,
            cat: 'bathroom',
            color: '#14b8a6',
            desc: 'حمام مجهز بتهوية صحية وأطقم راقية وتكسيات بورسلان.',
            weight: 0.7
          });
        }
      }

      if (frontUpperItems.length > 0) {
        const fBoxes = sliceColumns(upFrontZone, frontUpperItems.map((i) => i.weight));
        frontUpperItems.forEach((it, idx) => pushRoom(it.nameAr, it.nameEn, fBoxes[idx], f, it.cat, it.color, it.desc, it.id));
      }

      if (backUpperItems.length > 0) {
        const orderedBackUp = !openDirs.includes('right') ? backUpperItems : [...backUpperItems].reverse();
        const bBoxes = sliceColumns(upBackZone, orderedBackUp.map((i) => i.weight));
        orderedBackUp.forEach((it, idx) => pushRoom(it.nameAr, it.nameEn, bBoxes[idx], f, it.cat, it.color, it.desc, it.id));
      }
    }
  }

  // Generate CAD geometry from partitioned rooms & open facades
  const { walls, columns, openings, furniture } = buildPlanGeometryFromRooms(rooms, normalizedParams, {
    offsetX,
    offsetY,
    footprintL,
    footprintW
  });

  const buildingFootprintArea = Number((footprintL * footprintW).toFixed(1));
  const totalBuiltArea = Number((buildingFootprintArea * floors * 0.88).toFixed(1));

  const costPerM2 =
    style === 'luxury' ? 850 :
    style === 'algerian' || style === 'andalusian' ? 640 :
    style === 'classic' ? 620 :
    style === 'economic' ? 380 :
    520;

  const costMin = Math.round(totalBuiltArea * costPerM2 * 0.9);
  const costMax = Math.round(totalBuiltArea * costPerM2 * 1.25);

  const wallMatDesc =
    params.wallMaterial ||
    (style === 'algerian'
      ? 'طوب أحمر، قرميد قرمزي وجير تقليدي'
      : style === 'traditional'
      ? 'حجر جيري أبيض مع مشربيات خشبية'
      : style === 'luxury'
      ? 'رخام إيطالي وحجر طبيعي وزجاج بانوراما'
      : style === 'economic'
      ? 'بلك إسمنتي عازل وتشطيب اقتصادي'
      : 'خرسانة مسلحة وطوب عازل');

  const colsCountX = Math.max(3, Math.ceil(footprintL / 4.2) + 1);
  const colsCountY = Math.max(3, Math.ceil(footprintW / 4.0) + 1);

  return {
    id: `plan-parametric-${variant}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'procedural',
    aiModel: 'محرك التخطيط الهندسي المعتمد على الواجهات',
    optionTitle: optMeta.title,
    optionBadge: optMeta.badge,
    optionDescription: optMeta.desc,
    params: normalizedParams,
    specs: {
      title: `${optMeta.title} (${L}م × ${W}م - ${openDirs.length} واجهات مفتوحة)`,
      summary: `مخطط هندسي دقيق لقطعة أرض ${L}×${W}م بـ ${openDirs.length} واجهات مفتوحة (${openDirAr})، يضم ${bedroomsCount} غرف نوم و ${floors} طوابق، مع منع النوافذ نهائياً على الجدران الجارية الصماء.`,
      totalLandArea: lotArea,
      totalBuiltArea,
      buildingFootprintArea,
      recommendedColumnsCount: columns.length,
      columnsReasoning: `شبكة أعمدة خرسانية منتظمة (${colsCountX}×${colsCountY} عمود) بمسافات بحور آمنة لضمان توزيع الأحمال الإنشائية بكفاءة.`,
      orientationNotes: `تم وضع الصالات والغرف الرئيسية على الواجهات المفتوحة (${openDirAr}) وحصر الحمامات والخدمات نحو الجدران الملاصقة للجار.`,
      ventilationNotes: includeCourtyard
        ? `نظام تهوية وإضاءة طبيعية يعتمد على الواجهات المفتوحة والفناء الوسطي (وسط الدار/المنور) لضمان تجدد الهواء في كافة الغرف.`
        : `نظام تهوية متقابلة عبر الفتحات الموزعة على الواجهات المفتوحة (${openDirAr}).`,
      structuralNotes: `نظام إنشائي هيكلي خرساني معتمد، قواعد منفصلة وشريطية، وسقف هوردي بنمط ${roofType === 'flat' ? 'مسطح مع سترة' : 'مائل بالقرميد'}.`,
      estimatedCostMin: costMin,
      estimatedCostMax: costMax,
      currency: 'SAR',
      estimatedConcreteM3: Math.round(totalBuiltArea * 0.44),
      estimatedSteelTons: Number((totalBuiltArea * 0.046).toFixed(1)),
      estimatedBricksCount: Math.round(totalBuiltArea * 33)
    },
    rooms,
    walls,
    columns,
    openings,
    furniture,
    materials: {
      exteriorWallColor:
        params.facadeWallColor || (style === 'algerian' || style === 'traditional' ? '#fef3c7' : '#f8fafc'),
      interiorWallColor: '#f8fafc',
      roofColor: roofType === 'sloped' ? (style === 'algerian' ? '#b91c1c' : '#7f1d1d') : '#334155',
      windowFrameColor: '#0f172a',
      floorMaterial: style === 'luxury' ? 'رخام فاخر' : 'سيراميك وبورسلان نخب أول'
    },
    facadeImages: buildStyleFacadeImages(
      style,
      roofType,
      L,
      W,
      openDirs,
      normalizedParams,
      `f-proc-${variant}`
    )
  };
}

/**
 * Generate 3 diverse procedural options adhering strictly to user inputs & open facades.
 */
export function generateMultipleProceduralOptions(params: HouseInputParams): GeneratedHousePlan[] {
  return [
    generateProceduralPlan(params, 0),
    generateProceduralPlan(params, 1),
    generateProceduralPlan(params, 2)
  ];
}

/**
 * Recalculates walls, columns, facade-aware openings, and furniture when the user
 * modifies rooms inside the interactive Room Editor.
 */
export function updatePlanWithModifiedRooms(
  originalPlan: GeneratedHousePlan,
  modifiedRooms: RoomData[]
): GeneratedHousePlan {
  const { walls, columns, openings, furniture } = buildPlanGeometryFromRooms(modifiedRooms, originalPlan.params);

  return {
    ...originalPlan,
    rooms: modifiedRooms,
    walls,
    columns,
    openings,
    furniture
  };
}
