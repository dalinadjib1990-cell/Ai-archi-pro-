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

// Procedural fallback floor plan generator in case AI service is offline or missing key
function generateProceduralPlan(params: any, optionVariant: number = 0) {
  const L = Math.max(8, Math.min(50, Number(params.length) || 15)); // Length
  const W = Math.max(6, Math.min(40, Number(params.width) || 10));  // Width
  const area = L * W;
  const floors = Math.max(1, Math.min(3, Number(params.floorsCount) || 1));
  const style = params.style || 'modern';
  const bedroomsCount = Math.max(1, Number(params.bedroomsCount) || 3);

  const optionTitles = [
    {
      title: 'الخيار 1: توزيع مفتوح ممتد (فناء وإضاءة بانورامية)',
      badge: 'أفضل إضاءة وتدفق ✨',
      desc: 'يركز على ربط الصالة الرئيسية بالحديقة والضوء الطبيعي المباشر'
    },
    {
      title: 'الخيار 2: توزيع ملكي محدد (جناح ضيوف معزول بالكامل)',
      badge: 'أعلى خصوصية للعائلة 🏛️',
      desc: 'فصل تام لمدخل ومجلس الضيوف عن فضاءات العائلة وحركة الخدمات'
    },
    {
      title: 'الخيار 3: نمط عصري فندقي (استغلال أقصى للمساحات)',
      badge: 'أعلى كفاءة واستغلال 🌿',
      desc: 'تصميم مدمج يقلل الممرات ويعظم مساحة غرف النوم والصالات'
    }
  ];

  const optMeta = optionTitles[optionVariant % 3];

  const aspect = L / W;
  const spanX = aspect > 1.4 ? 4.2 : 3.8;
  const spanY = 4.0;
  const columnsX = Math.max(3, Math.ceil(L / spanX) + (optionVariant === 1 ? 2 : 1));
  const columnsY = Math.max(3, Math.ceil(W / spanY) + 1);
  const totalColumns = columnsX * columnsY;

  const builtArea = area * floors * 0.82;

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

  // Generate Ground Floor Rooms dynamically fitting the exact footprint L x W
  const rooms: any[] = [];

  if (optionVariant === 1) {
    // VARIANT 2: Split Guest Wing Right
    const majlisW = Number((L * 0.45).toFixed(1));
    const majlisL = Number((W * 0.45).toFixed(1));
    rooms.push({
      id: 'p-r1',
      nameAr: params.hasMajlis ? 'مجلس الضيوف المعزول' : 'صالة الاستقبال الرسمية',
      nameEn: 'Private Majlis Wing',
      width: majlisW,
      length: majlisL,
      area: Number((majlisW * majlisL).toFixed(1)),
      floor: 0,
      color: '#d97706',
      description: 'جناح مستقل للضيوف بمدخل خارجي مباشر.',
      x: Number((L - majlisW - 0.5).toFixed(1)),
      y: 0.5,
      category: 'living'
    });

    const bathW = Number(Math.min(2.4, L * 0.18).toFixed(1));
    const bathL = Number(Math.min(2.2, W * 0.22).toFixed(1));
    rooms.push({
      id: 'p-r2',
      nameAr: 'حمام ومغاسل ضيوف مستقلة',
      nameEn: 'Guest Bathroom',
      width: bathW,
      length: bathL,
      area: Number((bathW * bathL).toFixed(1)),
      floor: 0,
      color: '#06b6d4',
      description: 'دورة مياه فاخرة تخدم جناح الضيوف.',
      x: Number((L - majlisW - bathW - 0.8).toFixed(1)),
      y: 0.5,
      category: 'bathroom'
    });

    const livingW = Number((L * 0.5).toFixed(1));
    const livingL = Number((W * 0.45).toFixed(1));
    rooms.push({
      id: 'p-r3',
      nameAr: 'صالة العائلة الملكية الممتدة',
      nameEn: 'Private Family Lounge',
      width: livingW,
      length: livingL,
      area: Number((livingW * livingL).toFixed(1)),
      floor: 0,
      color: '#8b5cf6',
      description: 'صالة معيشة عائلية بخصوصية هادئة وإصغاء كامل.',
      x: 0.5,
      y: 0.5,
      category: 'living'
    });

    const kitchW = Number((L * 0.4).toFixed(1));
    const kitchL = Number((W * 0.4).toFixed(1));
    rooms.push({
      id: 'p-r4',
      nameAr: 'المطبخ المغلق وطاولة الطعام',
      nameEn: 'Kitchen & Dining',
      width: kitchW,
      length: kitchL,
      area: Number((kitchW * kitchL).toFixed(1)),
      floor: 0,
      color: '#f59e0b',
      description: 'مطبخ عائلي متكامل بمدخل خدمة جانبي.',
      x: 0.5,
      y: Number((livingL + 0.6).toFixed(1)),
      category: 'kitchen'
    });
  } else if (optionVariant === 2) {
    // VARIANT 3: Hotel Style Compact Central Core
    const livingW = Number((L * 0.55).toFixed(1));
    const livingL = Number((W * 0.5).toFixed(1));
    rooms.push({
      id: 'p-r3',
      nameAr: 'صالة المعيشة البانورامية (المفتوحة)',
      nameEn: 'Open Concept Great Room',
      width: livingW,
      length: livingL,
      area: Number((livingW * livingL).toFixed(1)),
      floor: 0,
      color: '#3b82f6',
      description: 'قلب المنزل العصري بأسلوب الفنادق المفتوحة.',
      x: Number((L * 0.22).toFixed(1)),
      y: 0.5,
      category: 'living'
    });

    const kitchW = Number((L * 0.35).toFixed(1));
    const kitchL = Number((W * 0.35).toFixed(1));
    rooms.push({
      id: 'p-r4',
      nameAr: 'المطبخ الأمريكي المفتوح (Open Kitchen)',
      nameEn: 'Modern Island Kitchen',
      width: kitchW,
      length: kitchL,
      area: Number((kitchW * kitchL).toFixed(1)),
      floor: 0,
      color: '#10b981',
      description: 'جزيرة مطبخ أمريكي فاخرة منفتحة على صالة الطعام.',
      x: 0.5,
      y: 0.5,
      category: 'kitchen'
    });

    const majlisW = Number((L * 0.38).toFixed(1));
    const majlisL = Number((W * 0.42).toFixed(1));
    rooms.push({
      id: 'p-r1',
      nameAr: params.hasMajlis ? 'مجلس واستراحة العصرية' : 'صالون المعيشة والموسيقى',
      nameEn: 'Modern Executive Lounge',
      width: majlisW,
      length: majlisL,
      area: Number((majlisW * majlisL).toFixed(1)),
      floor: 0,
      color: '#ec4899',
      description: 'صالون فاخر مودرن زجاجي.',
      x: Number((L - majlisW - 0.5).toFixed(1)),
      y: 0.5,
      category: 'living'
    });
  } else {
    // VARIANT 1: Standard Courtyard Open Flow
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

    const bathW = Number(Math.min(2.4, L * 0.18).toFixed(1));
    const bathL = Number(Math.min(2.2, W * 0.22).toFixed(1));
    rooms.push({
      id: 'p-r2',
      nameAr: 'حمام ومغاسل الضيوف',
      nameEn: 'Majlis Bathroom',
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
  }

  // 5. Garage if selected
  if (params.hasGarage) {
    const garW = Number(Math.min(4.5, L * 0.28).toFixed(1));
    const garL = Number(Math.min(6.0, W * 0.45).toFixed(1));
    rooms.push({
      id: 'p-r5',
      nameAr: `مرآب المغلق (${params.garageCapacity || 1} سيارة)`,
      nameEn: 'Garage',
      width: garW,
      length: garL,
      area: Number((garW * garL).toFixed(1)),
      floor: 0,
      color: '#64748b',
      description: 'كراج أوتوماتيكي مظلل بمدخل للمنزل مباشرة.',
      x: Number((L - garW - 0.5).toFixed(1)),
      y: optionVariant === 1 ? Number((W - garL - 0.5).toFixed(1)) : 0.5,
      category: 'garage'
    });
  }

  // 6. Outdoor Garden if selected
  if (params.hasGarden) {
    const gdnW = Number((L * 0.32).toFixed(1));
    const gdnL = Number((W * 0.40).toFixed(1));
    rooms.push({
      id: 'p-r6',
      nameAr: 'الحديقة والحوش الخارجي',
      nameEn: 'Garden Yard',
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

  // First floor rooms if floors > 1
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

    // Upper bathroom
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

  // Exterior Structural Walls
  const walls = [
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
  const openings = [
    { id: 'po1', type: 'door', x: Number((L * 0.2).toFixed(1)), y: 0.1, width: 1.2, rotation: 0, label: 'المدخل الرئيسي', floor: 0 },
    { id: 'po2', type: 'window', x: Number((L * 0.5).toFixed(1)), y: 0.1, width: 2.0, rotation: 0, label: 'شباك الواجهة الأمامية', floor: 0 },
    { id: 'po3', type: 'window', x: Number((L * 0.3).toFixed(1)), y: Number((W - 0.1).toFixed(1)), width: 2.2, rotation: 0, label: 'نافذة الصالة الخلفية', floor: 0 }
  ];

  // Furniture
  const furniture = [
    { id: 'pf1', type: 'sofa', label: 'طقم كنب الضيوف', x: 1.2, y: 1.2, width: 3.0, depth: 1.6, rotation: 0, floor: 0 },
    { id: 'pf2', type: 'table', label: 'طاولة طعام', x: Number((L * 0.4).toFixed(1)), y: Number((W * 0.5).toFixed(1)), width: 2.2, depth: 1.1, rotation: 0, floor: 0 }
  ];

  // Currency & cost estimation
  const costPerM2 = style === 'classic' ? 600 : style === 'modern' ? 500 : 450; // USD or equivalent
  const costMin = Math.round(builtArea * costPerM2 * 0.9);
  const costMax = Math.round(builtArea * costPerM2 * 1.25);

  return {
    id: `plan-gen-${optionVariant}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    optionTitle: optMeta.title,
    optionBadge: optMeta.badge,
    optionDescription: optMeta.desc,
    params,
    specs: {
      title: `${optMeta.title} (${L}م × ${W}م - المساحة: ${area}م²)`,
      summary: `تم توليد هذا المخطط بواسطة الذكاء الاصطناعي المعماري لـ (${style}) بأبعاد (${L} × ${W}m). ${optMeta.desc}.`,
      totalLandArea: area,
      totalBuiltArea: Number(builtArea.toFixed(1)),
      buildingFootprintArea: Number((area * 0.8).toFixed(1)),
      recommendedColumnsCount: totalColumns,
      columnsReasoning: `شبكة إنشائية مكونة من ${columnsX} محاور طولية و ${columnsY} محاور عرضية بمسافات تحمّل آمنة تجنباً للتلافي في السقوف.`,
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
      exteriorWallColor: params.facadeWallColor || (style === 'classic' ? '#fbf8f2' : '#f8fafc'),
      interiorWallColor: '#f1f5f9',
      roofColor: '#1e293b',
      windowFrameColor: '#0f172a',
      floorMaterial: 'سيراميك ورخام فاخر'
    },
    facadeImages: [
      {
        id: 'f-gen-1',
        title: 'الواجهة الرئيسية (منظور نهاري)',
        description: `تصميم معمار ${style} أنيق يناسب أبعاد الأرض ${L}x${W} متر مع إكسسوارات إضاءة وحجر طبيعي.`,
        url: style === 'classic'
          ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
          : style === 'andalusian' || style === 'mediterranean'
          ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        prompt: `Modern exterior facade of a luxury house ${L}x${W} meters with glass and stone cladding`
      },
      {
        id: 'f-gen-2',
        title: 'الإضاءة الليلية للواجهة (Night Lighting Render)',
        description: `توزيع الإضاءات المخفية LED على الكتل المعمارية والواجهة الخارجية للفيلا.`,
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        prompt: `Luxury villa facade at night with warm LED ambient lighting`
      },
      {
        id: 'f-gen-3',
        title: 'المدخل والحديقة الخارجية (Garden & Entrance)',
        description: `منظور متناسق بين مدخل الفيلا، الممر المبلط، والمسطحات الخضراء.`,
        url: params.hasGarden
          ? 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        prompt: `Modern villa entrance with landscaping and outdoor seating`
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

// Endpoint: AI Generate Plan
app.post('/api/generate-plan', async (req, res) => {
  try {
    const params = req.body;
    console.log('Generating AI House Plan with params:', params);

    const ai = getAIClient();

    if (!ai) {
      console.log('Using procedural generation fallback...');
      const fallbackPlans = generateMultipleProceduralOptions(params);
      return res.json({ success: true, plans: fallbackPlans, plan: fallbackPlans[0], source: 'procedural' });
    }

    const promptText = `
أنت مهندس معماري واستشاري إنشائي خبير. قم بتصميم وتوليد 3 خيارات معمارية هندسية متمايزة ومستقلة (options) لتوزيع قطعة أرض بلغة JSON بناءً على المدخلات التالية:
- أبعاد الأرض: الطول = ${params.length} متر، العرض = ${params.width} متر (المساحة الإجمالية = ${Number(params.length) * Number(params.width)} م²)
- عدد الطوابق: ${params.floorsCount}
- عدد غرف النوم: ${params.bedroomsCount}
- عدد الحمامات: ${params.bathroomsCount}
- عدد غرف المعيشة / الصالات: ${params.livingRoomsCount}
- المطبخ: ${params.kitchensCount}
- مجلس ضيوف: ${params.hasMajlis ? 'نعم' : 'لا'}
- مرآب سيارات: ${params.hasGarage ? `نعم (${params.garageCapacity} سيارة)` : 'لا'}
- حديقة / حوش: ${params.hasGarden ? 'نعم' : 'لا'}
- شرفة / تراس: ${params.hasBalcony ? 'نعم' : 'لا'}
- عدد الواجهات المفتوحة: ${params.facadesCount}
- الطراز المعماري: ${params.style}
- ملاحظات وااشتراطات المستخدم: ${params.customNotes || 'لا توجد ملاحظات خاصة'}

يجب أن ترجع JSON يحتوي على مصفوفة "options" تضم 3 خيارات مختلفة معمارياً:
الخيار 1: توزيع مفتوح مع فناء وإضاءة طبيعية.
الخيار 2: توزيع ملكي بخصوصية عالية وجناح ضيوف معزول.
الخيار 3: نمط عصري فندقي مدمج بأعلى كفاءة استغلال.
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: {
          systemInstruction: 'أنت مهندس معماري ومدني متخصص في التصميم المعماري والتوليد الذكي لعدة خيارات هندسية بصيغة JSON دقيقة باللغة العربية.',
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
                    specs: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        totalLandArea: { type: Type.NUMBER },
                        totalBuiltArea: { type: Type.NUMBER },
                        buildingFootprintArea: { type: Type.NUMBER },
                        recommendedColumnsCount: { type: Type.NUMBER },
                        columnsReasoning: { type: Type.STRING },
                        orientationNotes: { type: Type.STRING },
                        ventilationNotes: { type: Type.STRING },
                        structuralNotes: { type: Type.STRING },
                        estimatedCostMin: { type: Type.NUMBER },
                        estimatedCostMax: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        estimatedConcreteM3: { type: Type.NUMBER },
                        estimatedSteelTons: { type: Type.NUMBER },
                        estimatedBricksCount: { type: Type.NUMBER }
                      },
                      required: ['title', 'summary', 'totalLandArea', 'totalBuiltArea', 'recommendedColumnsCount', 'estimatedCostMin', 'estimatedCostMax']
                    },
                    rooms: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          nameAr: { type: Type.STRING },
                          nameEn: { type: Type.STRING },
                          width: { type: Type.NUMBER },
                          length: { type: Type.NUMBER },
                          area: { type: Type.NUMBER },
                          floor: { type: Type.NUMBER },
                          color: { type: Type.STRING },
                          description: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          category: { type: Type.STRING }
                        },
                        required: ['id', 'nameAr', 'width', 'length', 'area', 'floor', 'x', 'y', 'category']
                      }
                    },
                    columns: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          sizeX: { type: Type.NUMBER },
                          sizeY: { type: Type.NUMBER },
                          gridAxis: { type: Type.STRING },
                          floorSpan: { type: Type.STRING }
                        },
                        required: ['id', 'x', 'y', 'gridAxis']
                      }
                    },
                    walls: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          x1: { type: Type.NUMBER },
                          y1: { type: Type.NUMBER },
                          x2: { type: Type.NUMBER },
                          y2: { type: Type.NUMBER },
                          thickness: { type: Type.NUMBER },
                          isExterior: { type: Type.BOOLEAN },
                          floor: { type: Type.NUMBER }
                        },
                        required: ['id', 'x1', 'y1', 'x2', 'y2', 'isExterior', 'floor']
                      }
                    },
                    openings: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          type: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          width: { type: Type.NUMBER },
                          rotation: { type: Type.NUMBER },
                          label: { type: Type.STRING },
                          floor: { type: Type.NUMBER }
                        },
                        required: ['id', 'type', 'x', 'y', 'width', 'floor']
                      }
                    },
                    furniture: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          type: { type: Type.STRING },
                          label: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          width: { type: Type.NUMBER },
                          depth: { type: Type.NUMBER },
                          rotation: { type: Type.NUMBER },
                          floor: { type: Type.NUMBER }
                        },
                        required: ['id', 'type', 'label', 'x', 'y', 'floor']
                      }
                    },
                    materials: {
                      type: Type.OBJECT,
                      properties: {
                        exteriorWallColor: { type: Type.STRING },
                        interiorWallColor: { type: Type.STRING },
                        roofColor: { type: Type.STRING },
                        windowFrameColor: { type: Type.STRING },
                        floorMaterial: { type: Type.STRING }
                      }
                    }
                  },
                  required: ['optionTitle', 'specs', 'rooms', 'columns', 'walls']
                }
              }
            },
            required: ['options']
          }
        }
      });

      const jsonString = response.text ? response.text.trim() : '';
      const parsedData = JSON.parse(jsonString);

      const generatedPlans = (parsedData.options || []).map((opt: any, idx: number) => ({
        id: `ai-plan-opt-${idx}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        optionTitle: opt.optionTitle || `الخيار ${idx + 1}`,
        optionBadge: opt.optionBadge || `تصميم AI متميز ${idx + 1}`,
        optionDescription: opt.optionDescription || opt.specs?.summary || '',
        params,
        specs: opt.specs,
        rooms: opt.rooms || [],
        walls: opt.walls || [],
        columns: opt.columns || [],
        openings: opt.openings || [],
        furniture: opt.furniture || [],
        materials: opt.materials || {
          exteriorWallColor: params.facadeWallColor || '#f8fafc',
          interiorWallColor: '#f1f5f9',
          roofColor: '#1e293b',
          windowFrameColor: '#0f172a',
          floorMaterial: 'رخام وبلاط فاخر'
        },
        facadeImages: [
          {
            id: `f-gen-${idx}-1`,
            title: `واجهة الفيلا الرئيسية (${params.style})`,
            description: `تصميم معماري ناصع الفخامة يراعي التوجيه المخصص: "${params.customNotes || 'طراز معاصر ودقيق'}"`,
            url: params.style === 'classic'
              ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
              : params.style === 'andalusian' || params.style === 'mediterranean'
              ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
              : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
            prompt: `Photorealistic ${params.style} villa exterior facade rendering with ${params.customNotes || 'modern white stone cladding and panoramic glass'}`
          },
          {
            id: `f-gen-${idx}-2`,
            title: 'المظهر الليلي والإضاءة المعمارية (Night Lighting Render)',
            description: 'إظهار سيناريو الإضاءة الليلية الدافئة وإبراز خامات الحجر والكتل البارزة.',
            url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
            prompt: `Luxury ${params.style} villa exterior at night with warm LED sconces`
          },
          {
            id: `f-gen-${idx}-3`,
            title: 'منظور الحديقة والمدخل (Garden & Landscaping)',
            description: 'دمج المدخل مع المسطحات الخضراء والحديقة الخارجية.',
            url: params.hasGarden
              ? 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
              : 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
            prompt: `Landscaping entrance garden for luxury villa`
          }
        ]
      }));

      if (generatedPlans.length === 0) {
        throw new Error('Gemini returned empty options array');
      }

      return res.json({ success: true, plans: generatedPlans, plan: generatedPlans[0], source: 'gemini' });
    } catch (genError) {
      console.error('Gemini call failed, falling back to procedural options:', genError);
      const fallbackPlans = generateMultipleProceduralOptions(params);
      return res.json({ success: true, plans: fallbackPlans, plan: fallbackPlans[0], source: 'procedural-fallback' });
    }
  } catch (error: any) {
    console.error('Server error generating plan:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
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
