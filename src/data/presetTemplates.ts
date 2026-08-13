import { GeneratedHousePlan } from '../types';

export const DEFAULT_HOUSE_PLAN: GeneratedHousePlan = {
  id: 'plan-villa-modern-150m2',
  timestamp: new Date().toISOString(),
  params: {
    length: 15,
    width: 10,
    floorsCount: 2,
    bedroomsCount: 4,
    bathroomsCount: 3,
    livingRoomsCount: 2,
    kitchensCount: 1,
    hasMajlis: true,
    hasGarage: true,
    garageCapacity: 1,
    hasGarden: true,
    hasBalcony: true,
    facadesCount: 2,
    openFacadeDirections: ['front', 'left'],
    facadeWallColor: '#f8fafc',
    accentColor: '#92400e',
    lightingColor: '#fbbf24',
    showFurniture: true,
    showFence: true,
    showGardenDecor: true,
    style: 'modern',
    customNotes: 'فيلا عصرية بطابقين وصالة واسعة مفتوحة على الحديقة مع مرآب سيارة ومدخل مستقل للمجلس'
  },
  specs: {
    title: 'تصميم فيلا عصرية راقية (150 م² أرضي + 140 م² علوي)',
    summary: 'مخطط معماري متكامل لفيلا عصرية بطابقين توفر استغلالاً مثالياً للمساحة مع حركة سلسة وتهوية ممتازة وخصوصية كاملة للعائلة والضيوف.',
    totalLandArea: 150,
    totalBuiltArea: 290,
    buildingFootprintArea: 130,
    recommendedColumnsCount: 14,
    columnsReasoning: 'تم اعتماد شبكة محاور منتظمة بمسافات تراوح بين 4.0م و 4.5م لضمان توزيع الأحمال الإنشائية بكفاءة وبدون هدر في الحديد والخرسانة.',
    orientationNotes: 'توجيه صالة المعيشة وغرفة النوم الرئيسية نحو الجنوب والشرق للاستفادة من الإضاءة الطبيعية والتهوية المباشرة.',
    ventilationNotes: 'وجود منور داخلي وحديقة خلفية يضمن تدفق الهواء النقي عبر كافة الفضاءات الداخلية وتقليل استهلاك الطاقة.',
    structuralNotes: 'أساسات قواعد منفصلة مع شريطية عند الحوائط الحاملة، وأعمدة خرسانية بأبعاد 20×50 سم مع بلاطة سقف هوردي (Ribbed Slab) بسمك 25 سم.',
    estimatedCostMin: 140000,
    estimatedCostMax: 185000,
    currency: 'SAR',
    estimatedConcreteM3: 135,
    estimatedSteelTons: 14.2,
    estimatedBricksCount: 9800
  },
  rooms: [
    // Ground Floor (floor: 0)
    {
      id: 'r1',
      nameAr: 'مجلس الضيوف الرئيسي',
      nameEn: 'Main Majlis',
      width: 5.0,
      length: 4.5,
      area: 22.5,
      floor: 0,
      color: '#3b82f6',
      description: 'مجلس فخم ومدخل مستقل مع مغاسل وحمام خاص بالضيوف.',
      x: 0.5,
      y: 0.5,
      category: 'living'
    },
    {
      id: 'r2',
      nameAr: 'حمام ومغاسل الضيوف',
      nameEn: 'Majlis Bathroom',
      width: 2.0,
      length: 2.5,
      area: 5.0,
      floor: 0,
      color: '#06b6d4',
      description: 'حمام ضيوف مجهز بأرقى التجهيزات المعمارية.',
      x: 5.5,
      y: 0.5,
      category: 'bathroom'
    },
    {
      id: 'r3',
      nameAr: 'صالة العائلة والاستقبال',
      nameEn: 'Family Living Room',
      width: 5.5,
      length: 5.0,
      area: 27.5,
      floor: 0,
      color: '#8b5cf6',
      description: 'صالة واسعة بإطلالة زجاجية كاملة على الحديقة والمدخل.',
      x: 0.5,
      y: 5.0,
      category: 'living'
    },
    {
      id: 'r4',
      nameAr: 'المطبخ العصري',
      nameEn: 'Kitchen',
      width: 4.0,
      length: 3.5,
      area: 14.0,
      floor: 0,
      color: '#f59e0b',
      description: 'مطبخ متكامل مع جزيرة تحضير ومنفذ خدَمي جانبي.',
      x: 6.0,
      y: 3.0,
      category: 'kitchen'
    },
    {
      id: 'r5',
      nameAr: 'غرفة الطعام (المقلط)',
      nameEn: 'Dining Room',
      width: 4.0,
      length: 3.5,
      area: 14.0,
      floor: 0,
      color: '#ec4899',
      description: 'غرفة طعام متصلة بمجلس الضيوف والصالة لتسهيل الضيافة.',
      x: 6.0,
      y: 6.5,
      category: 'living'
    },
    {
      id: 'r6',
      nameAr: 'مرآب السيارات المغطى',
      nameEn: 'Car Garage',
      width: 3.5,
      length: 5.5,
      area: 19.25,
      floor: 0,
      color: '#64748b',
      description: 'كراج يتسع لسيارة مع باب كهربائي ومدخل مباشر للمنزل.',
      x: 10.0,
      y: 0.5,
      category: 'garage'
    },
    {
      id: 'r7',
      nameAr: 'الحديقة والحوش الخارجي',
      nameEn: 'Garden Yard',
      width: 4.0,
      length: 4.0,
      area: 16.0,
      floor: 0,
      color: '#10b981',
      description: 'حديقة جانبية خضراء بمتنفس طبيعي وجلسة خارجية.',
      x: 10.0,
      y: 6.0,
      category: 'outdoor'
    },

    // First Floor (floor: 1)
    {
      id: 'r8',
      nameAr: 'غرفة النوم الرئيسية (ماستر)',
      nameEn: 'Master Bedroom',
      width: 5.0,
      length: 4.5,
      area: 22.5,
      floor: 1,
      color: '#6366f1',
      description: 'غرفة نوم رئيسية واسعة مع غرفة ملابس وحمام خاص وشرفة.',
      x: 0.5,
      y: 0.5,
      category: 'bedroom'
    },
    {
      id: 'r9',
      nameAr: 'حمام النوم الرئيسي',
      nameEn: 'Master Bathroom',
      width: 2.5,
      length: 2.5,
      area: 6.25,
      floor: 1,
      color: '#0284c7',
      description: 'حمام ماستر يضم جاكوزي ودش مطري.',
      x: 5.5,
      y: 0.5,
      category: 'bathroom'
    },
    {
      id: 'r10',
      nameAr: 'غرفة نوم الأبناء 1',
      nameEn: 'Bedroom 1',
      width: 4.0,
      length: 4.0,
      area: 16.0,
      floor: 1,
      color: '#3b82f6',
      description: 'غرفة نوم مريحة مزودة بدولاب مدمج وإضاءة ممتازة.',
      x: 0.5,
      y: 5.0,
      category: 'bedroom'
    },
    {
      id: 'r11',
      nameAr: 'غرفة نوم الأبناء 2',
      nameEn: 'Bedroom 2',
      width: 4.0,
      length: 4.0,
      area: 16.0,
      floor: 1,
      color: '#a855f7',
      description: 'غرفة نوم أطفال أو ضيوف إضافية.',
      x: 4.5,
      y: 5.0,
      category: 'bedroom'
    },
    {
      id: 'r12',
      nameAr: 'غرفة المعيشة العلوية',
      nameEn: 'Upper Living Room',
      width: 4.5,
      length: 4.0,
      area: 18.0,
      floor: 1,
      color: '#f43f5e',
      description: 'مساحة عائلية خاصة بالطابق العلوي للراحة ومشاهدة التلفاز.',
      x: 8.5,
      y: 0.5,
      category: 'living'
    },
    {
      id: 'r13',
      nameAr: 'حمام مشترك علوي',
      nameEn: 'Shared Upper Bathroom',
      width: 2.0,
      length: 2.5,
      area: 5.0,
      floor: 1,
      color: '#14b8a6',
      description: 'حمام يخدم غرف النوم والصالة العلوية.',
      x: 8.5,
      y: 4.5,
      category: 'bathroom'
    },
    {
      id: 'r14',
      nameAr: 'شرفة وتراس إطلالة',
      nameEn: 'Balcony Terrace',
      width: 3.5,
      length: 2.5,
      area: 8.75,
      floor: 1,
      color: '#f59e0b',
      description: 'تراس علوي مشرق ومطل على الحديقة والشارع.',
      x: 10.5,
      y: 7.0,
      category: 'balcony'
    }
  ],
  walls: [
    // Outer perimeter walls ground floor
    { id: 'w1', x1: 0, y1: 0, x2: 14.5, y2: 0, thickness: 0.25, isExterior: true, floor: 0 },
    { id: 'w2', x1: 14.5, y1: 0, x2: 14.5, y2: 9.8, thickness: 0.25, isExterior: true, floor: 0 },
    { id: 'w3', x1: 14.5, y1: 9.8, x2: 0, y2: 9.8, thickness: 0.25, isExterior: true, floor: 0 },
    { id: 'w4', x1: 0, y1: 9.8, x2: 0, y2: 0, thickness: 0.25, isExterior: true, floor: 0 },
    // Interior partition walls
    { id: 'w5', x1: 5.5, y1: 0, x2: 5.5, y2: 4.8, thickness: 0.15, isExterior: false, floor: 0 },
    { id: 'w6', x1: 0, y1: 4.8, x2: 10.0, y2: 4.8, thickness: 0.15, isExterior: false, floor: 0 },
    { id: 'w7', x1: 9.8, y1: 0, x2: 9.8, y2: 6.0, thickness: 0.15, isExterior: false, floor: 0 },

    // Outer perimeter walls first floor
    { id: 'wf1', x1: 0, y1: 0, x2: 14.5, y2: 0, thickness: 0.25, isExterior: true, floor: 1 },
    { id: 'wf2', x1: 14.5, y1: 0, x2: 14.5, y2: 9.8, thickness: 0.25, isExterior: true, floor: 1 },
    { id: 'wf3', x1: 14.5, y1: 9.8, x2: 0, y2: 9.8, thickness: 0.25, isExterior: true, floor: 1 },
    { id: 'wf4', x1: 0, y1: 9.8, x2: 0, y2: 0, thickness: 0.25, isExterior: true, floor: 1 }
  ],
  columns: [
    { id: 'c1', x: 0.2, y: 0.2, sizeX: 0.25, sizeY: 0.5, gridAxis: 'A-1', floorSpan: 'كافة الطوابق' },
    { id: 'c2', x: 5.0, y: 0.2, sizeX: 0.25, sizeY: 0.5, gridAxis: 'A-2', floorSpan: 'كافة الطوابق' },
    { id: 'c3', x: 9.8, y: 0.2, sizeX: 0.25, sizeY: 0.5, gridAxis: 'A-3', floorSpan: 'كافة الطوابق' },
    { id: 'c4', x: 14.3, y: 0.2, sizeX: 0.25, sizeY: 0.5, gridAxis: 'A-4', floorSpan: 'كافة الطوابق' },

    { id: 'c5', x: 0.2, y: 4.8, sizeX: 0.25, sizeY: 0.5, gridAxis: 'B-1', floorSpan: 'كافة الطوابق' },
    { id: 'c6', x: 5.0, y: 4.8, sizeX: 0.25, sizeY: 0.5, gridAxis: 'B-2', floorSpan: 'كافة الطوابق' },
    { id: 'c7', x: 9.8, y: 4.8, sizeX: 0.25, sizeY: 0.5, gridAxis: 'B-3', floorSpan: 'كافة الطوابق' },
    { id: 'c8', x: 14.3, y: 4.8, sizeX: 0.25, sizeY: 0.5, gridAxis: 'B-4', floorSpan: 'كافة الطوابق' },

    { id: 'c9', x: 0.2, y: 9.6, sizeX: 0.25, sizeY: 0.5, gridAxis: 'C-1', floorSpan: 'كافة الطوابق' },
    { id: 'c10', x: 5.0, y: 9.6, sizeX: 0.25, sizeY: 0.5, gridAxis: 'C-2', floorSpan: 'كافة الطوابق' },
    { id: 'c11', x: 9.8, y: 9.6, sizeX: 0.25, sizeY: 0.5, gridAxis: 'C-3', floorSpan: 'كافة الطوابق' },
    { id: 'c12', x: 14.3, y: 9.6, sizeX: 0.25, sizeY: 0.5, gridAxis: 'C-4', floorSpan: 'كافة الطوابق' },
    { id: 'c13', x: 2.5, y: 4.8, sizeX: 0.25, sizeY: 0.5, gridAxis: 'B-1.5', floorSpan: 'كافة الطوابق' },
    { id: 'c14', x: 12.0, y: 4.8, sizeX: 0.25, sizeY: 0.5, gridAxis: 'B-3.5', floorSpan: 'كافة الطوابق' }
  ],
  openings: [
    { id: 'op1', type: 'door', x: 2.8, y: 0.1, width: 1.2, rotation: 0, label: 'مدخل المجلس الرئيسي', floor: 0 },
    { id: 'op2', type: 'door', x: 0.1, y: 7.2, width: 1.1, rotation: 90, label: 'المدخل العائلي الرئيسي', floor: 0 },
    { id: 'op3', type: 'door', x: 11.2, y: 0.1, width: 2.8, rotation: 0, label: 'باب الكراج الأوتوماتيكي', floor: 0 },
    { id: 'op4', type: 'window', x: 1.2, y: 0.1, width: 1.8, rotation: 0, label: 'شباك المجلس', floor: 0 },
    { id: 'op5', type: 'window', x: 2.5, y: 9.7, width: 2.4, rotation: 0, label: 'نافذة الصالة الواسعة', floor: 0 },
    { id: 'op6', type: 'window', x: 7.5, y: 9.7, width: 1.8, rotation: 0, label: 'نافذة المطبخ', floor: 0 },

    // First Floor
    { id: 'op7', type: 'window', x: 2.0, y: 0.1, width: 2.0, rotation: 0, label: 'نافذة الماستر', floor: 1 },
    { id: 'op8', type: 'window', x: 11.0, y: 0.1, width: 2.0, rotation: 0, label: 'شباك المعيشة', floor: 1 }
  ],
  furniture: [
    { id: 'f1', type: 'sofa', label: 'طقم كنب المجلس', x: 1.5, y: 1.2, width: 3.2, depth: 1.8, rotation: 0, floor: 0 },
    { id: 'f2', type: 'tv', label: 'شاشة التلفزيون', x: 4.8, y: 2.0, width: 0.3, depth: 1.5, rotation: 90, floor: 0 },
    { id: 'f3', type: 'sofa', label: 'جلسة الصالة', x: 1.5, y: 6.0, width: 3.5, depth: 2.2, rotation: 0, floor: 0 },
    { id: 'f4', type: 'table', label: 'طاولة طعام 8 كراسي', x: 6.5, y: 7.0, width: 2.4, depth: 1.2, rotation: 0, floor: 0 },
    { id: 'f5', type: 'kitchen_counter', label: 'طاولة تحضير مطبخ', x: 7.0, y: 3.5, width: 2.8, depth: 1.5, rotation: 0, floor: 0 },
    { id: 'f6', type: 'car', label: 'سيارة', x: 10.8, y: 1.8, width: 2.0, depth: 4.2, rotation: 0, floor: 0 },

    // First floor furniture
    { id: 'f7', type: 'bed', label: 'سرير مزدوج كبير', x: 1.5, y: 1.5, width: 2.0, depth: 2.0, rotation: 0, floor: 1 },
    { id: 'f8', type: 'bed', label: 'سرير أطفال 1', x: 1.2, y: 6.0, width: 1.5, depth: 2.0, rotation: 0, floor: 1 },
    { id: 'f9', type: 'bed', label: 'سرير أطفال 2', x: 5.2, y: 6.0, width: 1.5, depth: 2.0, rotation: 0, floor: 1 }
  ],
  materials: {
    exteriorWallColor: '#f8fafc',
    interiorWallColor: '#f1f5f9',
    roofColor: '#334155',
    windowFrameColor: '#1e293b',
    floorMaterial: 'رخام أبيض وفاخر'
  },
  facadeImages: [
    {
      id: 'facade-main',
      title: 'الواجهة الأمامية الحداثية',
      description: 'تصميم مودرن بواجهات زجاجية واسعة مع إضاءة معمارية غاطسة ولندسكيب أنيق.',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Photorealistic architectural render of a modern luxury 2-story villa, warm night lighting, minimalist white and concrete exterior facade, large glass windows, car garage'
    },
    {
      id: 'facade-side',
      title: 'المنظور الجانبي مع الحديقة',
      description: 'إطلالة جانبية تعكس انسجام الكتل المعمارية والخصوصية مع المسابح والجلسات الخارجية.',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Modern architectural house side elevation with outdoor garden, pool, wooden louvers, contemporary design'
    },
    {
      id: 'facade-night',
      title: 'الإضاءة المعمارية الليلية',
      description: 'تأثير السפوتلايت والليدات المخفية الموزعة هندسياً على العناصر الإنشائية.',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Luxury modern house villa facade rendered at dusk with warm LED strip architectural lighting'
    }
  ]
};

