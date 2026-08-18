export type ArchitecturalStyle = 'modern' | 'classic' | 'andalusian' | 'mediterranean' | 'minimalist';

export type Currency = 'SAR' | 'USD' | 'DZD' | 'AED' | 'EGP';

export interface HouseInputParams {
  length: number; // in meters (الطول)
  width: number; // in meters (العرض)
  floorsCount: number; // 1, 2, 3 (عدد الطوابق)
  bedroomsCount: number; // غرف النوم
  bathroomsCount: number; // الحمامات
  livingRoomsCount: number; // غرف المعيشة / الصالون
  kitchensCount: number; // المطابخ
  hasMajlis: boolean; // مجلس ضيوف
  hasGarage: boolean; // مرآب سيارات
  garageCapacity: number; // عدد السيارات (1 or 2)
  hasGarden: boolean; // حديقة / حوش
  hasBalcony: boolean; // شرفة / تراس
  facadesCount: number; // عدد الواجهات المفتوحة (1 to 4)
  openFacadeDirections?: ('front' | 'back' | 'right' | 'left')[]; // الواجهات المفتوحة المحددة
  facadeWallColor?: string; // لون جدران الواجهة
  accentColor?: string; // لون التطعيمات (خشبي/رخام/أسود)
  lightingColor?: string; // لون الإضاءة الليلية
  showFurniture?: boolean; // إظهار الأثاث الداخلي
  showFence?: boolean; // إظهار السور الخارجي والبوابة
  showGardenDecor?: boolean; // إظهار تزيين الحديقة والمسبح
  style: ArchitecturalStyle; // الطراز المعماري
  customNotes: string; // ملاحظات وإرشادات خاصة
}

export interface RoomData {
  id: string;
  nameAr: string;
  nameEn: string;
  width: number; // in meters
  length: number; // in meters
  area: number; // m²
  floor: number; // 0 for ground, 1 for first floor, etc.
  color: string;
  description: string;
  x: number; // meter offset from top-left (0 to house length)
  y: number; // meter offset from top-left (0 to house width)
  category: 'living' | 'bedroom' | 'bathroom' | 'kitchen' | 'garage' | 'hall' | 'outdoor' | 'balcony';
}

export interface WallData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number; // in meters (e.g. 0.25 for exterior, 0.15 for interior)
  isExterior: boolean;
  floor: number;
}

export interface ColumnData {
  id: string;
  x: number; // meters from top-left
  y: number; // meters from top-left
  sizeX: number; // meters e.g. 0.2 x 0.5
  sizeY: number;
  gridAxis: string; // e.g. "A-1", "B-2"
  floorSpan: string; // e.g. "الأرضي إلى السقف"
}

export interface OpeningData {
  id: string;
  type: 'door' | 'window';
  x: number;
  y: number;
  width: number;
  rotation: number; // 0, 90, 180, 270 degrees
  label: string;
  floor: number;
}

export interface FurnitureData {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  floor: number;
}

export interface ArchitecturalSpecs {
  title: string;
  summary: string;
  totalLandArea: number; // m²
  totalBuiltArea: number; // m²
  buildingFootprintArea: number; // m²
  recommendedColumnsCount: number;
  columnsReasoning: string;
  orientationNotes: string;
  ventilationNotes: string;
  structuralNotes: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  currency: Currency;
  estimatedConcreteM3: number;
  estimatedSteelTons: number;
  estimatedBricksCount: number;
}

export interface FacadeImageData {
  id: string;
  title: string;
  description: string;
  url: string;
  prompt: string;
}

export interface AIOptionPlan {
  optionId: string;
  optionTitle: string; // e.g. "الخيار الأول: توزيع مفتوح مع فناء"
  optionBadge: string; // e.g. "أعلى استغلال للمساحة ✨"
  optionDescription: string; // e.g. "تصميم يركز على الفضاءات المفتوحة مع ربط الصالة بالحديقة والإضاءة المباشرة."
  plan: GeneratedHousePlan;
}

export interface GeneratedHousePlan {
  id: string;
  timestamp: string;
  optionTitle?: string;
  optionBadge?: string;
  optionDescription?: string;
  params: HouseInputParams;
  specs: ArchitecturalSpecs;
  rooms: RoomData[];
  walls: WallData[];
  columns: ColumnData[];
  openings: OpeningData[];
  furniture: FurnitureData[];
  materials: {
    exteriorWallColor: string;
    interiorWallColor: string;
    roofColor: string;
    windowFrameColor: string;
    floorMaterial: string;
  };
  facadeImages: FacadeImageData[];
}
