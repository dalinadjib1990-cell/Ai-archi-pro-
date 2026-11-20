import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Compass,
  Box,
  Trees,
  AlertCircle,
} from 'lucide-react';
import {
  AppLanguage,
  DEFAULT_LAYERS,
  GeneratedHousePlan,
  LayerKey,
  LayerVisibilityMap,
  MeasurementUnit,
  SiteSettings,
} from '../types';
import { formatDim, pickText } from '../utils/i18n';
import { generateProceduralPlan } from '../utils/proceduralGenerator';

interface LayersAndSitePanelProps {
  plan: GeneratedHousePlan;
  layers: LayerVisibilityMap;
  onChangeLayers: (next: LayerVisibilityMap) => void;
  explodedAmount: number;
  onChangeExploded: (val: number) => void;
  viewMode: 'realistic' | 'structural' | 'night';
  onChangeViewMode: (m: 'realistic' | 'structural' | 'night') => void;
  siteSettings: SiteSettings;
  onUpdateSiteAndPlan: (nextSite: SiteSettings, updatedPlan: GeneratedHousePlan) => void;
  unit: MeasurementUnit;
  language: AppLanguage;
}

const LAYER_LABELS: Array<{ key: LayerKey; ar: string; fr: string; en: string }> = [
  { key: 'land', ar: 'الأرض والحدود', fr: 'Terrain', en: 'Land / Lot' },
  { key: 'foundations', ar: 'الأساسات والقواعد', fr: 'Fondations', en: 'Foundations' },
  { key: 'walls', ar: 'الجدران', fr: 'Murs', en: 'Walls' },
  { key: 'columns', ar: 'الأعمدة الخرسانية', fr: 'Poteaux', en: 'Columns' },
  { key: 'beams', ar: 'الجسور والكمرات', fr: 'Poutres', en: 'Beams' },
  { key: 'slabs', ar: 'البلاطات والأسقف', fr: 'Dalles', en: 'Slabs' },
  { key: 'roof', ar: 'السقف والقرميد', fr: 'Toiture', en: 'Roof' },
  { key: 'doors', ar: 'الأبواب', fr: 'Portes', en: 'Doors' },
  { key: 'windows', ar: 'النوافذ', fr: 'Fenêtres', en: 'Windows' },
  { key: 'furniture', ar: 'الأثاث الداخلي', fr: 'Mobilier', en: 'Furniture' },
  { key: 'lighting', ar: 'الإضاءة', fr: 'Éclairage', en: 'Lighting' },
  { key: 'plants', ar: 'النباتات والأشجار', fr: 'Plantes', en: 'Plants' },
  { key: 'site', ar: 'الموقع والسور والمسبح', fr: 'Site / Clôture', en: 'Site / Fence' },
];

