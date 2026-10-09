import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS middleware for Vercel and multi-domain access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy initialize Gemini AI client
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing. Generative features will use intelligent procedural fallback.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Procedural floor plan generator in case AI service is offline or for instant preview
function generateProceduralPlan(params: any, optionVariant: number = 0) {
  const L = Math.max(6, Math.min(60, Number(params.length) || 15)); // Length
  const W = Math.max(5, Math.min(50, Number(params.width) || 10));  // Width
  const area = Number((L * W).toFixed(1));
  const floors = Math.max(1, Math.min(3, Number(params.floorsCount) || 1));
  const style = params.style || 'modern';
  const bedroomsCount = Math.max(1, Math.min(10, Number(params.bedroomsCount) || 3));
  const bathroomsCount = Math.max(1, Math.min(8, Number(params.bathroomsCount) || 2));
  const livingRoomsCount = Math.max(1, Math.min(4, Number(params.livingRoomsCount) || 1));
  const kitchensCount = Math.max(1, Math.min(3, Number(params.kitchensCount) || 1));

  const optionTitles = [
    {
      title: 'الخيار 1: توزيع مفتوح ممتد (فناء وإضاءة بانورامية)',
      badge: 'أفضل إضاءة وتدفق ✨',
      desc: `تصميم مفتوح يربط الصالة الرئيسية بالحديقة الخارجية، مخصص لقطعة أرض ${L}×${W}م بعدد ${bedroomsCount} غرف نوم.`
    },
    {
      title: 'الخيار 2: توزيع ملكي محدد (جناح ضيوف معزول بالكامل)',
      badge: 'أعلى خصوصية للعائلة 🏛️',
      desc: `فصل تام لمدخل ومجلس الضيوف عن فضاءات العائلة، بتوزيع ذكي لـ ${bedroomsCount} غرف نوم على مساحة ${area}م².`
    },
    {
      title: 'الخيار 3: نمط عصري فندقي (استغلال أقصى للمساحات)',
      badge: 'أعلى كفاءة واستغلال 🌿',
      desc: `تصميم مدمج يقلل الممرات ويعظم مساحة الأجنحة وغرف النوم والصالات مع تهوية متقابلة.`
    }
  ];

  const optMeta = optionTitles[optionVariant % 3];

  const aspect = L / W;
  const spanX = aspect > 1.4 ? 4.2 : 3.8;
  const spanY = 4.0;
  const columnsX = Math.max(3, Math.ceil(L / spanX) + (optionVariant === 1 ? 2 : 1));
  const columnsY = Math.max(3, Math.ceil(W / spanY) + 1);
  const totalColumns = columnsX * columnsY;

  const builtArea = Number((area * floors * 0.82).toFixed(1));

  // Generate column grid coordinates
  const columns: any[] = [];
  let colIdx = 1;
  const dx = (L - 0.4) / (columnsX - 1);
  const dy = (W - 0.4) / (columnsY - 1);

  for (let iy = 0; iy < columnsY; iy++) {
    for (let ix = 0; ix < columnsX; ix++) {
      columns.push({
        id: `col-${colIdx}`,
        x: Number((0.2 + ix * dx).toFixed(2)),
        y: Number((0.2 + iy * dy).toFixed(2)),
        sizeX: 0.25,
        sizeY: 0.5,
        gridAxis: `${String.fromCharCode(65 + iy)}-${ix + 1}`,
        floorSpan: floors > 1 ? `الطوابق (0 - ${floors - 1})` : 'الطابق الأرضي'
      });
      colIdx++;
    }
  }

  // Generate dynamic rooms strictly adhering to user input counts
  const rooms: any[] = [];
  let roomId = 1;

  // 1. Majlis / Reception (Floor 0)
  if (params.hasMajlis) {
    const majW = Number((L * (optionVariant === 1 ? 0.45 : 0.4)).toFixed(1));
    const majL = Number((W * (optionVariant === 1 ? 0.48 : 0.42)).toFixed(1));
    const majX = optionVariant === 1 ? Number((L - majW - 0.5).toFixed(1)) : 0.5;
    const majY = 0.5;

    rooms.push({
      id: `r-${roomId++}`,
      nameAr: optionVariant === 1 ? 'مجلس الضيوف المستقل (المدخل الملكي)' : 'مجلس الضيوف الفاخر',
      nameEn: 'Majlis Reception',
      width: majW,
      length: majL,
      area: Number((majW * majL).toFixed(1)),
      floor: 0,
      color: style === 'classic' ? '#d97706' : style === 'andalusian' ? '#ea580c' : '#2563eb',
      description: 'مساحة استقبال رسمية بمدخل مستقل وإطلالة أمامية.',
      x: majX,
      y: majY,
      category: 'living'
    });

    // Guest bathroom
    rooms.push({
      id: `r-${roomId++}`,
      nameAr: 'حمام ومغاسل الضيوف',
      nameEn: 'Guest Bathroom',
      width: Number(Math.min(2.4, L * 0.18).toFixed(1)),
      length: Number(Math.min(2.2, W * 0.2).toFixed(1)),
      area: Number((Math.min(2.4, L * 0.18) * Math.min(2.2, W * 0.2)).toFixed(1)),
      floor: 0,
      color: '#06b6d4',
      description: 'خدمات صحية فاخرة ومغاسل رخامية للضيوف.',
      x: optionVariant === 1 ? Number((L - majW - 2.8).toFixed(1)) : Number((majW + 0.6).toFixed(1)),
      y: 0.5,
      category: 'bathroom'
    });
  }

  // 2. Family Living Room(s) (Floor 0)
  for (let l = 1; l <= livingRoomsCount; l++) {
    const livW = Number((L * (optionVariant === 2 ? 0.52 : 0.46)).toFixed(1));
    const livL = Number((W * 0.44).toFixed(1));
    const livX = optionVariant === 1 ? 0.5 : optionVariant === 2 ? Number((L * 0.22).toFixed(1)) : 0.5;
    const livY = params.hasMajlis && optionVariant === 0 ? Number((W * 0.46).toFixed(1)) : 0.5;

    rooms.push({
      id: `r-${roomId++}`,
      nameAr: l === 1 ? 'صالة المعيشة العائلية الرئيسية' : `صالة الجلوس الثانوية ${l}`,
      nameEn: `Family Living ${l}`,
      width: livW,
      length: livL,
      area: Number((livW * livL).toFixed(1)),
      floor: 0,
      color: '#8b5cf6',
      description: 'صالة معيشة مفتوحة بإضاءة طبيعية وافرة وتواصل بصري.',
      x: Math.max(0.5, Math.min(L - livW - 0.5, livX)),
      y: Math.max(0.5, Math.min(W - livL - 0.5, livY)),
      category: 'living'
    });
  }

  // 3. Kitchen(s) (Floor 0)
  for (let k = 1; k <= kitchensCount; k++) {
    const kitW = Number((L * 0.35).toFixed(1));
    const kitL = Number((W * 0.36).toFixed(1));
    const kitX = Number((L - kitW - 0.6).toFixed(1));
    const kitY = Number((W - kitL - 0.6).toFixed(1));

    rooms.push({
      id: `r-${roomId++}`,
      nameAr: k === 1 ? (optionVariant === 2 ? 'مطبخ أمريكي مفتوح (جزيرة)' : 'المطبخ الرئيسي وصالة الطعام') : `مطبخ تحضيري إضافي ${k}`,
      nameEn: `Kitchen ${k}`,
      width: kitW,
      length: kitL,
      area: Number((kitW * kitL).toFixed(1)),
      floor: 0,
      color: '#f59e0b',
      description: 'مطبخ مجهز بتهوية مباشرة ومدخل خدمة جانبي.',
      x: Math.max(0.5, kitX),
      y: Math.max(0.5, kitY),
      category: 'kitchen'
    });
  }

  // 4. Garage (Floor 0)
  if (params.hasGarage) {
    const garW = Number(Math.min(5.5, L * 0.28).toFixed(1));
    const garL = Number(Math.min(6.0, W * 0.42).toFixed(1));
    rooms.push({
      id: `r-${roomId++}`,
      nameAr: `مرآب السيارات (${params.garageCapacity || 1} سيارة)`,
      nameEn: 'Garage',
      width: garW,
      length: garL,
      area: Number((garW * garL).toFixed(1)),
      floor: 0,
      color: '#64748b',
      description: 'موقف سيارات مغلق ومظلل مع مدخل مباشر للفيلا.',
      x: Number((L - garW - 0.5).toFixed(1)),
      y: optionVariant === 1 ? Number((W - garL - 0.5).toFixed(1)) : 0.5,
      category: 'garage'
    });
  }

  // 5. Garden (Floor 0)
  if (params.hasGarden) {
    const gdnW = Number((L * 0.3).toFixed(1));
    const gdnL = Number((W * 0.35).toFixed(1));
    rooms.push({
      id: `r-${roomId++}`,
      nameAr: 'الحديقة والحوش الخارجي',
      nameEn: 'Garden',
      width: gdnW,
      length: gdnL,
      area: Number((gdnW * gdnL).toFixed(1)),
      floor: 0,
      color: '#10b981',
      description: 'مسطح أخضر مع جلسة خارجية وإضاءة ليلية متناسقة.',
      x: 0.5,
      y: Number((W - gdnL - 0.5).toFixed(1)),
      category: 'outdoor'
    });
  }

  // 6. Dynamic Distribution of Bedrooms & Bathrooms
  // If floors === 1: bedrooms placed on Floor 0!
  // If floors > 1: bedrooms placed on Floor 1 (and 2 if 3 floors)
  const bedFloor = floors === 1 ? 0 : 1;
  const bedWidth = Number((L * (floors === 1 ? 0.28 : 0.34)).toFixed(1));
  const bedLength = Number((W * (floors === 1 ? 0.32 : 0.38)).toFixed(1));

  for (let b = 1; b <= bedroomsCount; b++) {
    const isMaster = b === 1;
    const targetFloor = floors === 3 && b > 3 ? 2 : bedFloor;

    const col = (b - 1) % (floors === 1 ? 3 : 2);
    const row = Math.floor((b - 1) / (floors === 1 ? 3 : 2));

    const bx = Number(Math.min(L - bedWidth - 0.5, Math.max(0.5, 0.5 + col * (bedWidth + 0.5))).toFixed(1));
    const by = floors === 1
      ? Number(Math.min(W - bedLength - 0.5, Math.max(0.5, 0.5 + row * (bedLength + 0.4))).toFixed(1))
      : Number(Math.min(W - bedLength - 0.5, Math.max(0.5, 0.5 + row * (bedLength + 0.5))).toFixed(1));

    rooms.push({
      id: `r-bed-${b}`,
      nameAr: isMaster
        ? 'جناح غرفة النوم الرئيسية (الماستر)'
        : `غرفة نوم ${b} (${b === 2 ? 'الأطفال' : b === 3 ? 'الضيوف' : 'إضافية'})`,
      nameEn: isMaster ? 'Master Bedroom Suite' : `Bedroom ${b}`,
      width: isMaster ? Number((bedWidth * 1.15).toFixed(1)) : bedWidth,
      length: isMaster ? Number((bedLength * 1.1).toFixed(1)) : bedLength,
      area: Number(((isMaster ? bedWidth * 1.15 : bedWidth) * (isMaster ? bedLength * 1.1 : bedLength)).toFixed(1)),
      floor: targetFloor,
      color: isMaster ? '#6366f1' : '#3b82f6',
      description: isMaster
        ? 'جناح ماستر واسع يضم منطقة سرير مزدوج، غرفة ملابس، وإطلالة متميزة.'
        : `غرفة نوم مريحة مصممة لتستوعب سرير ومكتب ودولاب مدمج.`,
      x: bx,
      y: by,
      category: 'bedroom'
    });
  }

  // Family bathrooms
  const remainingBaths = Math.max(1, bathroomsCount - (params.hasMajlis ? 1 : 0));
  for (let b = 1; b <= remainingBaths; b++) {
    const targetFloor = floors === 1 ? 0 : (b === 1 ? 1 : (floors > 2 ? 2 : 1));
    const bathW = 2.4;
    const bathL = 2.2;
    const bathX = Number(Math.max(0.5, Math.min(L - bathW - 0.5, L - bathW - 1.0 - (b - 1) * 2.8)).toFixed(1));
    const bathY = Number(Math.max(0.5, Math.min(W - bathL - 0.5, 0.8 + (b - 1) * 2.6)).toFixed(1));

    rooms.push({
      id: `r-bath-${b}`,
      nameAr: b === 1 ? 'حمام جناح الماستر الخاص' : `حمام العائلة المشترك ${b}`,
      nameEn: `Bathroom ${b}`,
      width: bathW,
      length: bathL,
      area: Number((bathW * bathL).toFixed(1)),
      floor: targetFloor,
      color: '#14b8a6',
      description: 'حمام مجهز بتهوية صحية وأطقم راقية وتكسيات مقاومة للرطوبة.',
      x: bathX,
      y: bathY,
      category: 'bathroom'
    });
  }

  // Balcony / Terrace
  if (params.hasBalcony && floors > 1) {
    const balcW = Number(Math.min(5.0, L * 0.35).toFixed(1));
    const balcL = 2.4;
    rooms.push({
      id: `r-${roomId++}`,
      nameAr: 'شرفة وتراس إطلالة بانورامية',
      nameEn: 'Balcony',
      width: balcW,
      length: balcL,
      area: Number((balcW * balcL).toFixed(1)),
      floor: 1,
      color: '#ec4899',
      description: 'تراس علوي مشمس يمنح إطلالة مفتوحة ومساحة للاسترخاء.',
      x: Number((L - balcW - 0.5).toFixed(1)),
      y: Number((W - balcL - 0.5).toFixed(1)),
      category: 'balcony'
    });
  }

  // Courtyard in server procedural generator
  if (params.hasCourtyard || params.style === 'algerian' || optionVariant === 2) {
    const cW = Number(Math.max(3.2, Math.min(5.0, L * 0.28)).toFixed(1));
    const cL = Number(Math.max(3.2, Math.min(5.0, W * 0.32)).toFixed(1));
    rooms.push({
      id: `r-court-${roomId++}`,
      nameAr: params.style === 'algerian' ? 'وسط الدار (فناء مغاربي مفتوح)' : 'الفناء الداخلي المشمس',
      nameEn: 'Courtyard',
      width: cW,
      length: cL,
      area: Number((cW * cL).toFixed(1)),
      floor: 0,
      color: '#06b6d4',
      description: 'فناء وسطي مفتوح للسماء بنباتات وزليج تقليدي أو نافورة مياه عذبة.',
      x: Number((L * 0.36).toFixed(1)),
      y: Number((W * 0.34).toFixed(1)),
      category: 'outdoor'
    });
  }

  // Stairs in server procedural generator
  if (params.hasStairs || floors > 1) {
    const sW = 2.4;
    const sL = 3.6;
    for (let f = 0; f < floors; f++) {
      rooms.push({
        id: `r-stairs-${f}`,
        nameAr: f === 0 ? 'الدرج الرئيسي والبهو' : `موزع الدرج (طابق ${f})`,
        nameEn: `Stairs Floor ${f}`,
        width: sW,
        length: sL,
        area: Number((sW * sL).toFixed(1)),
        floor: f,
        color: '#64748b',
        description: 'سلم خرساني داخلي يربط الطوابق.',
        x: Number((L * 0.65).toFixed(1)),
        y: Number((W * 0.35).toFixed(1)),
        category: 'hall'
      });
    }
  }

  // Exterior Structural Walls
  const walls: any[] = [];
  for (let f = 0; f < floors; f++) {
    walls.push(
      { id: `w-${f}-1`, x1: 0, y1: 0, x2: L, y2: 0, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-2`, x1: L, y1: 0, x2: L, y2: W, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-3`, x1: L, y1: W, x2: 0, y2: W, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-4`, x1: 0, y1: W, x2: 0, y2: 0, thickness: 0.25, isExterior: true, floor: f }
    );
  }

  // Openings (Doors & Windows)
  const openings: any[] = [
    { id: 'op-1', type: 'door', x: Number((L * 0.2).toFixed(1)), y: 0.1, width: 1.2, rotation: 0, label: 'المدخل الرئيسي', floor: 0 },
    { id: 'op-2', type: 'window', x: Number((L * 0.55).toFixed(1)), y: 0.1, width: 2.2, rotation: 0, label: 'شباك الواجهة الأمامية', floor: 0 },
    { id: 'op-3', type: 'window', x: Number((L * 0.35).toFixed(1)), y: Number((W - 0.1).toFixed(1)), width: 2.0, rotation: 0, label: 'نافذة الحديقة الخلفية', floor: 0 }
  ];

  if (floors > 1) {
    openings.push(
      { id: 'op-f1', type: 'window', x: Number((L * 0.3).toFixed(1)), y: 0.1, width: 2.4, rotation: 0, label: 'نافذة جناح الماستر', floor: 1 },
      { id: 'op-f2', type: 'door', x: Number((L - 2.5).toFixed(1)), y: Number((W - 0.1).toFixed(1)), width: 1.2, rotation: 0, label: 'باب الشرفة', floor: 1 }
    );
  }

  // Realistic Furniture
  const furniture: any[] = [
    { id: 'furn-1', type: 'sofa', label: 'طقم كنب الصالة', x: 1.5, y: 1.5, width: 3.2, depth: 1.8, rotation: 0, floor: 0 },
    { id: 'furn-2', type: 'table', label: 'طاولة طعام العائلة', x: Number((L * 0.45).toFixed(1)), y: Number((W * 0.5).toFixed(1)), width: 2.4, depth: 1.2, rotation: 0, floor: 0 }
  ];

  // Beds in bedrooms
  rooms.filter((r) => r.category === 'bedroom').forEach((bRoom, idx) => {
    furniture.push({
      id: `furn-bed-${idx}`,
      type: 'bed',
      label: bRoom.nameAr.includes('الماستر') ? 'سرير كينج ماستر' : 'سرير نوم',
      x: Number((bRoom.x + 0.6).toFixed(1)),
      y: Number((bRoom.y + 0.6).toFixed(1)),
      width: bRoom.nameAr.includes('الماستر') ? 2.0 : 1.6,
      depth: 2.0,
      rotation: 0,
      floor: bRoom.floor
    });
  });

  const costPerM2 = style === 'classic' || style === 'andalusian' ? 620 : style === 'modern' ? 520 : 470;
  const costMin = Math.round(builtArea * costPerM2 * 0.9);
  const costMax = Math.round(builtArea * costPerM2 * 1.25);

  return {
    id: `plan-proc-${optionVariant}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'procedural',
    aiModel: 'محرك النمذجة الهندسي المخصص',
    optionTitle: optMeta.title,
    optionBadge: optMeta.badge,
    optionDescription: optMeta.desc,
    params,
    specs: {
      title: `${optMeta.title} (${L}م × ${W}م - المساحة: ${area}م²)`,
      summary: `مخطط مخصص بدقة لقطعة أرض ${L}×${W}م بعدد ${bedroomsCount} غرف نوم و ${floors} طوابق. ${optMeta.desc}.`,
      totalLandArea: area,
      totalBuiltArea: builtArea,
      buildingFootprintArea: Number((area * 0.78).toFixed(1)),
      recommendedColumnsCount: totalColumns,
      columnsReasoning: `شبكة إنشائية مكونة من ${columnsX} محاور طولية و ${columnsY} محاور عرضية بمسافات تحمّل آمنة (3.8 إلى 4.2 متر) لضمان متانة الهيكل الخرساني.`,
      orientationNotes: 'تم توجيه الفضاءات الرئيسية والصالات للاستفادة القصوى من مسار الشمس والرياح السائدة وتجنب الحرارة المباشرة.',
      ventilationNotes: 'نظام تهوية طبيعية متقابلة مع شبابيك واسعة في الصالات وغرف النوم لتجديد الهواء.',
      structuralNotes: 'نظام هيكل خرساني متكامل (أعمدة 25×50 سم وقواعد شريطية ومنفصلة) وفق كود البناء الحديث.',
      estimatedCostMin: costMin,
      estimatedCostMax: costMax,
      currency: 'SAR',
      estimatedConcreteM3: Math.round(builtArea * 0.44),
      estimatedSteelTons: Number((builtArea * 0.046).toFixed(1)),
      estimatedBricksCount: Math.round(builtArea * 33)
    },
    rooms,
    walls,
    columns,
    openings,
    furniture,
    materials: {
      exteriorWallColor: params.facadeWallColor || (style === 'classic' ? '#fbf8f2' : '#f8fafc'),
      interiorWallColor: '#f1f5f9',
      roofColor: '#1e293b',
      windowFrameColor: '#0f172a',
      floorMaterial: 'سيراميك ورخام فاخر'
    },
    facadeImages: [
      {
        id: `f-proc-${optionVariant}-1`,
        title: `الواجهة الرئيسية (${style})`,
        description: `تصميم معماري (${style}) لقطعة أرض ${L}×${W}م يعكس توجيهاتك: "${params.customNotes || 'طراز معاصر فخم'}"`,
        url: style === 'classic'
          ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
          : style === 'andalusian' || style === 'mediterranean'
          ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        prompt: `Photorealistic ${style} exterior villa facade ${L}x${W} meters with ${params.customNotes || 'modern stone and glass'}`
      },
      {
        id: `f-proc-${optionVariant}-2`,
        title: 'الإضاءة الليلية للواجهة (Night Render)',
        description: 'توزيع الإضاءات المخفية LED على الكتل المعمارية والحجر الطبيعي.',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        prompt: `Luxury ${style} villa exterior at night with warm LED ambient lighting`
      },
      {
        id: `f-proc-${optionVariant}-3`,
        title: 'المدخل والحديقة (Garden & Entrance)',
        description: 'تنسيق المدخل الرئيسي مع المسطحات الخضراء وممر السيارات.',
        url: params.hasGarden
          ? 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        prompt: `Modern villa entrance garden landscaping`
      }
    ]
  };
}

function generateMultipleProceduralOptions(params: any) {
  return [
    generateProceduralPlan(params, 0),
    generateProceduralPlan(params, 1),
    generateProceduralPlan(params, 2)
  ];
}

// Helper to enrich Gemini options with CAD walls, columns, openings, furniture & engineering specs
function enrichGeminiOptions(rawOptions: any[], params: any, modelName: string) {
  const L = Math.max(6, Math.min(60, Number(params.length) || 15));
  const W = Math.max(5, Math.min(50, Number(params.width) || 10));
  const area = Number((L * W).toFixed(1));
  const floors = Math.max(1, Math.min(3, Number(params.floorsCount) || 1));
  const style = params.style || 'modern';
  const bedroomsCount = Math.max(1, Number(params.bedroomsCount) || 3);

  // Structural column grid (spans of ~4 meters)
  const columnsX = Math.max(3, Math.ceil(L / 4.2) + 1);
  const columnsY = Math.max(3, Math.ceil(W / 4.0) + 1);
  const totalColumns = columnsX * columnsY;
  const dx = (L - 0.4) / (columnsX - 1);
  const dy = (W - 0.4) / (columnsY - 1);

  const defaultColumns: any[] = [];
  let colIdx = 1;
  for (let iy = 0; iy < columnsY; iy++) {
    for (let ix = 0; ix < columnsX; ix++) {
      defaultColumns.push({
        id: `col-${colIdx++}`,
        x: Number((0.2 + ix * dx).toFixed(2)),
        y: Number((0.2 + iy * dy).toFixed(2)),
        sizeX: 0.25,
        sizeY: 0.5,
        gridAxis: `${String.fromCharCode(65 + iy)}-${ix + 1}`,
        floorSpan: floors > 1 ? `الطوابق (0 - ${floors - 1})` : 'الطابق الأرضي'
      });
    }
  }

  // Structural exterior walls
  const defaultWalls: any[] = [];
  for (let f = 0; f < floors; f++) {
    defaultWalls.push(
      { id: `w-${f}-1`, x1: 0, y1: 0, x2: L, y2: 0, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-2`, x1: L, y1: 0, x2: L, y2: W, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-3`, x1: L, y1: W, x2: 0, y2: W, thickness: 0.25, isExterior: true, floor: f },
      { id: `w-${f}-4`, x1: 0, y1: W, x2: 0, y2: 0, thickness: 0.25, isExterior: true, floor: f }
    );
  }

  return rawOptions.map((opt, idx) => {
    // Process and clamp rooms inside [0, L] and [0, W]
    const validRooms = (opt.rooms || []).map((r: any, rIdx: number) => {
      const rw = Number(Math.max(1.8, Math.min(L * 0.9, Number(r.width) || 4)).toFixed(1));
      const rl = Number(Math.max(1.8, Math.min(W * 0.9, Number(r.length) || 4)).toFixed(1));
      const rx = Number(Math.max(0.4, Math.min(L - rw - 0.4, Number(r.x) || 0.5)).toFixed(1));
      const ry = Number(Math.max(0.4, Math.min(W - rl - 0.4, Number(r.y) || 0.5)).toFixed(1));
      const rFloor = Math.max(0, Math.min(floors - 1, Number(r.floor) || 0));

      const category = r.category || (
        r.nameAr?.includes('نوم') || r.nameAr?.includes('ماستر') ? 'bedroom' :
        r.nameAr?.includes('حمام') || r.nameAr?.includes('مياه') ? 'bathroom' :
        r.nameAr?.includes('مطبخ') ? 'kitchen' :
        r.nameAr?.includes('كراج') || r.nameAr?.includes('مرآب') ? 'garage' :
        r.nameAr?.includes('شرفة') || r.nameAr?.includes('تراس') ? 'balcony' :
        r.nameAr?.includes('حديقة') || r.nameAr?.includes('حوش') ? 'outdoor' : 'living'
      );

      return {
        id: r.id || `ai-r-${idx}-${rIdx + 1}`,
        nameAr: r.nameAr || `غرفة ${rIdx + 1}`,
        nameEn: r.nameEn || category,
        width: rw,
        length: rl,
        area: Number((rw * rl).toFixed(1)),
        floor: rFloor,
        color: r.color || (
          category === 'bedroom' ? '#6366f1' :
          category === 'bathroom' ? '#06b6d4' :
          category === 'kitchen' ? '#f59e0b' :
          category === 'garage' ? '#64748b' :
          category === 'outdoor' ? '#10b981' :
          category === 'balcony' ? '#ec4899' : '#8b5cf6'
        ),
        description: r.description || `فضاء ${r.nameAr || 'معماري'} مصمم خصيصاً بالذكاء الاصطناعي.`,
        x: rx,
        y: ry,
        category
      };
    });

    // Calculate total built area from rooms
    const sumRoomsArea = validRooms.reduce((acc: number, r: any) => acc + (r.area || 0), 0);
    const totalBuiltArea = Number(Math.max(area * floors * 0.75, sumRoomsArea * 1.18).toFixed(1));
    const costPerM2 = style === 'classic' || style === 'andalusian' ? 620 : style === 'modern' ? 520 : 470;
    const costMin = Math.round(totalBuiltArea * costPerM2 * 0.9);
    const costMax = Math.round(totalBuiltArea * costPerM2 * 1.25);

    // Realistic furniture matching room categories
    const furniture: any[] = [
      { id: `furn-${idx}-1`, type: 'sofa', label: 'طقم كنب الصالة', x: 1.5, y: 1.5, width: 3.2, depth: 1.8, rotation: 0, floor: 0 },
      { id: `furn-${idx}-2`, type: 'table', label: 'طاولة طعام العائلة', x: Number((L * 0.45).toFixed(1)), y: Number((W * 0.5).toFixed(1)), width: 2.4, depth: 1.2, rotation: 0, floor: 0 }
    ];

    validRooms.filter((r: any) => r.category === 'bedroom').forEach((bRoom: any, bIdx: number) => {
      furniture.push({
        id: `furn-${idx}-b-${bIdx}`,
        type: 'bed',
        label: bRoom.nameAr.includes('الماستر') ? 'سرير كينج ماستر' : 'سرير نوم',
        x: Number((bRoom.x + 0.6).toFixed(1)),
        y: Number((bRoom.y + 0.6).toFixed(1)),
        width: bRoom.nameAr.includes('الماستر') ? 2.0 : 1.6,
        depth: 2.0,
        rotation: 0,
        floor: bRoom.floor
      });
    });

    const openings: any[] = [
      { id: `op-${idx}-1`, type: 'door', x: Number((L * 0.2).toFixed(1)), y: 0.1, width: 1.2, rotation: 0, label: 'المدخل الرئيسي', floor: 0 },
      { id: `op-${idx}-2`, type: 'window', x: Number((L * 0.55).toFixed(1)), y: 0.1, width: 2.2, rotation: 0, label: 'شباك الواجهة الأمامية', floor: 0 },
      { id: `op-${idx}-3`, type: 'window', x: Number((L * 0.35).toFixed(1)), y: Number((W - 0.1).toFixed(1)), width: 2.0, rotation: 0, label: 'نافذة الصالة الخلفية', floor: 0 }
    ];

    if (floors > 1) {
      openings.push(
        { id: `op-${idx}-f1`, type: 'window', x: Number((L * 0.3).toFixed(1)), y: 0.1, width: 2.4, rotation: 0, label: 'نافذة جناح الماستر', floor: 1 },
        { id: `op-${idx}-f2`, type: 'door', x: Number((L - 2.5).toFixed(1)), y: Number((W - 0.1).toFixed(1)), width: 1.2, rotation: 0, label: 'باب الشرفة', floor: 1 }
      );
    }

    return {
      id: `ai-plan-opt-${idx}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'gemini',
      aiModel: modelName,
      optionTitle: opt.optionTitle || `الخيار 0${idx + 1}`,
      optionBadge: opt.optionBadge || `تصميم AI فريد 0${idx + 1} ✨`,
      optionDescription: opt.optionDescription || opt.summary || `توزيع معماري متكامل لقطعة أرض ${L}×${W}م وفق مدخلاتك.`,
      params,
      specs: {
        title: `${opt.optionTitle || `الخيار 0${idx + 1}`} (${L}م × ${W}م - ${area}م²)`,
        summary: opt.summary || opt.optionDescription || `توليد معماري مخصص لـ (${bedroomsCount} غرف نوم، ${floors} طوابق).`,
        totalLandArea: area,
        totalBuiltArea,
        buildingFootprintArea: Number((area * 0.78).toFixed(1)),
        recommendedColumnsCount: totalColumns,
        columnsReasoning: opt.columnsReasoning || `شبكة إنشائية مكونة من ${columnsX}×${columnsY} محاور تباعدها 3.8-4.2م لضمان السلامة الإنشائية ومقاومة الأحمال.`,
        orientationNotes: opt.orientationNotes || 'تمت دراسة التوجيه لضمان تدفق أشعة الشمس الصباحية وحجب حرارة الظهيرة.',
        ventilationNotes: opt.ventilationNotes || 'توزيع متوازن للفتحات لتأمين مسارات تهوية متقاطعة عبر أرجاء المنزل.',
        structuralNotes: opt.structuralNotes || 'هيكل خرساني مسلح متين مع أعمدة 25×50 سم وقواعد مسلحة متطابقة مع الكود.',
        estimatedCostMin: opt.estimatedCostMin || costMin,
        estimatedCostMax: opt.estimatedCostMax || costMax,
        currency: 'SAR',
        estimatedConcreteM3: Math.round(totalBuiltArea * 0.44),
        estimatedSteelTons: Number((totalBuiltArea * 0.046).toFixed(1)),
        estimatedBricksCount: Math.round(totalBuiltArea * 33)
      },
      rooms: validRooms,
      walls: defaultWalls,
      columns: defaultColumns,
      openings,
      furniture,
      materials: {
        exteriorWallColor: params.facadeWallColor || (style === 'classic' ? '#fbf8f2' : '#f8fafc'),
        interiorWallColor: '#f1f5f9',
        roofColor: '#1e293b',
        windowFrameColor: '#0f172a',
        floorMaterial: 'سيراميك ورخام فاخر'
      },
      facadeImages: [
        {
          id: `f-ai-${idx}-1`,
          title: `الواجهة الرئيسية (${style})`,
          description: `تصميم معماري طراز ${style} مجسد لمتطلباتك: "${params.customNotes || 'واجهة عصرية فاخرة بحجر وزجاج'}"`,
          url: style === 'classic'
            ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
            : style === 'andalusian' || style === 'mediterranean'
            ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
            : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          prompt: `Photorealistic ${style} luxury house exterior facade ${L}x${W} meters with ${params.customNotes || 'modern white stone and large panoramic glass'}`
        },
        {
          id: `f-ai-${idx}-2`,
          title: 'المظهر الليلي والإضاءة المعمارية (Night Render)',
          description: 'إبراز الكتل المعمارية بالإضاءة الدافئة LED وتفاصيل الخامات الخارجية.',
          url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
          prompt: `Luxury ${style} villa exterior at night with warm architectural LED lighting`
        },
        {
          id: `f-ai-${idx}-3`,
          title: 'المدخل والحديقة (Garden & Entrance)',
          description: 'دمج المدخل مع الحديقة والمسطحات الخضراء وممر السيارات.',
          url: params.hasGarden
            ? 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
            : 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
          prompt: `Modern villa entrance garden landscaping`
        }
      ]
    };
  });
}

// Endpoint: AI Generate Plan with multi-model cascade & CAD enrichment
app.post('/api/generate-plan', async (req, res) => {
  try {
    const params = req.body;
    console.log('Generating AI House Plan with user params:', params);

    const ai = getAIClient();

    if (!ai) {
      console.log('GEMINI_API_KEY missing - generating dynamic procedural options...');
      const fallbackPlans = generateMultipleProceduralOptions(params);
      return res.json({ success: true, plans: fallbackPlans, plan: fallbackPlans[0], source: 'procedural' });
    }

    const L = Number(params.length) || 15;
    const W = Number(params.width) || 10;
    const bedroomsCount = Number(params.bedroomsCount) || 3;
    const bathroomsCount = Number(params.bathroomsCount) || 2;
    const floorsCount = Number(params.floorsCount) || 1;
    const livingRoomsCount = Number(params.livingRoomsCount) || 1;
    const kitchensCount = Number(params.kitchensCount) || 1;

    const promptText = `
أنت مهندس معماري وإنشائي استشاري أول وخبير في تصميم وتوزيع المخططات السكنية الذكية.
المهمة الإلزامية: قم بتوليد 3 خيارات معمارية (options) حقيقية ومتباينة بالكامل لقطعة أرض بناءً على المدخلات الدقيقة الآتية:
- أبعاد قطعة الأرض: الطول = ${L} متر، العرض = ${W} متر (المساحة الإجمالية = ${L * W} م²).
- عدد الطوابق: ${floorsCount} (0 للأرضي${floorsCount > 1 ? ', 1 للأول' : ''}${floorsCount > 2 ? ', 2 للثاني' : ''}).
- عدد غرف النوم المطلوب بدقة: ${bedroomsCount} غرف نوم. (يجب توليد ${bedroomsCount} غرف نوم بالضبط، مع تسميات واضحة ومتباينة كـ "جناح الماستر الرئيسي" و "غرفة نوم الأبناء" وغيرها).
- عدد الحمامات المطلوب: ${bathroomsCount} حمام.
- عدد الصالات/المعيشة: ${livingRoomsCount} صالة.
- عدد المطابخ: ${kitchensCount} مطبخ.
- مجلس ضيوف: ${params.hasMajlis ? 'نعم (يجب تضمينه بمساحة رحبة)' : 'لا'}.
- مرآب سيارات: ${params.hasGarage ? `نعم (${params.garageCapacity || 1} سيارات)` : 'لا'}.
- حديقة / حوش: ${params.hasGarden ? 'نعم' : 'لا'}.
- شرفة / تراس: ${params.hasBalcony ? 'نعم' : 'لا'}.
- درج وسلالم داخلية: ${params.hasStairs || floorsCount > 1 ? 'نعم (سلم خرساني داخلي يربط الطوابق)' : 'لا'}.
- فناء داخلي / وسط الدار: ${params.hasCourtyard || params.style === 'algerian' || params.style === 'andalusian' ? 'نعم (فناء وسطي مشمس بنباتات أو نافورة)' : 'لا'}.
- مساحة البناء المطلوبة: ${params.targetBuiltArea ? `${params.targetBuiltArea} م²` : 'استغلال أمثل لمساحة الأرض'}.
- نوع السقف: ${params.roofType === 'sloped' ? 'سقف مائل بقرميد هندسي' : 'سقف مسطح مع سترة علوية'}.
- الطراز المعماري: ${params.style} (${params.wallMaterial || 'بناء معتمد'}).
- توجيه العميل الخاص والملاحظات: "${params.customNotes || 'تصميم متميز بتهوية وإضاءة طبيعية ممتازة'}".

يجب أن تولد 3 خيارات مختلفة تماماً في فلسفة التوزيع المعماري:
الخيار 1: توزيع مفتوح مع فناء وإضاءة طبيعية بانورامية.
الخيار 2: خصوصية ملكية كاملة بفصل مجلس الضيوف تماماً عن أجنحة العائلة.
الخيار 3: نمط فندقي عصري مدمج بأعلى كفاءة استغلال واستثمار للمساحات.

قواعد هندسية صارمة للغرف (rooms):
- كل غرفة يجب أن تحدد لها (id, nameAr, category, floor, x, y, width, length, description).
- يجب أن تكون إحداثيات كل غرفة محصورة تماماً داخل أبعاد الأرض:
  x >= 0.4 و x + width <= ${L}
  y >= 0.4 و y + length <= ${W}
- ${floorsCount === 1 ? 'نظراً لأن المبنى طابق واحد، يجب وضع جميع الغرف والمجلس وغرف النوم في الطابق 0 (floor: 0).' : 'توزيع ذكي على الطوابق: الصالات والمجلس والمطبخ والمرآب في الطابق 0، وغرف النوم والحمامات الخاصة والشرفة في الطابق 1.'}
`;

    // Try gemini-3.8-flash first, cascade to gemini-3.1-flash-lite on spike or failure
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;
    let successfulData: any = null;
    let modelUsed = '';

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting AI generation with model: ${model}...`);
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction: 'أنت مهندس معماري وإنشائي استشاري متخصص في التوليد الذكي لخيارات المخططات السكنية بصيغة JSON عربية عالية الدقة.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      optionTitle: { type: Type.STRING },
                      optionBadge: { type: Type.STRING },
                      optionDescription: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      orientationNotes: { type: Type.STRING },
                      ventilationNotes: { type: Type.STRING },
                      structuralNotes: { type: Type.STRING },
                      estimatedCostMin: { type: Type.NUMBER },
                      estimatedCostMax: { type: Type.NUMBER },
                      rooms: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            nameAr: { type: Type.STRING },
                            category: { type: Type.STRING },
                            floor: { type: Type.INTEGER },
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER },
                            width: { type: Type.NUMBER },
                            length: { type: Type.NUMBER },
                            color: { type: Type.STRING },
                            description: { type: Type.STRING }
                          },
                          required: ['nameAr', 'category', 'floor', 'x', 'y', 'width', 'length']
                        }
                      }
                    },
                    required: ['optionTitle', 'optionBadge', 'optionDescription', 'rooms']
                  }
                }
              },
              required: ['options']
            }
          }
        });

        const jsonString = response.text ? response.text.trim() : '';
        const parsed = JSON.parse(jsonString);

        if (parsed.options && parsed.options.length > 0) {
          successfulData = parsed;
          modelUsed = model;
          console.log(`Generation succeeded with ${model} (returned ${parsed.options.length} options)`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} encountered an issue:`, err.message || err);
        lastError = err;
      }
    }

    if (successfulData && successfulData.options) {
      const enrichedPlans = enrichGeminiOptions(successfulData.options, params, modelUsed);
      return res.json({
        success: true,
        plans: enrichedPlans,
        plan: enrichedPlans[0],
        source: 'gemini',
        modelUsed
      });
    }

    console.warn('All Gemini models encountered high demand or network issues, using dynamic procedural generator:', lastError);
    const fallbackPlans = generateMultipleProceduralOptions(params);
    return res.json({
      success: true,
      plans: fallbackPlans,
      plan: fallbackPlans[0],
      source: 'procedural-fallback',
      reason: lastError?.message || 'High model demand'
    });
  } catch (error: any) {
    console.error('Server error generating plan:', error);
    const fallbackPlans = generateMultipleProceduralOptions(req.body);
    res.json({ success: true, plans: fallbackPlans, plan: fallbackPlans[0], source: 'procedural-fallback' });
  }
});

// Endpoint: AI Facade Image Generator
app.post('/api/generate-facade', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        success: true,
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        isFallback: true
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: `Photorealistic architectural facade rendering: ${prompt}. High resolution, luxury lighting, ultra detailed 8k architecture rendering.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({ success: true, imageUrl, isFallback: false });
      } else {
        return res.json({
          success: true,
          imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          isFallback: true
        });
      }
    } catch (imgError) {
      console.error('Image generation error:', imgError);
      return res.json({
        success: true,
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        isFallback: true
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Architectural AI House App running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
