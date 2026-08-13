import { HouseInputParams, GeneratedHousePlan, RoomData, ColumnData, WallData, OpeningData, FurnitureData } from '../types';

export function generateProceduralPlan(params: HouseInputParams): GeneratedHousePlan {
  const L = Math.max(8, Math.min(50, Number(params.length) || 15));
  const W = Math.max(6, Math.min(40, Number(params.width) || 10));
  const area = L * W;
  const floors = Math.max(1, Math.min(3, Number(params.floorsCount) || 1));
  const style = params.style || 'modern';
  const bedroomsCount = Math.max(1, Number(params.bedroomsCount) || 3);

  const aspect = L / W;
  const spanX = aspect > 1.4 ? 4.2 : 3.8;
  const spanY = 4.0;
  const columnsX = Math.max(3, Math.ceil(L / spanX) + 1);
  const columnsY = Math.max(3, Math.ceil(W / spanY) + 1);
  const totalColumns = columnsX * columnsY;

  const builtArea = area * floors * 0.82;

  // Columns Grid
  const columns: ColumnData[] = [];
  let colIdx = 1;
  const dx = (L - 0.4) / (columnsX - 1);
  const dy = (W - 0.4) / (columnsY - 1);

  for (let ix = 0; ix < columnsX; ix++) {
    for (let iy = 0; iy < columnsY; iy++) {
      const cx = Number((0.2 + ix * dx).toFixed(2));
      const cy = Number((0.2 + iy * dy).toFixed(2));
      const axisChar = String.fromCharCode(65 + ix);
      columns.push({
        id: `c-gen-${colIdx++}`,
        x: cx,
        y: cy,
        sizeX: 0.2,
        sizeY: 0.5,
        gridAxis: `${axisChar}-${iy + 1}`,
        floorSpan: floors > 1 ? '0-1' : '0'
      });
    }
  }

  // Rooms
  const rooms: RoomData[] = [];

  // 1. Majlis / Reception
  const majlisW = Number((L * 0.42).toFixed(1));
  const majlisL = Number((W * 0.42).toFixed(1));
  rooms.push({
    id: 'p-r1',
    nameAr: params.hasMajlis ? 'مجلس الضيوف الفاخر' : 'صالة الاستقبال الرئيسية',
    nameEn: 'Main Majlis / Reception',
    width: majlisW,
    length: majlisL,
    area: Number((majlisW * majlisL).toFixed(1)),
    floor: 0,
    color: style === 'classic' ? '#d97706' : style === 'andalusian' ? '#ea580c' : '#2563eb',
    description: 'مساحة استقبال مجهزة بمدخل مستقل وديكور فاخر.',
    x: 0.5,
    y: 0.5,
    category: 'living'
  });

  // 2. Bathroom
  const bathW = Number(Math.min(2.4, L * 0.18).toFixed(1));
  const bathL = Number(Math.min(2.2, W * 0.22).toFixed(1));
  rooms.push({
    id: 'p-r2',
    nameAr: 'حمام ومغاسل الضيوف',
    nameEn: 'Guest Bathroom',
    width: bathW,
    length: bathL,
    area: Number((bathW * bathL).toFixed(1)),
    floor: 0,
    color: '#06b6d4',
    description: 'خدمات صحية فاخرة ومغاسل رخامية للضيوف.',
    x: Number((majlisW + 0.6).toFixed(1)),
    y: 0.5,
    category: 'bathroom'
  });

  // 3. Main Family Living Room
  const livingW = Number((L * 0.48).toFixed(1));
  const livingL = Number((W * 0.46).toFixed(1));
  rooms.push({
    id: 'p-r3',
    nameAr: 'صالة المعيشة العائلية الكبرى',
    nameEn: 'Family Living Room',
    width: livingW,
    length: livingL,
    area: Number((livingW * livingL).toFixed(1)),
    floor: 0,
    color: '#8b5cf6',
    description: 'صالة معيشة مفتوحة بإضاءة طبيعية وافرة وإطلالة.',
    x: 0.5,
    y: Number((majlisL + 0.6).toFixed(1)),
    category: 'living'
  });

  // 4. Kitchen
  const kitchW = Number((L * 0.38).toFixed(1));
  const kitchL = Number((W * 0.38).toFixed(1));
  rooms.push({
    id: 'p-r4',
    nameAr: 'المطبخ الرئيسي وصالة الطعام',
    nameEn: 'Main Kitchen & Dining',
    width: kitchW,
    length: kitchL,
    area: Number((kitchW * kitchL).toFixed(1)),
    floor: 0,
    color: '#f59e0b',
    description: 'مطبخ عصري مزود بتهوية مباشرة ومخرج للخدمات.',
    x: Number((majlisW + 0.6).toFixed(1)),
    y: Number((bathL + 0.8).toFixed(1)),
    category: 'kitchen'
  });

  // Garage
  if (params.hasGarage) {
    const garW = Number(Math.min(4.5, L * 0.28).toFixed(1));
    const garL = Number(Math.min(6.0, W * 0.45).toFixed(1));
    rooms.push({
      id: 'p-r5',
      nameAr: `مرآب السيارات المغلق (${params.garageCapacity || 1} سيارة)`,
      nameEn: 'Garage',
      width: garW,
      length: garL,
      area: Number((garW * garL).toFixed(1)),
      floor: 0,
      color: '#64748b',
      description: 'كراج أوتوماتيكي مظلل بمدخل للمنزل مباشرة.',
      x: Number((L - garW - 0.5).toFixed(1)),
      y: 0.5,
      category: 'garage'
    });
  }

  // Garden
  if (params.hasGarden) {
    const gdnW = Number((L * 0.32).toFixed(1));
    const gdnL = Number((W * 0.40).toFixed(1));
    rooms.push({
      id: 'p-r6',
      nameAr: 'الحديقة والحوش الخارجي',
      nameEn: 'Outdoor Garden',
      width: gdnW,
      length: gdnL,
      area: Number((gdnW * gdnL).toFixed(1)),
      floor: 0,
      color: '#10b981',
      description: 'مسطح أخضر مع حوش وجلسة خارجية.',
      x: Number((L - gdnW - 0.5).toFixed(1)),
      y: Number((W - gdnL - 0.5).toFixed(1)),
      category: 'outdoor'
    });
  }

  // Floor 1 Bedrooms
  if (floors > 1) {
    for (let b = 1; b <= bedroomsCount; b++) {
      const bw = Number((L * 0.34).toFixed(1));
      const bl = Number((W * 0.38).toFixed(1));
      const ox = 0.5 + ((b - 1) % 2) * (bw + 0.4);
      const oy = 0.5 + Math.floor((b - 1) / 2) * (bl + 0.4);

      rooms.push({
        id: `p-rf-${b}`,
        nameAr: b === 1 ? 'جناح غرفة النوم الرئيسية (ماستر)' : `غرفة نوم الأبناء ${b - 1}`,
        nameEn: b === 1 ? 'Master Bedroom Suite' : `Bedroom ${b - 1}`,
        width: bw,
        length: bl,
        area: Number((bw * bl).toFixed(1)),
        floor: 1,
        color: b === 1 ? '#6366f1' : '#3b82f6',
        description: b === 1 ? 'غرفة ماستر واسعة مع حمام ودولاب ملابس.' : 'غرفة مريحة بإضاءة طبيعية وافرة.',
        x: Number(ox.toFixed(1)),
        y: Number(oy.toFixed(1)),
        category: 'bedroom'
      });
    }

    rooms.push({
      id: 'p-rf-bath',
      nameAr: 'حمام علوي مشترك',
      nameEn: 'Upper Bathroom',
      width: 2.4,
      length: 2.2,
      area: 5.28,
      floor: 1,
      color: '#14b8a6',
      description: 'حمام أنيق يخدم غرف الطابق الأول.',
      x: Number((L - 3.2).toFixed(1)),
      y: 0.5,
      category: 'bathroom'
    });

    if (params.hasBalcony) {
      rooms.push({
        id: 'p-rf-balcony',
        nameAr: 'شرفة وتراس إطلالة',
        nameEn: 'Balcony',
        width: 3.8,
        length: 2.2,
        area: 8.36,
        floor: 1,
        color: '#f59e0b',
        description: 'تراس علوي يمنح إطلالة ممتعة على الواجهة الخارجية.',
        x: Number((L - 4.2).toFixed(1)),
        y: Number((W - 2.8).toFixed(1)),
        category: 'balcony'
      });
    }
  }

  // Walls
  const walls: WallData[] = [
    { id: 'pw1', x1: 0, y1: 0, x2: L, y2: 0, thickness: 0.25, isExterior: true, floor: 0 },
    { id: 'pw2', x1: L, y1: 0, x2: L, y2: W, thickness: 0.25, isExterior: true, floor: 0 },
    { id: 'pw3', x1: L, y1: W, x2: 0, y2: W, thickness: 0.25, isExterior: true, floor: 0 },
    { id: 'pw4', x1: 0, y1: W, x2: 0, y2: 0, thickness: 0.25, isExterior: true, floor: 0 },
  ];

  if (floors > 1) {
    walls.push(
      { id: 'pwf1', x1: 0, y1: 0, x2: L, y2: 0, thickness: 0.25, isExterior: true, floor: 1 },
      { id: 'pwf2', x1: L, y1: 0, x2: L, y2: W, thickness: 0.25, isExterior: true, floor: 1 },
      { id: 'pwf3', x1: L, y1: W, x2: 0, y2: W, thickness: 0.25, isExterior: true, floor: 1 },
      { id: 'pwf4', x1: 0, y1: W, x2: 0, y2: 0, thickness: 0.25, isExterior: true, floor: 1 }
    );
  }

  // Openings
  const openings: OpeningData[] = [
    { id: 'po1', type: 'door', x: Number((L * 0.2).toFixed(1)), y: 0.1, width: 1.2, rotation: 0, label: 'المدخل الرئيسي', floor: 0 },
    { id: 'po2', type: 'window', x: Number((L * 0.5).toFixed(1)), y: 0.1, width: 2.0, rotation: 0, label: 'شباك الواجهة الأمامية', floor: 0 },
    { id: 'po3', type: 'window', x: Number((L * 0.3).toFixed(1)), y: Number((W - 0.1).toFixed(1)), width: 2.2, rotation: 0, label: 'نافذة الصالة الخلفية', floor: 0 }
  ];

  // Furniture
  const furniture: FurnitureData[] = [
    { id: 'pf1', type: 'sofa', label: 'طقم كنب الضيوف', x: 1.2, y: 1.2, width: 3.0, depth: 1.6, rotation: 0, floor: 0 },
    { id: 'pf2', type: 'table', label: 'طاولة طعام', x: Number((L * 0.4).toFixed(1)), y: Number((W * 0.5).toFixed(1)), width: 2.2, depth: 1.1, rotation: 0, floor: 0 }
  ];

  const costPerM2 = style === 'classic' ? 600 : style === 'modern' ? 500 : 450;
  const costMin = Math.round(builtArea * costPerM2 * 0.9);
  const costMax = Math.round(builtArea * costPerM2 * 1.25);

  return {
    id: `plan-gen-${Date.now()}`,
    timestamp: new Date().toISOString(),
    params,
    specs: {
      title: `مخطط هندسي ذكي لـ ${style === 'classic' ? 'فيلا كلاسيكية' : 'منزل عصري'} (${L}م × ${W}م - المساحة: ${area}م²)`,
      summary: `تم توليد هذا المخطط بناءً على أبعاد قطعة الأرض (${L} × ${W} متر) وإجمالي مساحة بناء قدرها ${builtArea.toFixed(0)} م² موزعة على ${floors} طابق.`,
      totalLandArea: area,
      totalBuiltArea: Number(builtArea.toFixed(1)),
      buildingFootprintArea: Number((area * 0.8).toFixed(1)),
      recommendedColumnsCount: totalColumns,
      columnsReasoning: `شبكة إنشائية مكونة من ${columnsX} محاور طولية و ${columnsY} محاور عرضية بمسافات تحمّل آمنة.`,
      orientationNotes: 'تم توزيع الفضاءات الرئيسية للاستفادة من حركة الشمس والرياح السائدة.',
      ventilationNotes: 'مراعاة الفتحات المقابلة والشبابيك المزدوجة لتدفق الهواء الطبيعي بشكل مستمر.',
      structuralNotes: 'نظام هيكلي من الخرسانة المسلحة (أعمدة 20×50 سم وقواعد مسلحة شريطية ومنفصلة).',
      estimatedCostMin: costMin,
      estimatedCostMax: costMax,
      currency: 'USD',
      estimatedConcreteM3: Math.round(builtArea * 0.45),
      estimatedSteelTons: Number((builtArea * 0.048).toFixed(1)),
      estimatedBricksCount: Math.round(builtArea * 32)
    },
    rooms,
    walls,
    columns,
    openings,
    furniture,
    materials: {
      exteriorWallColor: style === 'classic' ? '#fbf8f2' : '#f8fafc',
      interiorWallColor: '#f1f5f9',
      roofColor: '#1e293b',
      windowFrameColor: '#0f172a',
      floorMaterial: 'سيراميك ورخام فاخر'
    },
    facadeImages: [
      {
        id: 'f-gen-1',
        title: 'الواجهة الرئيسية (منظور نهاري)',
        description: `تصميم معماري ${style} أنيق يناسب أبعاد الأرض ${L}x${W} متر.`,
        url: style === 'classic'
          ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
          : style === 'andalusian' || style === 'mediterranean'
          ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        prompt: `Modern exterior facade of a luxury house ${L}x${W} meters`
      },
      {
        id: 'f-gen-2',
        title: 'الإضاءة الليلية للواجهة (Night Lighting Render)',
        description: 'توزيع الإضاءات المخفية LED على الكتل المعمارية.',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        prompt: `Luxury villa facade at night with warm LED ambient lighting`
      },
      {
        id: 'f-gen-3',
        title: 'المدخل والحديقة الخارجية (Garden & Entrance)',
        description: 'منظور متناسق بين مدخل الفيلا والمسطحات الخضراء.',
        url: params.hasGarden
          ? 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        prompt: `Modern villa entrance with landscaping`
      }
    ]
  };
}