export const PRESET_EXAMPLES = [
  {
    name: 'فيلا عصرية مودرن (15 × 10 م)',
    desc: 'طابقين + كراج + حديقة + 4 غرف نوم + مجلس مستقل',
    params: { ...DEFAULT_HOUSE_PLAN.params }
  },
  {
    name: 'منزل اقتصادي أرضي (12 × 10 م)',
    desc: 'طابق واحد + 3 غرف نوم + صالة واسعة + حوش أمامي',
    params: {
      length: 12,
      width: 10,
      floorsCount: 1,
      bedroomsCount: 3,
      bathroomsCount: 2,
      livingRoomsCount: 1,
      kitchensCount: 1,
      hasMajlis: true,
      hasGarage: true,
      garageCapacity: 1,
      hasGarden: true,
      hasBalcony: false,
      facadesCount: 2,
      style: 'modern' as const,
      customNotes: 'منزل أرضي مريح وعصري بتكلفة اقتصادية واستغلال ذكي للضوء الطبيعي'
    }
  },
  {
    name: 'فيلا كلاسيكية فخمة (18 × 12 م)',
    desc: 'طابقين + كراج سيارتين + مسبح + 5 غرف نوم ماستر + ملحق',
    params: {
      length: 18,
      width: 12,
      floorsCount: 2,
      bedroomsCount: 5,
      bathroomsCount: 4,
      livingRoomsCount: 2,
      kitchensCount: 2,
      hasMajlis: true,
      hasGarage: true,
      garageCapacity: 2,
      hasGarden: true,
      hasBalcony: true,
      facadesCount: 3,
      style: 'classic' as const,
      customNotes: 'فيلا كلاسيكية فاخرة بأعمدة دائرية وواجهات حجرية وفخامة معمارية'
    }
  },
  {
    name: 'بيت أندلسي إسلامي معاصر (16 × 14 م)',
    desc: 'وسط الدار (فناء داخلي) + نافورة + 4 غرف + طراز أندلسي أصيل',
    params: {
      length: 16,
      width: 14,
      floorsCount: 2,
      bedroomsCount: 4,
      bathroomsCount: 4,
      livingRoomsCount: 2,
      kitchensCount: 1,
      hasMajlis: true,
      hasGarage: true,
      garageCapacity: 1,
      hasGarden: true,
      hasBalcony: true,
      facadesCount: 2,
      style: 'andalusian' as const,
      customNotes: 'تصميم أندلسي بفناء داخلي ونافورة وأقواس إسلامية مريحة تعزز الخصوصية والتهوية'
    }
  }
];
