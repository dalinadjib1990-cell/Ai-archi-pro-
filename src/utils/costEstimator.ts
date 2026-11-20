import { CostStageConfig, Currency, GeneratedHousePlan } from '../types';

/**
 * Default Algerian Market Reference Unit Rates in DZD (editable by user).
 * Preliminary rates covering materials & labor per unit.
 */
export const DEFAULT_COST_RATES_DZD: Record<string, { material: number; labor: number }> = {
  excavation: { material: 450, labor: 750 }, // per m3
  foundations: { material: 21500, labor: 6800 }, // per m3
  structure: { material: 24000, labor: 8200 }, // per m3 reinforced concrete (columns/beams/slabs)
  walls: { material: 2200, labor: 1450 }, // per m2 masonry + mortar
  roof: { material: 6200, labor: 2400 }, // per m2 roof slab/tiles
  electrical: { material: 1400, labor: 1100 }, // per m2 built area
  plumbing: { material: 1350, labor: 1050 }, // per m2 built area
  insulation: { material: 1850, labor: 850 }, // per m2 thermal & waterproofing
  openings: { material: 32000, labor: 6500 }, // per opening unit (doors & windows avg)
  tiling: { material: 2600, labor: 1350 }, // per m2 flooring/wall tile
  painting: { material: 750, labor: 650 }, // per m2 interior + exterior coat
  finishes: { material: 2800, labor: 1600 }, // per m2 plaster/gypsum/facade cladding
};

export const CURRENCY_MULTIPLIER_FROM_DZD: Record<
  Currency,
  { factor: number; symbol: string; labelAr: string; labelFr: string; labelEn: string }
> = {
  DZD: { factor: 1, symbol: 'د.ج', labelAr: 'دينار جزائري (DZD)', labelFr: 'Dinar Algérien (DZD)', labelEn: 'Algerian Dinar (DZD)' },
  SAR: { factor: 0.028, symbol: 'ر.س', labelAr: 'ريال سعودي (SAR)', labelFr: 'Riyal Saoudien (SAR)', labelEn: 'Saudi Riyal (SAR)' },
  USD: { factor: 0.0074, symbol: '$', labelAr: 'دولار أمريكي (USD)', labelFr: 'Dollar US (USD)', labelEn: 'US Dollar (USD)' },
  AED: { factor: 0.027, symbol: 'د.إ', labelAr: 'درهم إماراتي (AED)', labelFr: 'Dirham EAU (AED)', labelEn: 'UAE Dirham (AED)' },
  EGP: { factor: 0.36, symbol: 'ج.م', labelAr: 'جنيه مصري (EGP)', labelFr: 'Livre Égyptienne (EGP)', labelEn: 'Egyptian Pound (EGP)' },
};

