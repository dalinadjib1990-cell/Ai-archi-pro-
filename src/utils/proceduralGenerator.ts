import {
  HouseInputParams,
  GeneratedHousePlan,
  RoomData,
  ColumnData,
  WallData,
  OpeningData,
  FurnitureData,
  ArchitecturalStyle,
  RoofType
} from '../types';

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
 * Validates whether user inputs can physically fit the requested rooms and spaces,
 * and suggests adjustments if there is an area deficit or contradiction.
 */
export function validateHouseInputs(params: HouseInputParams): ValidationResult {
  const L = Math.max(1, Number(params.length) || 15);
  const W = Math.max(1, Number(params.width) || 10);
  const floors = Math.max(1, Number(params.floorsCount) || 1);
  const lotArea = Number((L * W).toFixed(1));

  // Minimum ergonomic area required per room type (in m²)
  const bedCount = Math.max(1, Number(params.bedroomsCount) || 3);
  const bathCount = Math.max(1, Number(params.bathroomsCount) || 2);
  const livingCount = Math.max(1, Number(params.livingRoomsCount) || 1);
  const kitchenCount = Math.max(1, Number(params.kitchensCount) || 1);

  let netRoomsArea = 0;
  // Bedrooms: Master (~22m²) + other rooms (~13m² each)
  netRoomsArea += 22 + (bedCount - 1) * 13;
  // Living rooms: ~22m² each
  netRoomsArea += livingCount * 22;
  // Kitchens: ~12m² each
  netRoomsArea += kitchenCount * 12;
  // Bathrooms: ~4.5m² each
  netRoomsArea += bathCount * 4.5;

  if (params.hasMajlis) netRoomsArea += 22;
  if (params.hasGarage) netRoomsArea += (params.garageCapacity === 2 ? 32 : 18);
  if (params.hasGarden) netRoomsArea += 20;
  if (params.hasStairs || floors > 1) netRoomsArea += 10;
  if (params.hasCourtyard) netRoomsArea += 18;

  // Add 18% for structural walls and internal hallways/circulation
  const grossAreaNeeded = Math.round(netRoomsArea * 1.18);

  // Maximum allowed ground footprint (assuming 75% coverage for villa set-backs, or full lot minus small clearance)
  const maxFootprint = Math.round(lotArea * 0.85);
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

  // Check targetBuiltArea if user explicitly supplied it
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
 * Procedural Parametric 3D House Plan Generator
 * Produces valid architectural room coordinates, walls, columns, doors, windows, and 3D specs.
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

  const bedroomsCount = Math.max(1, Math.min(10, Number(params.bedroomsCount) || 3));
  const bathroomsCount = Math.max(1, Math.min(8, Number(params.bathroomsCount) || 2));
  const livingRoomsCount = Math.max(1, Math.min(5, Number(params.livingRoomsCount) || 1));
  const kitchensCount = Math.max(1, Math.min(3, Number(params.kitchensCount) || 1));

  // Determine Footprint and Setbacks based on targetBuiltArea if provided
  let footprintL = L;
  let footprintW = W;
  let offsetX = 0;
  let offsetY = 0;

  if (params.targetBuiltArea && params.targetBuiltArea > 0) {
    const singleFloorTarget = params.targetBuiltArea / floors;
    if (singleFloorTarget < lotArea * 0.95) {
      const scale = Math.sqrt(singleFloorTarget / lotArea);
      footprintL = Number(Math.max(5.5, L * scale).toFixed(1));
      footprintW = Number(Math.max(5.0, W * scale).toFixed(1));
      offsetX = Number(((L - footprintL) / 2).toFixed(1));
      offsetY = Number(((W - footprintW) / 2).toFixed(1));
    }
  }

  // 5 Distinct Architectural Layout Strategies
  const optionMetaVariants = [
    {
      title: 'الخيار 1: توزيع عصري مفتوح مع صالة بانورامية',
      badge: 'أعلى انسيابية وإضاءة ✨',
      desc: `تصميم مفتوح يدمج الصالة الرئيسية بالحديقة الخارجية، مع ممرات حركة واسعة وتهوية طبيعية متقابلة.`
    },
    {
      title: 'الخيار 2: توزيع ملكي مفصول (جناح ضيوف معزول كلياً)',
      badge: 'أعلى خصوصية للعائلة 🏛️',
      desc: `فصل تام لمدخل ومجلس الضيوف ومغاسلهم عن فضاءات العائلة، بتوزيع ذكي يحفظ حرمة البيت.`
    },
    {
      title: 'الخيار 3: نمط فناء وسطي (وسط الدار الجزائري والأندلسي)',
      badge: 'طابع تراثي ومناخ منعش 🌿',
      desc: `توزيع حول فناء داخلي مشمس (وسط الدار) يوفر إضاءة وتجدد هواء دائم لكافة الغرف مع لمسة جمالية.`
    },
    {
      title: 'الخيار 4: توزيع بشكل حرف L مع حوش خاص',
      badge: 'استغلال اقتصادي فائق 📐',
      desc: `تصميم يركز الكتل المعمارية على شكل زاوية لتوفير حوش خلفي فسيح وإطلالة مباشرة لكل غرف النوم.`
    },
    {
      title: 'الخيار 5: توزيع أجنحة فندقية فاخرة',
      badge: 'فخامة وراحة قصوى 💎',
      desc: `توزيع يرتقي بغرف النوم إلى أجنحة فندقية واسعة مع غرف ملابس مدمجة وحمامات خاصة وشرفات إطلالة.`
    }
  ];

  const optMeta = optionMetaVariants[optionVariant % optionMetaVariants.length];

  // Structural Grid Columns (spaced 3.8m to 4.5m)
  const spanX = 4.0;
  const spanY = 4.0;
  const colsCountX = Math.max(3, Math.ceil(footprintL / spanX) + 1);
  const colsCountY = Math.max(3, Math.ceil(footprintW / spanY) + 1);
  const totalColumns = colsCountX * colsCountY;

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
        sizeY: 0.5,
        gridAxis: `${axisChar}-${iy + 1}`,
        floorSpan: floors > 1 ? `كامل الطوابق (0 - ${floors - 1})` : 'الطابق الأرضي'
      });
    }
  }

  // Dynamic Rooms Array
  const rooms: RoomData[] = [];
  let rCount = 1;

  // Margin buffer from footprint perimeter
  const pad = 0.35;
  const bX0 = offsetX + pad;
  const bY0 = offsetY + pad;
  const bW = footprintL - pad * 2;
  const bL = footprintW - pad * 2;

  // 1. Central Courtyard (وسط الدار / الفناء الداخلي)
  const includeCourtyard = params.hasCourtyard || optionVariant === 2 || style === 'andalusian' || style === 'algerian';
  let courtX = 0;
  let courtY = 0;
  let courtW = 0;
  let courtL = 0;

  if (includeCourtyard) {
    courtW = Number(Math.max(3.2, Math.min(5.5, bW * 0.28)).toFixed(1));
    courtL = Number(Math.max(3.2, Math.min(5.5, bL * 0.32)).toFixed(1));
    courtX = Number((bX0 + (bW - courtW) / 2).toFixed(1));
    courtY = Number((bY0 + (bL - courtL) / 2).toFixed(1));

    rooms.push({
      id: `r-${rCount++}`,
      nameAr: style === 'algerian' ? 'وسط الدار (فناء مغاربي مفتوح)' : 'الفناء الداخلي المشمس (كورت يارد)',
      nameEn: 'Central Courtyard',
      width: courtW,
      length: courtL,
      area: Number((courtW * courtL).toFixed(1)),
      floor: 0,
      color: '#06b6d4',
      description: 'فناء وسطي مفتوح للسماء بنباتات وزليج تقليدي أو نافورة مياه عذبة تعزز تلطيف الجو.',
      x: courtX,
      y: courtY,
      category: 'outdoor'
    });
  }

  // 2. Staircase Core (الدرج الداخلي) if multi-floor or hasStairs is enabled
  const needStairs = params.hasStairs || floors > 1;
  const stairW = 2.4;
  const stairL = Number(Math.min(3.6, bL * 0.35).toFixed(1));
  let stairX = 0;
  let stairY = 0;

  if (needStairs) {
    // Position stairs centrally or beside courtyard
    stairX = includeCourtyard ? Number((courtX + courtW + 0.3).toFixed(1)) : Number((bX0 + bW * 0.45).toFixed(1));
    if (stairX + stairW > bX0 + bW) stairX = Number((bX0 + bW - stairW - 0.4).toFixed(1));
    stairY = Number((bY0 + bL * 0.35).toFixed(1));

    // Place stairwell on ground floor
    rooms.push({
      id: `r-stairs-0`,
      nameAr: 'الدرج الرئيسي والبهو',
      nameEn: 'Main Staircase',
      width: stairW,
      length: stairL,
      area: Number((stairW * stairL).toFixed(1)),
      floor: 0,
      color: '#64748b',
      description: 'سلم خرساني مريح مع درابزين زجاجي وخزائن تخزين أسفل الدرج.',
      x: stairX,
      y: stairY,
      category: 'hall'
    });

    // Place stairwell on upper floors as well
    for (let f = 1; f < floors; f++) {
      rooms.push({
        id: `r-stairs-${f}`,
        nameAr: `موزع الدرج (طابق ${f})`,
        nameEn: `Staircase Landing Floor ${f}`,
        width: stairW,
        length: stairL,
        area: Number((stairW * stairL).toFixed(1)),
        floor: f,
        color: '#64748b',
        description: 'بهو وصول علوي يربط بين أجنحة النوم والصالة العلوية.',
        x: stairX,
        y: stairY,
        category: 'hall'
      });
    }
  }

  // 3. Majlis / Reception (Floor 0)
  if (params.hasMajlis) {
    const majW = Number(Math.min(bW * 0.46, Math.max(4.2, bW * 0.38)).toFixed(1));
    const majL = Number(Math.min(bL * 0.48, Math.max(4.0, bL * 0.4)).toFixed(1));
    const majX = optionVariant === 1 ? Number((bX0 + bW - majW).toFixed(1)) : bX0;
    const majY = bY0;

    rooms.push({
      id: `r-${rCount++}`,
      nameAr: optionVariant === 1 ? 'مجلس الضيوف المستقل (المدخل الملكي)' : 'مجلس الضيوف وصالون الاستقبال',
      nameEn: 'Majlis Reception',
      width: majW,
      length: majL,
      area: Number((majW * majL).toFixed(1)),
      floor: 0,
      color: style === 'algerian' || style === 'traditional' ? '#d97706' : '#2563eb',
      description: 'فضاء استقبال فخم بمدخل مباشر ونوافذ واسعة مطلة على الشارع الرئيسي.',
      x: majX,
      y: majY,
      category: 'living'
    });

    // Guest bathroom with vanity
    const gBathW = Number(Math.min(2.4, majW * 0.45).toFixed(1));
    const gBathL = Number(Math.min(2.2, majL * 0.45).toFixed(1));
    const gBathX = optionVariant === 1 ? Number((majX - gBathW - 0.2).toFixed(1)) : Number((majX + majW + 0.2).toFixed(1));
    rooms.push({
      id: `r-${rCount++}`,
      nameAr: 'مغاسل وحمام ضيوف',
      nameEn: 'Guest Bathroom',
      width: gBathW,
      length: gBathL,
      area: Number((gBathW * gBathL).toFixed(1)),
      floor: 0,
      color: '#06b6d4',
      description: 'مغاسل رخامية فاخرة وخدمات صحية لضيوف المجلس.',
      x: Math.max(bX0, Math.min(bX0 + bW - gBathW, gBathX)),
      y: bY0,
      category: 'bathroom'
    });
  }

  // 4. Family Living Room(s) (Floor 0 and Upper Floors)
  for (let l = 1; l <= livingRoomsCount; l++) {
    const isGround = l === 1 || floors === 1;
    const targetFloor = isGround ? 0 : 1;
    const livW = Number(Math.min(bW * 0.52, Math.max(4.4, bW * 0.44)).toFixed(1));
    const livL = Number(Math.min(bL * 0.46, Math.max(3.8, bL * 0.4)).toFixed(1));

    let livX = bX0;
    let livY = Number((bY0 + bL * 0.45).toFixed(1));

    if (optionVariant === 1) {
      livX = bX0;
      livY = bY0;
    } else if (includeCourtyard) {
      livX = bX0;
      livY = Number((courtY).toFixed(1));
    }

    if (!isGround) {
      livX = Number((bX0 + 0.5).toFixed(1));
      livY = Number((bY0 + 0.5).toFixed(1));
    }

    rooms.push({
      id: `r-${rCount++}`,
      nameAr: l === 1 ? 'صالة المعيشة العائلية الكبرى' : `صالة الجلوس العائلية (${l === 2 ? 'العلوية' : `إضافية ${l}`})`,
      nameEn: `Family Living ${l}`,
      width: livW,
      length: livL,
      area: Number((livW * livL).toFixed(1)),
      floor: targetFloor,
      color: '#8b5cf6',
      description: 'فضاء معيشة رئيسي مفتوح بإضاءة طبيعية وافرة وتواصل بصري.',
      x: Math.max(bX0, Math.min(bX0 + bW - livW, livX)),
      y: Math.max(bY0, Math.min(bY0 + bL - livL, livY)),
      category: 'living'
    });
  }

  // 5. Kitchen(s) (Floor 0)
  for (let k = 1; k <= kitchensCount; k++) {
    const kitW = Number(Math.min(bW * 0.38, Math.max(3.4, bW * 0.32)).toFixed(1));
    const kitL = Number(Math.min(bL * 0.42, Math.max(3.2, bL * 0.35)).toFixed(1));
    const kitX = Number((bX0 + bW - kitW).toFixed(1));
    const kitY = Number((bY0 + bL - kitL).toFixed(1));

    rooms.push({
      id: `r-${rCount++}`,
      nameAr: k === 1 ? (optionVariant === 0 ? 'المطبخ الأمريكي المفتوح مع جزيرة' : 'المطبخ الرئيسي وصالة الطعام') : `مطبخ تحضيري إضافي (Dirty Kitchen) ${k}`,
      nameEn: `Kitchen ${k}`,
      width: kitW,
      length: kitL,
      area: Number((kitW * kitL).toFixed(1)),
      floor: 0,
      color: '#f59e0b',
      description: 'مطبخ عصري مزود بتهوية مباشرة ومدخل خدمة خلفي.',
      x: Math.max(bX0, kitX),
      y: Math.max(bY0, kitY),
      category: 'kitchen'
    });
  }

  // 6. Garage (مرآب السيارات)
  if (params.hasGarage) {
    const isDouble = params.garageCapacity === 2;
    const garW = isDouble ? Number(Math.min(6.0, bW * 0.42).toFixed(1)) : Number(Math.min(4.0, bW * 0.28).toFixed(1));
    const garL = Number(Math.min(6.0, bL * 0.48).toFixed(1));
    const garX = Number((bX0 + bW - garW).toFixed(1));
    const garY = bY0;

    rooms.push({
      id: `r-${rCount++}`,
      nameAr: `مرآب السيارات (${isDouble ? 'سيارتين' : 'سيارة واحدة'})`,
      nameEn: 'Garage',
      width: garW,
      length: garL,
      area: Number((garW * garL).toFixed(1)),
      floor: 0,
      color: '#64748b',
      description: 'موقف سيارات مغطى ومحمي مع باب رول أوتوماتيكي ومدخل داخلي.',
      x: garX,
      y: garY,
      category: 'garage'
    });
  }

  // 7. Garden / Landscape (Floor 0)
  if (params.hasGarden) {
    const gdnW = Number(Math.min(bW * 0.38, Math.max(3.5, bW * 0.3)).toFixed(1));
    const gdnL = Number(Math.min(bL * 0.42, Math.max(3.5, bL * 0.32)).toFixed(1));
    const gdnX = bX0;
    const gdnY = Number((bY0 + bL - gdnL).toFixed(1));

    rooms.push({
      id: `r-${rCount++}`,
      nameAr: 'الحديقة الخارجية والجلسة الخضراء',
      nameEn: 'Outdoor Garden',
      width: gdnW,
      length: gdnL,
      area: Number((gdnW * gdnL).toFixed(1)),
      floor: 0,
      color: '#10b981',
      description: 'مسطح أخضر مع جلسة مشمسة ونباتات وزينة طبيعية.',
      x: gdnX,
      y: gdnY,
      category: 'outdoor'
    });
  }

  // 8. Dynamic Distribution of Bedrooms & Bathrooms
  // Single-floor houses MUST place ALL bedrooms on Floor 0.
  // Multi-floor houses place bedrooms primarily on Floor 1, and Floor 2 if 3+ floors.
  const bedWidth = Number(Math.min(bW * 0.44, Math.max(3.6, bW * (floors === 1 ? 0.3 : 0.38))).toFixed(1));
  const bedLength = Number(Math.min(bL * 0.45, Math.max(3.4, bL * (floors === 1 ? 0.32 : 0.36))).toFixed(1));

  for (let b = 1; b <= bedroomsCount; b++) {
    const isMaster = b === 1;

    let targetFloor = 0;
    if (floors === 1) {
      targetFloor = 0;
    } else if (floors === 2) {
      targetFloor = 1;
    } else if (floors >= 3) {
      targetFloor = b <= 3 ? 1 : 2;
    }

    // Grid coordinates on target floor
    const colsOnFloor = floors === 1 ? 3 : 2;
    const colIndex = (b - 1) % colsOnFloor;
    const rowIndex = Math.floor((b - 1) / colsOnFloor);

    let bx = Number((bX0 + colIndex * (bedWidth + 0.4)).toFixed(1));
    let by = Number((bY0 + rowIndex * (bedLength + 0.4)).toFixed(1));

    if (floors > 1 && isMaster) {
      // Master suite at front corner
      bx = bX0;
      by = bY0;
    }

    bx = Math.max(bX0, Math.min(bX0 + bW - bedWidth, bx));
    by = Math.max(bY0, Math.min(bY0 + bL - bedLength, by));

    const wActual = isMaster ? Number((bedWidth * 1.15).toFixed(1)) : bedWidth;
    const lActual = isMaster ? Number((bedLength * 1.1).toFixed(1)) : bedLength;

    rooms.push({
      id: `r-bed-${b}`,
      nameAr: isMaster
        ? (style === 'algerian' ? 'جناح الماستر الرئيسي (غرفة النوم الكبرى)' : 'جناح غرفة النوم الرئيسية (الماستر)')
        : `غرفة نوم ${b} (${b === 2 ? 'الأطفال' : b === 3 ? 'الشباب' : 'الضيوف'})`,
      nameEn: isMaster ? 'Master Bedroom Suite' : `Bedroom ${b}`,
      width: Math.min(bW - 0.2, wActual),
      length: Math.min(bL - 0.2, lActual),
      area: Number((wActual * lActual).toFixed(1)),
      floor: targetFloor,
      color: isMaster ? '#6366f1' : '#3b82f6',
      description: isMaster
        ? 'جناح ماستر ملوكي يتضمن منطقة سرير فخم، خزانة ملابس جدارية مدمجة، وحمام خاص.'
        : `غرفة نوم عصرية بمقاسات مريحة تستوعب سريراً ومكتب دراسة ودولاب ملابس.`,
      x: bx,
      y: by,
      category: 'bedroom'
    });
  }

  // Family bathrooms
  const remainingBaths = Math.max(1, bathroomsCount - (params.hasMajlis ? 1 : 0));
  for (let b = 1; b <= remainingBaths; b++) {
    const isMasterBath = b === 1;
    const targetFloor = floors === 1 ? 0 : (isMasterBath ? 1 : (floors >= 3 && b > 2 ? 2 : 1));

    const bathW = 2.4;
    const bathL = 2.2;
    const bathX = Number(Math.max(bX0, Math.min(bX0 + bW - bathW, bX0 + bW - bathW - 0.4 - (b - 1) * 2.6)).toFixed(1));
    const bathY = Number(Math.max(bY0, Math.min(bY0 + bL - bathL, bY0 + 0.5 + (b - 1) * 2.8)).toFixed(1));

    rooms.push({
      id: `r-bath-${b}`,
      nameAr: isMasterBath ? 'حمام جناح الماستر الخاص' : `حمام العائلة المشترك ${b}`,
      nameEn: `Bathroom ${b}`,
      width: bathW,
      length: bathL,
      area: Number((bathW * bathL).toFixed(1)),
      floor: targetFloor,
      color: '#14b8a6',
      description: 'حمام مجهز بتهوية صحية وأطقم راقية وتكسيات بورسلان مقاومة للرطوبة.',
      x: bathX,
      y: bathY,
      category: 'bathroom'
    });
  }

  // 9. Balcony / Terrace (Floor 1 or 2)
  if (params.hasBalcony && floors > 1) {
    const balcW = Number(Math.min(5.5, bW * 0.4).toFixed(1));
    const balcL = 2.2;
    rooms.push({
      id: `r-${rCount++}`,
      nameAr: style === 'algerian' ? 'شرفة وتراس مشمس (سطيحة)' : 'شرفة وتراس إطلالة بانورامية',
      nameEn: 'Balcony Terrace',
      width: balcW,
      length: balcL,
      area: Number((balcW * balcL).toFixed(1)),
      floor: 1,
      color: '#ec4899',
      description: 'شرفة بإطلالة مفتوحة مع درابزين حماية زجاجي أو ألومنيوم معاصر.',
      x: Number((bX0 + (bW - balcW) / 2).toFixed(1)),
      y: Number((bY0 + bL - balcL).toFixed(1)),
      category: 'balcony'
    });
  }

  // Exterior Perimeter Walls
  const walls: WallData[] = [];
  for (let f = 0; f < floors; f++) {
    walls.push(
      { id: `w-${f}-1`, x1: offsetX, y1: offsetY, x2: offsetX + footprintL, y2: offsetY, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-2`, x1: offsetX + footprintL, y1: offsetY, x2: offsetX + footprintL, y2: offsetY + footprintW, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-3`, x1: offsetX + footprintL, y1: offsetY + footprintW, x2: offsetX, y2: offsetY + footprintW, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-4`, x1: offsetX, y1: offsetY + footprintW, x2: offsetX, y2: offsetY, thickness: 0.25, isExterior: true, floor: f }
    );

    // Interior Partition Walls around each room
    const roomsOnFloor = rooms.filter((r) => r.floor === f && r.category !== 'outdoor');
    roomsOnFloor.forEach((rm, idx) => {
      // Room perimeter interior walls
      walls.push(
        { id: `pw-${f}-${idx}-1`, x1: rm.x, y1: rm.y, x2: rm.x + rm.width, y2: rm.y, thickness: 0.15, isExterior: false, floor: f },
        { id: `pw-${f}-${idx}-2`, x1: rm.x + rm.width, y1: rm.y, x2: rm.x + rm.width, y2: rm.y + rm.length, thickness: 0.15, isExterior: false, floor: f },
        { id: `pw-${f}-${idx}-3`, x1: rm.x + rm.width, y1: rm.y + rm.length, x2: rm.x, y2: rm.y + rm.length, thickness: 0.15, isExterior: false, floor: f },
        { id: `pw-${f}-${idx}-4`, x1: rm.x, y1: rm.y + rm.length, x2: rm.x, y2: rm.y, thickness: 0.15, isExterior: false, floor: f }
      );
    });
  }

  // Openings (Doors & Windows)
  const openings: OpeningData[] = [
    { id: 'op-main-door', type: 'door', x: Number((offsetX + footprintL * 0.25).toFixed(1)), y: offsetY + 0.1, width: 1.4, rotation: 0, label: 'المدخل الرئيسي الفاخر', floor: 0 },
    { id: 'op-win-front', type: 'window', x: Number((offsetX + footprintL * 0.6).toFixed(1)), y: offsetY + 0.1, width: 2.4, rotation: 0, label: 'نافذة الواجهة الأمامية', floor: 0 }
  ];

  if (params.openFacadeDirections?.includes('back') || !params.openFacadeDirections) {
    openings.push({
      id: 'op-win-back',
      type: 'window',
      x: Number((offsetX + footprintL * 0.4).toFixed(1)),
      y: Number((offsetY + footprintW - 0.1).toFixed(1)),
      width: 2.2,
      rotation: 0,
      label: 'نافذة الإطلالة الخلفية',
      floor: 0
    });
  }

  if (floors > 1) {
    openings.push(
      { id: 'op-f1-master-win', type: 'window', x: Number((offsetX + footprintL * 0.2).toFixed(1)), y: offsetY + 0.1, width: 2.6, rotation: 0, label: 'نافذة جناح الماستر البانورامية', floor: 1 },
      { id: 'op-f1-balc-door', type: 'door', x: Number((offsetX + footprintL * 0.5).toFixed(1)), y: Number((offsetY + footprintW - 0.1).toFixed(1)), width: 1.6, rotation: 0, label: 'باب الشرفة الزجاجي', floor: 1 }
    );
  }

  // Realistic Furniture Placements
  const furniture: FurnitureData[] = [
    { id: 'furn-sofa-main', type: 'sofa', label: 'طقم كنب الصالة الرئيسية', x: Number((bX0 + 0.8).toFixed(1)), y: Number((bY0 + bL * 0.48).toFixed(1)), width: 3.2, depth: 1.8, rotation: 0, floor: 0 },
    { id: 'furn-dining', type: 'table', label: 'طاولة طعام العائلة', x: Number((bX0 + bW * 0.4).toFixed(1)), y: Number((bY0 + bL * 0.65).toFixed(1)), width: 2.4, depth: 1.2, rotation: 0, floor: 0 }
  ];

  if (params.hasGarage) {
    furniture.push({
      id: 'furn-car-1',
      type: 'car',
      label: 'سيارة بالمرآب',
      x: Number((bX0 + bW - 3.2).toFixed(1)),
      y: Number((bY0 + 0.8).toFixed(1)),
      width: 2.0,
      depth: 4.4,
      rotation: 0,
      floor: 0
    });
  }

  // Beds in bedrooms
  rooms.filter((r) => r.category === 'bedroom').forEach((bRoom, idx) => {
    const isMaster = bRoom.nameAr.includes('الماستر');
    furniture.push({
      id: `furn-bed-${idx}`,
      type: 'bed',
      label: isMaster ? 'سرير كينج ماستر' : 'سرير نوم فردي/مزدوج',
      x: Number((bRoom.x + 0.6).toFixed(1)),
      y: Number((bRoom.y + 0.6).toFixed(1)),
      width: isMaster ? 2.0 : 1.6,
      depth: 2.0,
      rotation: 0,
      floor: bRoom.floor
    });
  });

  // Calculate Built Area and Structural Estimations
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

  const wallMatDesc = params.wallMaterial || (
    style === 'algerian' ? 'طوب أحمر، قرميد قرمزي وجير تقليدي' :
    style === 'traditional' ? 'حجر جيري أبيض مع مشربيات خشبية' :
    style === 'luxury' ? 'رخام إيطالي وحجر طبيعي وزجاج بانوراما' :
    style === 'economic' ? 'بلك إسمنتي عازل وتشطيب اقتصادي' :
    'خرسانة مسلحة وطوب عازل'
  );

  return {
    id: `plan-parametric-${optionVariant}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'procedural',
    aiModel: 'محرك النمذجة الهندسي البارامتري المطور',
    optionTitle: optMeta.title,
    optionBadge: optMeta.badge,
    optionDescription: optMeta.desc,
    params,
    specs: {
      title: `${optMeta.title} (${L}م × ${W}م - ${totalBuiltArea}م² مباني)`,
      summary: `مخطط معماري هندسي بارامتري مخصص بدقة لقطعة أرض ${L}×${W}م بعدد ${bedroomsCount} غرف نوم و ${floors} طوابق ونوع سقف ${roofType === 'flat' ? 'مسطح مع سترة علوية' : 'مائل بقرميد هندسي'}. خامة البناء: ${wallMatDesc}.`,
      totalLandArea: lotArea,
      totalBuiltArea,
      buildingFootprintArea,
      recommendedColumnsCount: totalColumns,
      columnsReasoning: `شبكة أعمدة خرسانية منتظمة (${colsCountX}×${colsCountY} عمود) بمسافات بحور آمنة (3.8 إلى 4.2 متر) لضمان توزيع الأحمال الإنشائية بكفاءة.`,
      orientationNotes: `توجيه مدروس لكتل البناء والفضاءات الرئيسية نحو الواجهات المفتوحة لضمان الاستفادة من ضوء الشمس والتهوية الطبيعية.`,
      ventilationNotes: `نظام تهوية متقابلة مع شبابيك واسعة، ${includeCourtyard ? 'وفناء وسطي (وسط الدار) يوفر تيار هواء طبيعي ومنعش.' : 'وممرات حركة تنعش فضاءات المعيشة.'}`,
      structuralNotes: `نظام إنشائي هيكلي خرساني معتمد، قواعد منفصلة وشريطية، وسقف هوردي عازل للصوت والحرارة بنمط سقف ${roofType === 'flat' ? 'مسطح' : 'مائل'}.`,
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
      exteriorWallColor: params.facadeWallColor || (style === 'algerian' || style === 'traditional' ? '#fef3c7' : '#f8fafc'),
      interiorWallColor: '#f8fafc',
      roofColor: roofType === 'sloped' ? (style === 'algerian' ? '#b91c1c' : '#7f1d1d') : '#334155',
      windowFrameColor: '#0f172a',
      floorMaterial: style === 'luxury' ? 'رخام فاخر' : 'سيراميك وبورسلان نخب أول'
    },
    facadeImages: [
      {
        id: `f-proc-${optionVariant}-1`,
        title: `الواجهة الرئيسية (${style} - سقف ${roofType === 'flat' ? 'مسطح' : 'مائل'})`,
        description: `تصميم معماري لطراز (${style}) لقطعة أرض ${L}×${W}م يعكس توجيهاتك وخامة: ${wallMatDesc}.`,
        url: style === 'algerian' || style === 'andalusian'
          ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
          : style === 'luxury'
          ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        prompt: `Photorealistic ${style} exterior villa facade ${L}x${W} meters, roof type ${roofType}, ${params.customNotes || 'modern architecture'}`
      },
      {
        id: `f-proc-${optionVariant}-2`,
        title: 'الإضاءة الليلية للواجهة (Night LED View)',
        description: 'توزيع الإضاءات المخفية LED على الكتل المعمارية وأسوار المنزل.',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        prompt: `Luxury ${style} villa exterior at night with warm LED ambient lighting`
      },
      {
        id: `f-proc-${optionVariant}-3`,
        title: 'المدخل والحديقة (Garden & Courtyard View)',
        description: 'تنسيق المدخل الخارجي مع المسطحات الخضراء وممر السيارات.',
        url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        prompt: `Villa entrance garden landscaping with modern stone patio`
      }
    ]
  };
}

/**
 * Generate 3 diverse procedural options adhering to the user's exact inputs.
 */
export function generateMultipleProceduralOptions(params: HouseInputParams): GeneratedHousePlan[] {
  return [
    generateProceduralPlan(params, 0),
    generateProceduralPlan(params, 1),
    generateProceduralPlan(params, 2)
  ];
}

/**
 * Recalculates walls, columns, specs, and updates a plan when the user modifies rooms
 * inside the interactive Room Editor.
 */
export function updatePlanWithModifiedRooms(
  originalPlan: GeneratedHousePlan,
  modifiedRooms: RoomData[]
): GeneratedHousePlan {
  const L = originalPlan.params.length || 15;
  const W = originalPlan.params.width || 10;
  const floors = originalPlan.params.floorsCount || 1;

  // Recalculate partition walls from modified rooms
  const walls: WallData[] = [];
  for (let f = 0; f < floors; f++) {
    // Keep exterior walls
    walls.push(
      { id: `w-${f}-1`, x1: 0, y1: 0, x2: L, y2: 0, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-2`, x1: L, y1: 0, x2: L, y2: W, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-3`, x1: L, y1: W, x2: 0, y2: W, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-4`, x1: 0, y1: W, x2: 0, y2: 0, thickness: 0.25, isExterior: true, floor: f }
    );

    const roomsOnFloor = modifiedRooms.filter((r) => r.floor === f && r.category !== 'outdoor');
    roomsOnFloor.forEach((rm, idx) => {
      walls.push(
        { id: `mod-pw-${f}-${idx}-1`, x1: rm.x, y1: rm.y, x2: rm.x + rm.width, y2: rm.y, thickness: 0.15, isExterior: false, floor: f },
        { id: `mod-pw-${f}-${idx}-2`, x1: rm.x + rm.width, y1: rm.y, x2: rm.x + rm.width, y2: rm.y + rm.length, thickness: 0.15, isExterior: false, floor: f },
        { id: `mod-pw-${f}-${idx}-3`, x1: rm.x + rm.width, y1: rm.y + rm.length, x2: rm.x, y2: rm.y + rm.length, thickness: 0.15, isExterior: false, floor: f },
        { id: `mod-pw-${f}-${idx}-4`, x1: rm.x, y1: rm.y + rm.length, x2: rm.x, y2: rm.y, thickness: 0.15, isExterior: false, floor: f }
      );
    });
  }

  // Recalculate furniture inside updated rooms
  const furniture: FurnitureData[] = [];
  modifiedRooms.forEach((rm, idx) => {
    if (rm.category === 'bedroom') {
      furniture.push({
        id: `mod-bed-${idx}`,
        type: 'bed',
        label: rm.nameAr.includes('الماستر') ? 'سرير كينج ماستر' : 'سرير نوم',
        x: Number((rm.x + 0.6).toFixed(1)),
        y: Number((rm.y + 0.6).toFixed(1)),
        width: 1.8,
        depth: 2.0,
        rotation: 0,
        floor: rm.floor
      });
    } else if (rm.category === 'living') {
      furniture.push({
        id: `mod-sofa-${idx}`,
        type: 'sofa',
        label: 'طقم كنب الصالة',
        x: Number((rm.x + 0.6).toFixed(1)),
        y: Number((rm.y + 0.6).toFixed(1)),
        width: 3.0,
        depth: 1.6,
        rotation: 0,
        floor: rm.floor
      });
    }
  });

  return {
    ...originalPlan,
    rooms: modifiedRooms,
    walls,
    furniture
  };
}
