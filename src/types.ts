export type ArchitecturalStyle =
  | 'modern'
  | 'classic'
  | 'andalusian'
  | 'mediterranean'
  | 'minimalist'
  | 'traditional'
  | 'algerian'
  | 'luxury'
  | 'economic'
  | 'industrial';

export type RoofType = 'flat' | 'sloped';

export type Currency = 'DZD' | 'SAR' | 'USD' | 'AED' | 'EGP';

export type AppLanguage = 'ar' | 'fr' | 'en';

export type MeasurementUnit = 'm' | 'cm';

export type WorkspaceViewMode = '3d' | '2d' | 'split';

export type EditorTool =
  | 'select'
  | 'move'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'furniture'
  | 'measure'
  | 'delete';

export type CameraPresetMode =
  | 'iso'
  | 'top'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'walk';

export type LayerKey =
  | 'land'
  | 'foundations'
  | 'walls'
  | 'columns'
  | 'beams'
  | 'slabs'
  | 'roof'
  | 'doors'
  | 'windows'
  | 'furniture'
  | 'lighting'
  | 'plants'
  | 'site';

export type LayerVisibilityMap = Record<LayerKey, boolean>;

export const DEFAULT_LAYERS: LayerVisibilityMap = {
  land: true,
  foundations: true,
  walls: true,
  columns: true,
  beams: true,
  slabs: true,
  roof: true,
  doors: true,
  windows: true,
  furniture: true,
  lighting: true,
  plants: true,
  site: true,
};

export type WallType = 'exterior' | 'interior' | 'structural';

export type FurnitureCatalogType =
  | 'bed'
  | 'wardrobe'
  | 'desk'
  | 'sofa'
  | 'table'
  | 'chair'
  | 'tv'
  | 'kitchen_counter'
  | 'fridge'
  | 'washer'
  | 'sink'
  | 'toilet'
  | 'shower'
  | 'lamp'
  | 'plant'
  | 'decor'
  | 'car';

export interface SiteSettings {
  buildingOffsetX: number; // meters from left lot boundary
  buildingOffsetY: number; // meters from back lot boundary
  hasFence: boolean;
  hasGate: boolean;
  hasDriveway: boolean;
  hasParking: boolean;
  hasPool: boolean;
  hasPatio: boolean;
  hasGardenLights: boolean;
}

export interface HouseInputParams {
  length: number; // in meters (الطول)
  width: number; // in meters (العرض)
  targetBuiltArea?: number; // in m² مساحة البناء المطلوبة
  floorsCount: number; // 1, 2, 3, 4 (عدد الطوابق)
  bedroomsCount: number; // غرف النوم
  bathroomsCount: number; // الحمامات
  livingRoomsCount: number; // غرف المعيشة / الصالون
  kitchensCount: number; // المطابخ
  hasMajlis: boolean; // مجلس ضيوف
  hasGarage: boolean; // مرآب سيارات
  garageCapacity: number; // عدد السيارات (0, 1 or 2)
  hasGarden: boolean; // حديقة / حوش
  hasBalcony: boolean; // شرفة / تراس
  hasStairs: boolean; // درج / سلم داخلي
  hasCourtyard: boolean; // فناء داخلي / وسط الدار
  roofType: RoofType; // نوع السقف: مسطح أو مائل
  wallMaterial?: string; // مواد البناء والواجهة
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
  naturalLanguagePrompt?: string; // وصف حر باللغة الطبيعية لتوليد المخطط
  lotShape?: 'rectangle' | 'square' | 'corner' | 'l-shape';
  siteSettings?: SiteSettings;
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
  category:
    | 'living'
    | 'bedroom'
    | 'bathroom'
    | 'kitchen'
    | 'garage'
    | 'hall'
    | 'outdoor'
    | 'balcony';
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
  height?: number; // wall height in meters (default 3.2)
  wallType?: WallType;
  label?: string;
}

export interface ColumnData {
  id: string;
  x: number; // meters from top-left
  y: number; // meters from top-left
  sizeX: number; // meters e.g. 0.25 x 0.45
  sizeY: number;
  gridAxis: string; // e.g. "A-1", "B-2"
  floorSpan: string; // e.g. "الأرضي إلى السقف"
}

export interface BeamData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  depth: number;
  floor: number;
}

export interface FoundationData {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  depth: number;
  columnId: string;
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
  height?: number;
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
  color?: string;
  scale?: number;
  height?: number;
  roomId?: string;
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
  optionTitle: string;
  optionBadge: string;
  optionDescription: string;
  plan: GeneratedHousePlan;
}

export interface GeneratedHousePlan {
  id: string;
  timestamp: string;
  source?: 'gemini' | 'procedural';
  aiModel?: string;
  generationNotes?: string;
  optionTitle?: string;
  optionBadge?: string;
  optionDescription?: string;
  params: HouseInputParams;
  specs: ArchitecturalSpecs;
  rooms: RoomData[];
  walls: WallData[];
  columns: ColumnData[];
  beams?: BeamData[];
  foundations?: FoundationData[];
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

export type SelectedEntity =
  | { kind: 'room'; id: string }
  | { kind: 'wall'; id: string }
  | { kind: 'furniture'; id: string }
  | { kind: 'opening'; id: string }
  | { kind: 'column'; id: string }
  | null;

export interface CostStageConfig {
  id: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  unitAr: string;
  unitFr: string;
  unitEn: string;
  quantity: number;
  materialUnitRateDZD: number;
  laborUnitRateDZD: number;
}

export interface DesignIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  titleAr: string;
  titleFr: string;
  titleEn: string;
  detailAr: string;
  detailFr: string;
  detailEn: string;
  suggestionAr: string;
  suggestionFr: string;
  suggestionEn: string;
  floor?: number;
  targetId?: string;
}

export interface AIAssistantCommandEntry {
  id: string;
  timestamp: string;
  command: string;
  explanation: string;
  applied: boolean;
  source: 'gemini' | 'local';
}

export interface ArchProjectRecord {
  id: string;
  info: {
    name: string;
    createdAt: string;
    updatedAt: string;
    version: string;
    author: string;
  };
  site: SiteSettings;
  plan: GeneratedHousePlan;
  layers: LayerVisibilityMap;
  costRatesDZD: Record<string, { material: number; labor: number }>;
  camera: {
    preset: CameraPresetMode;
    explodedAmount: number;
    selectedFloor3D: number | 'all';
    viewMode: 'realistic' | 'structural' | 'night';
  };
  settings: {
    language: AppLanguage;
    currency: Currency;
    unit: MeasurementUnit;
  };
  assistantLog: AIAssistantCommandEntry[];
}