export function compute12StageCostBreakdown(
  plan: GeneratedHousePlan,
  customRatesDZD?: Record<string, { material: number; labor: number }>
): {
  stages: CostStageConfig[];
  totalMaterialDZD: number;
  totalLaborDZD: number;
  totalMidDZD: number;
  totalLowDZD: number;
  totalHighDZD: number;
  quantities: {
    builtAreaM2: number;
    footprintM2: number;
    wallAreaM2: number;
    paintAreaM2: number;
    concreteM3: number;
    foundationConcreteM3: number;
    structureConcreteM3: number;
    steelTons: number;
    bricksCount: number;
    openingsCount: number;
    excavationM3: number;
  };
} {
  const rates = { ...DEFAULT_COST_RATES_DZD, ...(customRatesDZD || {}) };
  const builtAreaM2 = Math.max(25, Number(plan.specs.totalBuiltArea) || 120);
  const footprintM2 = Math.max(20, Number(plan.specs.buildingFootprintArea) || builtAreaM2 / Math.max(1, plan.params.floorsCount || 1));

  // Derive geometric quantities directly from plan walls & openings
  const totalWallLength = plan.walls.reduce((acc, w) => {
    return acc + Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
  }, 0);
  const avgWallH = 3.15;
  const grossWallArea = totalWallLength > 10 ? totalWallLength * avgWallH : builtAreaM2 * 2.15;
  const openingsArea = plan.openings.reduce((acc, op) => acc + op.width * (op.type === 'door' ? 2.2 : 1.5), 0);
  const wallAreaM2 = Math.round(Math.max(40, grossWallArea - openingsArea));

  const excavationM3 = Math.round(footprintM2 * 1.15);
  const foundationConcreteM3 = Math.round(footprintM2 * 0.24 + (plan.columns.length || 12) * 0.65);
  const structureConcreteM3 = Math.round(builtAreaM2 * 0.34);
  const concreteM3 = foundationConcreteM3 + structureConcreteM3;
  const steelTons = Number((concreteM3 * 0.115).toFixed(2));
  const bricksCount = Math.round(wallAreaM2 * 14);
  const openingsCount = Math.max(4, plan.openings.length);
  const paintAreaM2 = Math.round(wallAreaM2 * 1.75 + builtAreaM2 * 0.8);

  // Style multiplier subtly tunes finishes/tiling/facade complexity
  const styleFactor =
    plan.params.style === 'luxury'
      ? 1.35
      : plan.params.style === 'classic' || plan.params.style === 'algerian'
      ? 1.12
      : plan.params.style === 'economic'
      ? 0.85
      : 1.0;

  const rawStages: Array<{
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    unitAr: string;
    unitFr: string;
    unitEn: string;
    quantity: number;
    finishScaled?: boolean;
  }> = [
    {
      id: 'excavation',
      nameAr: '1. الحفر والتهيئة الأرضية',
      nameFr: '1. Terrassement & Excavation',
      nameEn: '1. Excavation & Site Prep',
      unitAr: 'م³',
      unitFr: 'm³',
      unitEn: 'm³',
      quantity: excavationM3,
    },
    {
      id: 'foundations',
      nameAr: '2. الأساسات والقواعد المسلحة',
      nameFr: '2. Fondations & Semelles',
      nameEn: '2. Foundations & Footings',
      unitAr: 'م³',
      unitFr: 'm³',
      unitEn: 'm³',
      quantity: foundationConcreteM3,
    },
    {
      id: 'structure',
      nameAr: '3. الهيكل الخرساني (أعمدة وجسور وبلاطات)',
      nameFr: '3. Gros Œuvre & Structure Béton',
      nameEn: '3. RC Structure (Columns, Beams, Slabs)',
      unitAr: 'م³',
      unitFr: 'm³',
      unitEn: 'm³',
      quantity: structureConcreteM3,
    },
    {
      id: 'walls',
      nameAr: '4. الجدران والبناء (آجر وطوب)',
      nameFr: '4. Maçonnerie & Murs',
      nameEn: '4. Masonry & Partition Walls',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: wallAreaM2,
    },
    {
      id: 'roof',
      nameAr: '5. السقف والعزل العلوي والقرميد',
      nameFr: '5. Toiture & Étanchéité Haute',
      nameEn: '5. Roof Deck & Roofing',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: Math.round(footprintM2 * (plan.params.roofType === 'sloped' ? 1.18 : 1.0)),
    },
    {
      id: 'electrical',
      nameAr: '6. الشبكة الكهربائية والإنارة',
      nameFr: '6. Électricité & Éclairage',
      nameEn: '6. Electrical & Lighting',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: Math.round(builtAreaM2),
      finishScaled: true,
    },
    {
      id: 'plumbing',
      nameAr: '7. السباكة والصرف الصحي',
      nameFr: '7. Plomberie & Assainissement',
      nameEn: '7. Plumbing & Sanitary',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: Math.round(builtAreaM2),
    },
    {
      id: 'insulation',
      nameAr: '8. العزل الحراري والمائي',
      nameFr: '8. Isolation Thermique & Hydrique',
      nameEn: '8. Thermal & Waterproof Insulation',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: Math.round(footprintM2 + wallAreaM2 * 0.35),
    },
    {
      id: 'openings',
      nameAr: '9. الأبواب والنوافذ والألمنيوم',
      nameFr: '9. Menuiserie Portes & Fenêtres',
      nameEn: '9. Doors & Windows',
      unitAr: 'فتحة',
      unitFr: 'unité',
      unitEn: 'unit',
      quantity: openingsCount,
      finishScaled: true,
    },
    {
      id: 'tiling',
      nameAr: '10. البلاط والسيراميك والرخام',
      nameFr: '10. Carrelage & Revêtement Sol',
      nameEn: '10. Tiling & Flooring',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: Math.round(builtAreaM2 * 1.1),
      finishScaled: true,
    },
    {
      id: 'painting',
      nameAr: '11. الدهان والطلاء الداخلي والخارجي',
      nameFr: '11. Peinture Intérieure & Façade',
      nameEn: '11. Interior & Exterior Painting',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: paintAreaM2,
    },
    {
      id: 'finishes',
      nameAr: '12. التشطيبات النهائية وتكسية الواجهة',
      nameFr: '12. Finitions, Plâtre & Façade',
      nameEn: '12. Final Finishes & Facade Cladding',
      unitAr: 'م²',
      unitFr: 'm²',
      unitEn: 'm²',
      quantity: Math.round(builtAreaM2),
      finishScaled: true,
    },
  ];

  let totalMaterialDZD = 0;
  let totalLaborDZD = 0;

  const stages: CostStageConfig[] = rawStages.map((s) => {
    const r = rates[s.id] || { material: 2000, labor: 1000 };
    const matRate = Math.round(r.material * (s.finishScaled ? styleFactor : 1));
    const labRate = Math.round(r.labor);
    totalMaterialDZD += s.quantity * matRate;
    totalLaborDZD += s.quantity * labRate;
    return {
      id: s.id,
      nameAr: s.nameAr,
      nameFr: s.nameFr,
      nameEn: s.nameEn,
      unitAr: s.unitAr,
      unitFr: s.unitFr,
      unitEn: s.unitEn,
      quantity: s.quantity,
      materialUnitRateDZD: matRate,
      laborUnitRateDZD: labRate,
    };
  });

  const totalMidDZD = Math.round(totalMaterialDZD + totalLaborDZD);
  return {
    stages,
    totalMaterialDZD: Math.round(totalMaterialDZD),
    totalLaborDZD: Math.round(totalLaborDZD),
    totalMidDZD,
    totalLowDZD: Math.round(totalMidDZD * 0.86),
    totalHighDZD: Math.round(totalMidDZD * 1.22),
    quantities: {
      builtAreaM2: Math.round(builtAreaM2),
      footprintM2: Math.round(footprintM2),
      wallAreaM2,
      paintAreaM2,
      concreteM3,
      foundationConcreteM3,
      structureConcreteM3,
      steelTons,
      bricksCount,
      openingsCount,
      excavationM3,
    },
  };
}
