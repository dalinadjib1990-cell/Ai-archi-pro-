import { AppLanguage, MeasurementUnit } from '../types';

export interface UILabels {
  appSubtitle: string;
  save: string;
  saved: string;
  undo: string;
  redo: string;
  projects: string;
  exportBlueprint: string;
  view3D: string;
  view2D: string;
  viewSplit: string;
  tabInputs: string;
  tabRoomsFurn: string;
  tabSpecs: string;
  tabFacades: string;
  tabSiteLayers: string;
  tabAnalyze: string;
  tabAI: string;
  currencyLabel: string;
  reset: string;
  toolSelect: string;
  toolMove: string;
  toolWall: string;
  toolRoom: string;
  toolDoor: string;
  toolWindow: string;
  toolFurniture: string;
  toolMeasure: string;
  toolDelete: string;
  smartFurnish: string;
  analyzeDesign: string;
  explodedView: string;
  layersTitle: string;
  structureMode: string;
  walkMode: string;
  orbitMode: string;
  inspectorTitle: string;
  noSelection: string;
  unitMeters: string;
  unitCm: string;
  lotArea: string;
  builtArea: string;
  roomsTotalArea: string;
  disclaimerStructural: string;
}

export const UI_TRANSLATIONS: Record<AppLanguage, UILabels> = {
  ar: {
    appSubtitle: 'AI Architecture Studio — استوديو التصميم المعماري 3D CAD & Blueprint',
    save: 'حفظ',
    saved: 'تم الحفظ',
    undo: 'تراجع',
    redo: 'إعادة',
    projects: 'المشاريع',
    exportBlueprint: 'تصدير / طباعة',
    view3D: 'عرض 3D',
    view2D: 'مخطط 2D',
    viewSplit: 'عرض مزدوج',
    tabInputs: 'المدخلات والتوليد',
    tabRoomsFurn: 'الغرف والأثاث',
    tabSpecs: 'الكميات والتكلفة (د.ج)',
    tabFacades: 'الواجهات المعمارية',
    tabSiteLayers: 'الطبقات والموقع',
    tabAnalyze: 'فحص التصميم',
    tabAI: 'مساعد الذكاء',
    currencyLabel: 'العملة',
    reset: 'إعادة ضبط',
    toolSelect: 'تحديد',
    toolMove: 'تحريك',
    toolWall: 'جدار',
    toolRoom: 'غرفة',
    toolDoor: 'باب',
    toolWindow: 'نافذة',
    toolFurniture: 'أثاث',
    toolMeasure: 'قياس',
    toolDelete: 'حذف',
    smartFurnish: 'تأثيث ذكي تلقائي',
    analyzeDesign: 'فحص التصميم هندسياً',
    explodedView: 'عرض تفكيكي (Exploded)',
    layersTitle: 'الطبقات المعمارية (13 طبقة)',
    structureMode: 'الهيكل الإنشائي',
    walkMode: 'جولة داخلية (Walk)',
    orbitMode: 'دوران حر (Orbit)',
    inspectorTitle: 'مفتش الخصائص (Properties)',
    noSelection: 'انقر على أي جدار أو غرفة أو أثاث أو فتحة لتعديل أبعاده وخصائصه مباشرة.',
    unitMeters: 'متر (m)',
    unitCm: 'سنتيمتر (cm)',
    lotArea: 'مساحة الأرض',
    builtArea: 'مساحة البناء',
    roomsTotalArea: 'مجموع الغرف',
    disclaimerStructural:
      'تنبيه هندسي: جميع الكميات الإنشائية وتقديرات التكلفة وتحليلات التصميم استرشادية أولية وتخضع لمراجعة مهندس مدني/معماري معتمد وفحص التربة والكود المحلي.',
  },
  fr: {
    appSubtitle: 'AI Architecture Studio — 3D CAD & Générateur de Plans',
    save: 'Enregistrer',
    saved: 'Enregistré',
    undo: 'Annuler',
    redo: 'Rétablir',
    projects: 'Projets',
    exportBlueprint: 'Exporter / Imprimer',
    view3D: 'Vue 3D',
    view2D: 'Plan 2D',
    viewSplit: 'Vue Partagée',
    tabInputs: 'Paramètres & IA',
    tabRoomsFurn: 'Pièces & Mobilier',
    tabSpecs: 'Devis & Structure',
    tabFacades: 'Façades 3D',
    tabSiteLayers: 'Calques & Site',
    tabAnalyze: 'Audit Design',
    tabAI: 'Assistant IA',
    currencyLabel: 'Devise',
    reset: 'Réinitialiser',
    toolSelect: 'Sélection',
    toolMove: 'Déplacer',
    toolWall: 'Mur',
    toolRoom: 'Pièce',
    toolDoor: 'Porte',
    toolWindow: 'Fenêtre',
    toolFurniture: 'Meuble',
    toolMeasure: 'Mesure',
    toolDelete: 'Suppr.',
    smartFurnish: 'AMEUBLEMENT INTELLIGENT',
    analyzeDesign: 'ANALYSER MON DESIGN',
    explodedView: 'Vue Éclatée',
    layersTitle: 'Calques Architecturaux (13)',
    structureMode: 'Mode Structure',
    walkMode: 'Visite Intérieure',
    orbitMode: 'Orbite 3D',
    inspectorTitle: 'Inspecteur de Propriétés',
    noSelection: 'Sélectionnez un mur, une pièce, un meuble ou une ouverture pour éditer ses cotes.',
    unitMeters: 'Mètres (m)',
    unitCm: 'Centimètres (cm)',
    lotArea: 'Surface Terrain',
    builtArea: 'Surface Bâtie',
    roomsTotalArea: 'Surface Pièces',
    disclaimerStructural:
      'Avertissement : Les calculs structurels, estimations de coûts et diagnostics sont préliminaires et doivent être validés par un ingénieur agréé selon les normes locales.',
  },
  en: {
    appSubtitle: 'AI Architecture Studio — 3D CAD & Blueprint Generator',
    save: 'Save',
    saved: 'Saved',
    undo: 'Undo',
    redo: 'Redo',
    projects: 'Projects',
    exportBlueprint: 'Export / Print',
    view3D: '3D View',
    view2D: '2D Plan',
    viewSplit: 'Split View',
    tabInputs: 'Inputs & AI Plan',
    tabRoomsFurn: 'Rooms & Furniture',
    tabSpecs: 'Cost (DZD) & Qty',
    tabFacades: 'Facades Studio',
    tabSiteLayers: 'Layers & Site',
    tabAnalyze: 'Analyze Design',
    tabAI: 'AI Assistant',
    currencyLabel: 'Currency',
    reset: 'Reset',
    toolSelect: 'Select',
    toolMove: 'Move',
    toolWall: 'Wall',
    toolRoom: 'Room',
    toolDoor: 'Door',
    toolWindow: 'Window',
    toolFurniture: 'Furniture',
    toolMeasure: 'Measure',
    toolDelete: 'Delete',
    smartFurnish: 'SMART FURNISH',
    analyzeDesign: 'ANALYZE MY DESIGN',
    explodedView: 'Exploded View',
    layersTitle: 'Architectural Layers (13)',
    structureMode: 'Structure Mode',
    walkMode: 'Interior Walk',
    orbitMode: 'Free Orbit',
    inspectorTitle: 'Properties Inspector',
    noSelection: 'Click any wall, room, furniture item, or opening to edit dimensions and properties.',
    unitMeters: 'Meters (m)',
    unitCm: 'Centimeters (cm)',
    lotArea: 'Lot Area',
    builtArea: 'Built Area',
    roomsTotalArea: 'Total Rooms',
    disclaimerStructural:
      'Engineering Disclaimer: Structural layouts, cost estimates, and design audits are preliminary advisory outputs subject to certified structural engineer & local code review.',
  },
};

export function formatDim(meters: number, unit: MeasurementUnit | string): string {
  if (unit === 'cm') {
    return `${Math.round(meters * 100)} cm`;
  }
  return `${Number(meters.toFixed(2))} m`;
}

export function pickText(lang: AppLanguage | string, ar: string, fr: string, en: string): string {
  if (lang === 'fr') return fr;
  if (lang === 'en') return en;
  return ar;
}