export const LayersAndSitePanel: React.FC<LayersAndSitePanelProps> = ({
  plan,
  layers,
  onChangeLayers,
  explodedAmount,
  onChangeExploded,
  viewMode,
  onChangeViewMode,
  siteSettings,
  onUpdateSiteAndPlan,
  unit,
  language,
}) => {
  const L = plan.params.length || 15;
  const W = plan.params.width || 10;

  // Estimate current building bounding box inside lot
  const groundRooms = plan.rooms.filter((r) => r.floor === 0 && r.category !== 'outdoor');
  const minX = groundRooms.length ? Math.min(...groundRooms.map((r) => r.x)) : 0.25;
  const minY = groundRooms.length ? Math.min(...groundRooms.map((r) => r.y)) : 0.25;
  const maxX = groundRooms.length ? Math.max(...groundRooms.map((r) => r.x + r.width)) : L - 0.25;
  const maxY = groundRooms.length ? Math.max(...groundRooms.map((r) => r.y + r.length)) : W - 0.25;

  const footprintW = Number((maxX - minX).toFixed(1));
  const footprintL = Number((maxY - minY).toFixed(1));
  const maxShiftX = Math.max(0, Number((L - footprintW).toFixed(1)));
  const maxShiftY = Math.max(0, Number((W - footprintL).toFixed(1)));

  const leftSetback = Number(Math.max(0, minX).toFixed(1));
  const rightSetback = Number(Math.max(0, L - maxX).toFixed(1));
  const backSetback = Number(Math.max(0, minY).toFixed(1));
  const frontSetback = Number(Math.max(0, W - maxY).toFixed(1));

  const applySiteUpdate = (patch: Partial<SiteSettings>, rebuildGeometry = false) => {
    const nextSite: SiteSettings = { ...siteSettings, ...patch };
    const nextParams = {
      ...plan.params,
      showFence: nextSite.hasFence,
      hasGarden: nextSite.hasPatio || plan.params.hasGarden,
      showGardenDecor: nextSite.hasPool || nextSite.hasPatio,
      hasGarage: nextSite.hasParking || plan.params.hasGarage,
      siteSettings: nextSite,
    };
    const updatedPlan = rebuildGeometry
      ? generateProceduralPlan(nextParams, 0)
      : { ...plan, params: nextParams };
    onUpdateSiteAndPlan(nextSite, updatedPlan);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6 text-slate-100">
      {/* Section 1: Structure Mode & Exploded View */}
      <div className="space-y-3 pb-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {pickText(language, 'وضع الهيكل الإنشائي والتفكيك 3D', 'Structure & Vue Éclatée', 'Structure Mode & Exploded View')}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onChangeViewMode(viewMode === 'structural' ? 'realistic' : 'structural')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              viewMode === 'structural'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {viewMode === 'structural'
              ? pickText(language, 'العودة للعرض المعماري', 'Mode Réaliste', 'Switch to Realistic')
              : pickText(language, 'تفعيل وضع الهيكل الإنشائي', 'Activer Structure', 'Enable Structure Mode')}
          </button>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">
              {pickText(language, 'العرض التفكيكي للطوابق والسقف (Exploded View)', 'Vue éclatée 3D', 'Exploded Floor Separation')}
            </span>
            <span className="font-mono font-bold text-cyan-400">{Math.round(explodedAmount * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={explodedAmount}
            onChange={(e) => onChangeExploded(parseFloat(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-200/90">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            {pickText(
              language,
              'تنبيه: العناصر الإنشائية (القواعد، الأعمدة، الجسور، البلاطات) استرشادية أولية وتخضع لمراجعة مهندس مدني.',
              'Avertissement : Les éléments structurels affichés sont préliminaires.',
              'Preliminary Engineering Disclaimer: Footings, columns, beams, and slabs shown are conceptual.'
            )}
          </span>
        </div>
      </div>

      {/* Section 2: 13 Architectural Layers Panel */}
      <div className="space-y-3 pb-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white">
              {pickText(language, 'التحكم في 13 طبقة معمارية وإنشائية', '13 Calques Architecturaux', '13 Architectural & Structural Layers')}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => onChangeLayers({ ...DEFAULT_LAYERS })}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 hover:bg-slate-800"
            >
              {pickText(language, 'إظهار الكل', 'Tout afficher', 'Show All')}
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeLayers({
                  land: true,
                  foundations: true,
                  walls: false,
                  columns: true,
                  beams: true,
                  slabs: true,
                  roof: false,
                  doors: false,
                  windows: false,
                  furniture: false,
                  lighting: false,
                  plants: false,
                  site: false,
                })
              }
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 hover:bg-slate-800"
            >
              {pickText(language, 'الهيكل فقط', 'Structure seule', 'Structure Only')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {LAYER_LABELS.map((item) => {
            const visible = layers[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChangeLayers({ ...layers, [item.key]: !visible })}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-between gap-1.5 transition-all ${
                  visible
                    ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <span className="truncate">{pickText(language, item.ar, item.fr, item.en)}</span>
                {visible ? <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Smart Site Planner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trees className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white">
            {pickText(language, 'مخطط الموقع الذكي والارتدادات (Smart Site Planner)', 'Plan de Masse & Retraits', 'Smart Site Planner & Setbacks')}
          </h4>
        </div>

        {/* Live Setback Readouts */}
        <div className="grid grid-cols-4 gap-2 text-[11px] text-center">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
            <span className="text-slate-500 block">{pickText(language, 'أمامي', 'Avant', 'Front')}</span>
            <strong className="text-emerald-400 font-mono">{formatDim(frontSetback, unit)}</strong>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
            <span className="text-slate-500 block">{pickText(language, 'خلفي', 'Arrière', 'Back')}</span>
            <strong className="text-cyan-400 font-mono">{formatDim(backSetback, unit)}</strong>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
            <span className="text-slate-500 block">{pickText(language, 'يسار', 'Gauche', 'Left')}</span>
            <strong className="text-cyan-400 font-mono">{formatDim(leftSetback, unit)}</strong>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
            <span className="text-slate-500 block">{pickText(language, 'يمين', 'Droite', 'Right')}</span>
            <strong className="text-cyan-400 font-mono">{formatDim(rightSetback, unit)}</strong>
          </div>
        </div>

        {/* Building Position Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300 flex items-center gap-1"><Compass className="w-3 h-3 text-cyan-400" /> {pickText(language, 'إزاحة المبنى أفقياً X', 'Décalage X', 'Building Offset X')}</span>
              <span className="font-mono text-cyan-400">{formatDim(siteSettings.buildingOffsetX, unit)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0.5, maxShiftX)}
              step="0.25"
              value={siteSettings.buildingOffsetX}
              onChange={(e) => applySiteUpdate({ buildingOffsetX: parseFloat(e.target.value) }, true)}
              className="w-full accent-cyan-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300 flex items-center gap-1"><Compass className="w-3 h-3 text-cyan-400" /> {pickText(language, 'إزاحة المبنى عمودياً Y', 'Décalage Y', 'Building Offset Y')}</span>
              <span className="font-mono text-cyan-400">{formatDim(siteSettings.buildingOffsetY, unit)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0.5, maxShiftY)}
              step="0.25"
              value={siteSettings.buildingOffsetY}
              onChange={(e) => applySiteUpdate({ buildingOffsetY: parseFloat(e.target.value) }, true)}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* Site Elements Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { key: 'hasFence' as const, ar: 'سور خارجي', fr: 'Clôture', en: 'Perimeter Fence' },
            { key: 'hasGate' as const, ar: 'بوابة رئيسية', fr: 'Portail', en: 'Main Gate' },
            { key: 'hasDriveway' as const, ar: 'ممر سيارات', fr: 'Allée voiture', en: 'Driveway' },
            { key: 'hasParking' as const, ar: 'موقف سيارات', fr: 'Parking', en: 'Parking' },
            { key: 'hasPool' as const, ar: 'مسبح', fr: 'Piscine', en: 'Swimming Pool' },
            { key: 'hasPatio' as const, ar: 'جلسة وحديقة', fr: 'Patio / Jardin', en: 'Garden Patio' },
            { key: 'hasGardenLights' as const, ar: 'إنارة حديقة', fr: 'Éclairage ext.', en: 'Garden Lights' },
          ].map((item) => {
            const active = siteSettings[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => applySiteUpdate({ [item.key]: !active }, false)}
                className={`p-2 rounded-xl border text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {pickText(language, item.ar, item.fr, item.en)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
