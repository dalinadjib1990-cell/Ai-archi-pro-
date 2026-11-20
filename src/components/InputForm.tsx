import React, { useState } from 'react';
import {
  Bed,
  Bath,
  Home,
  Utensils,
  Car,
  Trees,
  Maximize2,
  Sparkles,
  Check,
  ChevronDown,
  Building,
  Wand2,
  Palette,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  AppLanguage,
  ArchitecturalStyle,
  HouseInputParams,
  MeasurementUnit,
} from '../types';
import { PRESET_EXAMPLES } from '../data/presetTemplates';
import { validateHouseInputs } from '../utils/proceduralGenerator';
import { parseNaturalPromptToParams } from '../utils/aiAssistantEngine';
import { formatDim, pickText } from '../utils/i18n';

interface InputFormProps {
  params: HouseInputParams;
  setParams: React.Dispatch<React.SetStateAction<HouseInputParams>>;
  onGenerate: (overrideParams?: HouseInputParams) => void;
  isGenerating: boolean;
  unit?: MeasurementUnit;
  language?: AppLanguage;
}

export const InputForm: React.FC<InputFormProps> = ({
  params,
  setParams,
  onGenerate,
  isGenerating,
  unit = 'm',
  language = 'ar',
}) => {
  const [showPresets, setShowPresets] = useState(false);

  const totalArea = Math.round((params.length || 0) * (params.width || 0));
  const validation = validateHouseInputs(params);
  const estimatedColumnsX = Math.ceil((params.length || 10) / 4.5) + 1;
  const estimatedColumnsY = Math.ceil((params.width || 10) / 4.5) + 1;
  const estimatedColumns = estimatedColumnsX * estimatedColumnsY;

  const stylesList: { id: ArchitecturalStyle; nameAr: string; desc: string; icon: string }[] = [
    { id: 'modern', nameAr: 'عصري (مودرن)', desc: 'واجهات زجاجية وخطوط أفقية نقية', icon: '🏢' },
    { id: 'minimalist', nameAr: 'مينيمال بسيط', desc: 'كتل هندسية هادئة ونوافذ عريضة', icon: '◻️' },
    { id: 'algerian', nameAr: 'جزائري أصيل', desc: 'وسط الدار، قرميد قرمزي وأقواس', icon: '🇩🇿' },
    { id: 'mediterranean', nameAr: 'متوسطي', desc: 'أقواس شمسية وتراسات وقرميد', icon: '☀️' },
    { id: 'traditional', nameAr: 'تقليدي عربي', desc: 'فناء وسطي مشمس ومشربيات', icon: '🏛️' },
    { id: 'luxury', nameAr: 'فيلا فاخرة', desc: 'أجنحة كبرى وتشطيبات رخامية', icon: '💎' },
    { id: 'classic', nameAr: 'كلاسيكي', desc: 'أعمدة حجرية وجملونات متدرجة', icon: '🏰' },
    { id: 'industrial', nameAr: 'صناعي حديث', desc: 'حديد داكن وخرسانة وزجاج عريض', icon: '🏭' },
    { id: 'andalusian', nameAr: 'أندلسي', desc: 'أقواس وزليج ونافورة صحن', icon: '🕌' },
    { id: 'economic', nameAr: 'اقتصادي', desc: 'استغلال أمثل دون هدر', icon: '📐' },
  ];

  const materialsList = [
    'خرسانة مسلحة وطوب عازل',
    'طوب أحمر وقرميد قرمزي وجير تقليدي',
    'رخام إيطالي وحجر طبيعي وزجاج بانوراما',
    'بلك إسمنتي عازل وتشطيب اقتصادي',
    'حجر جيري أبيض مع مشربيات خشبية',
  ];

  const handlePresetSelect = (preset: typeof PRESET_EXAMPLES[0]) => {
    setParams(preset.params);
    setShowPresets(false);
  };

  const handleApplyNaturalPrompt = (triggerGenerate = false) => {
    const promptTxt = (params.naturalLanguagePrompt || '').trim();
    if (!promptTxt) {
      if (triggerGenerate) onGenerate();
      return;
    }
    const parsed = parseNaturalPromptToParams(promptTxt, params);
    setParams(parsed);
    if (triggerGenerate) {
      onGenerate(parsed);
    }
  };

  return (
    <aside className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl text-slate-100 space-y-5 w-full min-w-0">
      {/* Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Wand2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {pickText(language, 'مولد المخطط والذكاء المعماري', 'Générateur de Plan IA', 'AI Floor Plan & Specs')}
            </h2>
            <p className="text-[11px] text-slate-400">
              {pickText(language, 'اكتب وصف المنزل أو حدد الأبعاد والغرف لتوليد 3D + 2D', 'Décrivez ou configurez votre maison', 'Describe in plain text or set exact specs to generate 3D + 2D')}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pickText(language, 'نماذج جاهزة', 'Modèles', 'Presets')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPresets && (
            <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2.5rem)] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-2xl">
              <div className="text-[11px] font-bold text-slate-400 px-2 py-1">نماذج هندسية جاهزة:</div>
              {PRESET_EXAMPLES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(item)}
                  className="w-full text-right p-2.5 hover:bg-slate-800 rounded-xl transition-all text-xs border border-transparent hover:border-slate-700"
                >
                  <div className="font-bold text-slate-200">{item.name}</div>
                  <div className="text-[11px] text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Natural Language AI Floor Plan Prompt */}
      <div className="bg-gradient-to-b from-cyan-950/35 to-slate-950/60 border border-cyan-500/35 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{pickText(language, 'توليد المخطط من وصف نصي (AI Floor Plan)', 'Plan depuis texte IA', 'AI Natural-Language Plan Prompt')}</span>
          </span>
          <button
            type="button"
            onClick={() => handleApplyNaturalPrompt(false)}
            className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-slate-800 font-bold"
          >
            {pickText(language, 'استخراج الأبعاد للحقول', 'Extraire specs', 'Parse into Inputs')}
          </button>
        </div>

        <textarea
          rows={2}
          value={params.naturalLanguagePrompt || ''}
          onChange={(e) => setParams({ ...params, naturalLanguagePrompt: e.target.value })}
          placeholder={pickText(
            language,
            'مثال: أريد منزل 120 متر مربع، يحتوي على 3 غرف نوم، صالون كبير، مطبخ، حمامين، مدخل، وموقف سيارة، بتصميم عصري.',
            'Ex: Maison 120 m², 3 chambres, grand salon, cuisine, 2 salles de bain, garage, style moderne.',
            'e.g. 120 m² modern house with 3 bedrooms, large living room, kitchen, 2 bathrooms, and car garage.'
          )}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
        />
      </div>

      <div className="space-y-4">
        {/* Dimensions & Lot Shape */}
        <div className="space-y-2.5">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
            {pickText(language, 'أبعاد الأرض وشكل القطعة', 'Dimensions & Forme du Terrain', 'Lot Dimensions & Shape')}
          </label>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/60 border border-slate-800 focus-within:border-cyan-500/80 p-2 rounded-xl">
              <span className="text-[10px] block text-slate-500 font-medium mb-0.5">{pickText(language, 'الطول (م)', 'Long. (m)', 'Length (m)')}</span>
              <input
                type="number"
                min="5"
                max="60"
                step="0.5"
                value={params.length || ''}
                onChange={(e) => setParams({ ...params, length: Math.max(1, parseFloat(e.target.value) || 0) })}
                className="bg-transparent border-none p-0 focus:outline-none text-cyan-400 text-base font-bold w-full"
                dir="ltr"
              />
            </div>

            <div className="bg-slate-950/60 border border-slate-800 focus-within:border-cyan-500/80 p-2 rounded-xl">
              <span className="text-[10px] block text-slate-500 font-medium mb-0.5">{pickText(language, 'العرض (م)', 'Larg. (m)', 'Width (m)')}</span>
              <input
                type="number"
                min="5"
                max="50"
                step="0.5"
                value={params.width || ''}
                onChange={(e) => setParams({ ...params, width: Math.max(1, parseFloat(e.target.value) || 0) })}
                className="bg-transparent border-none p-0 focus:outline-none text-cyan-400 text-base font-bold w-full"
                dir="ltr"
              />
            </div>

            <div className="bg-slate-950/60 border border-slate-800 focus-within:border-cyan-500/80 p-2 rounded-xl">
              <span className="text-[10px] block text-slate-500 font-medium mb-0.5">{pickText(language, 'مساحة البناء م²', 'Bâti (m²)', 'Built m²')}</span>
              <input
                type="number"
                min="30"
                max="2000"
                step="5"
                value={params.targetBuiltArea || ''}
                placeholder={`${Math.round(totalArea * params.floorsCount * 0.85)}`}
                onChange={(e) => setParams({ ...params, targetBuiltArea: parseFloat(e.target.value) || undefined })}
                className="bg-transparent border-none p-0 focus:outline-none text-emerald-400 text-base font-bold w-full"
                dir="ltr"
              />
            </div>
          </div>

          {/* Lot Shape Selector */}
          <div className="grid grid-cols-4 gap-1.5 text-[10px]">
            {(
              [
                { id: 'rectangle', ar: 'مستطيلة', fr: 'Rect.', en: 'Rect' },
                { id: 'square', ar: 'مربعة', fr: 'Carré', en: 'Square' },
                { id: 'corner', ar: 'ركنية', fr: 'Angle', en: 'Corner' },
                { id: 'l-shape', ar: 'حرف L', fr: 'En L', en: 'L-Shape' },
              ] as const
            ).map((ls) => (
              <button
                key={ls.id}
                type="button"
                onClick={() => {
                  const nextOpen = ls.id === 'corner' ? (['front', 'left'] as const) : params.openFacadeDirections;
                  setParams({
                    ...params,
                    lotShape: ls.id,
                    openFacadeDirections: nextOpen ? [...nextOpen] : undefined,
                  });
                }}
                className={`py-1.5 rounded-lg border font-bold ${
                  (params.lotShape || 'rectangle') === ls.id
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                {pickText(language, ls.ar, ls.fr, ls.en)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2 flex items-center justify-between text-xs">
              <span className="text-[11px] text-cyan-300 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                {formatDim(params.length || 15, unit)} × {formatDim(params.width || 10, unit)}
              </span>
              <span className="font-extrabold text-white">{totalArea} m²</span>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-300">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>{pickText(language, 'أعمدة:', 'Poteaux:', 'Cols:')}</span>
              </div>
              <strong className="text-emerald-400 font-bold">{estimatedColumns}</strong>
            </div>
          </div>

          {!validation.isValid && (
            <div className="bg-rose-950/70 border border-rose-500/50 rounded-2xl p-3 space-y-1.5 text-rose-200 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-300">تنبيه هندسي: المساحة غير كافية</h4>
                  <p className="text-[11px] text-rose-200/90 mt-0.5">{validation.warning}</p>
                </div>
              </div>
              {validation.suggestion && (
                <div className="bg-rose-900/40 border border-rose-500/30 p-2 rounded-xl text-[11px] text-amber-200 flex items-start gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                  <span><strong>الحل:</strong> {validation.suggestion}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floors & Roof */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">{pickText(language, 'عدد الطوابق', 'Étages', 'Floors')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setParams({ ...params, floorsCount: cnt })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    params.floorsCount === cnt
                      ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cnt}F
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">{pickText(language, 'نوع السقف', 'Toiture', 'Roof Type')}</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setParams({ ...params, roofType: 'flat' })}
                className={`py-2 px-2 text-xs font-bold rounded-xl border ${
                  params.roofType === 'flat'
                    ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                {pickText(language, 'مسطح', 'Plat', 'Flat')}
              </button>
              <button
                type="button"
                onClick={() => setParams({ ...params, roofType: 'sloped' })}
                className={`py-2 px-2 text-xs font-bold rounded-xl border ${
                  params.roofType === 'sloped'
                    ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                {pickText(language, 'مائل قرميد', 'Tuiles', 'Sloped')}
              </button>
            </div>
          </div>
        </div>

        {/* Open Facades */}
        <div className="space-y-2 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3">
          <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
            <span>{pickText(language, 'الواجهات المفتوحة', 'Façades Ouvertes', 'Open Facades')}</span>
            <span className="text-[10px] text-cyan-400 font-normal">{params.facadesCount} / 4</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'front', label: 'أمامية' },
                { id: 'back', label: 'خلفية' },
                { id: 'left', label: 'يسرى' },
                { id: 'right', label: 'يمنى' },
              ] as const
            ).map((dir) => {
              const activeDirs = params.openFacadeDirections || ['front', 'left'];
              const isOpen = activeDirs.includes(dir.id);
              return (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => {
                    if (dir.id === 'front') return;
                    const nextDirs = isOpen ? activeDirs.filter((d) => d !== dir.id) : [...activeDirs, dir.id];
                    setParams({ ...params, openFacadeDirections: nextDirs, facadesCount: nextDirs.length });
                  }}
                  className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 ${
                    isOpen ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' : 'bg-slate-900/80 border-slate-800 text-slate-500 line-through'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>{dir.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Room Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: pickText(language, 'نوم', 'Ch.', 'Beds'), val: params.bedroomsCount, min: 1, max: 10, key: 'bedroomsCount' as const, icon: <Bed className="w-3.5 h-3.5 text-indigo-400" /> },
            { label: pickText(language, 'حمام', 'SDB', 'Baths'), val: params.bathroomsCount, min: 1, max: 8, key: 'bathroomsCount' as const, icon: <Bath className="w-3.5 h-3.5 text-cyan-400" /> },
            { label: pickText(language, 'صالات', 'Salons', 'Living'), val: params.livingRoomsCount, min: 1, max: 5, key: 'livingRoomsCount' as const, icon: <Home className="w-3.5 h-3.5 text-purple-400" /> },
            { label: pickText(language, 'مطبخ', 'Cuis.', 'Kitch'), val: params.kitchensCount, min: 1, max: 3, key: 'kitchensCount' as const, icon: <Utensils className="w-3.5 h-3.5 text-amber-400" /> },
          ].map((c) => (
            <div key={c.key} className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1">{c.icon}<span className="text-[11px] text-slate-300">{c.label}</span></div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setParams({ ...params, [c.key]: Math.max(c.min, c.val - 1) })} className="w-5 h-5 rounded bg-slate-800 text-xs font-bold">-</button>
                <span className="text-xs font-bold text-cyan-400 w-4 text-center">{c.val}</span>
                <button type="button" onClick={() => setParams({ ...params, [c.key]: Math.min(c.max, c.val + 1) })} className="w-5 h-5 rounded bg-slate-800 text-xs font-bold">+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { key: 'hasMajlis' as const, label: pickText(language, 'مجلس ضيوف', 'Réception', 'Majlis') },
            { key: 'hasGarage' as const, label: pickText(language, 'مرآب سيارات', 'Garage', 'Garage'), icon: <Car className="w-3.5 h-3.5 text-cyan-400" /> },
            { key: 'hasGarden' as const, label: pickText(language, 'حديقة / حوش', 'Jardin', 'Garden'), icon: <Trees className="w-3.5 h-3.5 text-emerald-400" /> },
            { key: 'hasBalcony' as const, label: pickText(language, 'شرفة / تراس', 'Balcon', 'Balcony') },
            { key: 'hasStairs' as const, label: pickText(language, 'درج داخلي', 'Escalier', 'Stairs') },
            { key: 'hasCourtyard' as const, label: pickText(language, 'فناء داخلي', 'Patio', 'Courtyard') },
          ].map((feat) => {
            const active = Boolean(params[feat.key]);
            return (
              <button
                key={feat.key}
                type="button"
                onClick={() => setParams({ ...params, [feat.key]: !active })}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                  active ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200' : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center gap-1 truncate">{feat.icon}{feat.label}</span>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700'}`}>
                  {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Architectural Styles Grid */}
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1.5">{pickText(language, 'النمط والطراز المعماري', 'Style Architectural', 'Architectural Style')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {stylesList.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setParams({ ...params, style: st.id })}
                className={`p-2 rounded-xl border text-right transition-all ${
                  params.style === st.id
                    ? 'bg-cyan-950/60 border-cyan-400 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm">{st.icon}</div>
                <div className="font-bold text-[11px] truncate">{st.nameAr}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Materials & Colors */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pickText(language, 'الألوان والمواد', 'Matériaux & Couleurs', 'Materials & Colors')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
            {materialsList.slice(0, 4).map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => setParams({ ...params, wallMaterial: mat })}
                className={`p-1.5 rounded-lg border text-right truncate ${
                  (params.wallMaterial || materialsList[0]) === mat
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { color: '#f8fafc', label: 'أبيض' },
              { color: '#fef3c7', label: 'بيج' },
              { color: '#d4a373', label: 'حجر' },
              { color: '#475569', label: 'رمادي' },
            ].map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => setParams({ ...params, facadeWallColor: c.color })}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                  (params.facadeWallColor || '#f8fafc') === c.color ? 'border-cyan-400 text-cyan-300 bg-slate-800' : 'border-slate-800 text-slate-400 bg-slate-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: c.color }} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Notes */}
        <textarea
          rows={2}
          value={params.customNotes}
          onChange={(e) => setParams({ ...params, customNotes: e.target.value })}
          placeholder={pickText(language, 'ملاحظات معمارية إضافية...', 'Notes architecturales...', 'Additional architectural notes...')}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
        />

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => handleApplyNaturalPrompt(true)}
          disabled={isGenerating || !params.length || !params.width}
          className="w-full py-3.5 bg-gradient-to-l from-cyan-600 to-blue-700 text-white font-bold rounded-xl shadow-lg border border-cyan-400/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{pickText(language, 'جاري توليد التصميم 3D...', 'Génération en cours...', 'Generating 3D & Blueprint...')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{pickText(language, 'توليد منزل جديد الآن (Generate House)', 'Générer Maison 3D', 'Generate House Now')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
