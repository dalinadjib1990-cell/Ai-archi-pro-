import React, { useState } from 'react';
import {
  Ruler,
  Layers,
  Bed,
  Bath,
  Home,
  Utensils,
  Car,
  Trees,
  Maximize2,
  Sparkles,
  Compass,
  Check,
  ChevronDown,
  Building,
  Wand2,
  HelpCircle,
  Paintbrush,
  Palette,
  Eye,
  Sofa,
  Fence,
  Lamp
} from 'lucide-react';
import { HouseInputParams, ArchitecturalStyle } from '../types';
import { PRESET_EXAMPLES } from '../data/presetTemplates';

interface InputFormProps {
  params: HouseInputParams;
  setParams: React.Dispatch<React.SetStateAction<HouseInputParams>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  params,
  setParams,
  onGenerate,
  isGenerating,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  // Auto-calculated area
  const totalArea = Math.round((params.length || 0) * (params.width || 0));

  // Estimated columns formula: based on grid spans ~4m - 4.5m
  const estimatedColumnsX = Math.ceil((params.length || 10) / 4.5) + 1;
  const estimatedColumnsY = Math.ceil((params.width || 10) / 4.5) + 1;
  const estimatedColumns = estimatedColumnsX * estimatedColumnsY;

  const stylesList: { id: ArchitecturalStyle; nameAr: string; desc: string; icon: string }[] = [
    { id: 'modern', nameAr: 'عصري (مودرن)', desc: 'واجهات زجاجية وخطوط مستقيمة وإضاءة هادئة', icon: '🏢' },
    { id: 'classic', nameAr: 'كلاسيكي فخم', desc: 'أعمدة دائرية وتفاصيل حجرية وفخامة متدرجة', icon: '🏛️' },
    { id: 'andalusian', nameAr: 'أندلسي إسلامي', desc: 'أقواس إسلامية وفناء داخلي مع زخارف مميزة', icon: '🕌' },
    { id: 'mediterranean', nameAr: 'متوسطي (فيلا)', desc: 'أسقف قرميد زاهية ونوافذ واسعة مشمسة', icon: '🏡' },
    { id: 'minimalist', nameAr: 'بسيط (مينيماليست)', desc: 'استغلال أقصى للمساحات وتصاميم ناصعة', icon: '🏠' },
  ];

  const handlePresetSelect = (preset: typeof PRESET_EXAMPLES[0]) => {
    setParams(preset.params);
    setShowPresets(false);
  };

  return (
    <aside className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl text-slate-100 space-y-6">
      {/* Title & Presets Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Wand2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">أبعاد ومتطلبات البناء</h2>
            <p className="text-[11px] text-slate-400">حدد مقاسات الأرض والغرف لتوليد الخريطة أوتوماتيكياً</p>
          </div>
        </div>

        {/* Quick Presets Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>نماذج جاهزة</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPresets && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-2xl">
              <div className="text-[11px] font-bold text-slate-400 px-2 py-1">اختر نموذجاً صُمم هندسياً:</div>
              {PRESET_EXAMPLES.map((item, idx) => (
                <button
                  key={idx}
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

      <div className="space-y-5">
        {/* Section 1: Dimensions & Automated Area Calculations */}
        <div className="space-y-2.5">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
            أبعاد قطعة الأرض (بالمتر)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Length */}
            <div className="bg-slate-950/60 border border-slate-800 focus-within:border-cyan-500/80 p-2.5 rounded-xl transition-all">
              <span className="text-[10px] block text-slate-500 font-medium mb-0.5">الطول (م)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="5"
                  max="60"
                  step="0.5"
                  value={params.length || ''}
                  onChange={(e) => setParams({ ...params, length: Math.max(1, parseFloat(e.target.value) || 0) })}
                  className="bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-cyan-400 text-base font-bold w-full"
                  dir="ltr"
                />
                <span className="text-xs text-slate-500 font-medium">متر</span>
              </div>
            </div>

            {/* Width */}
            <div className="bg-slate-950/60 border border-slate-800 focus-within:border-cyan-500/80 p-2.5 rounded-xl transition-all">
              <span className="text-[10px] block text-slate-500 font-medium mb-0.5">العرض (م)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="0.5"
                  value={params.width || ''}
                  onChange={(e) => setParams({ ...params, width: Math.max(1, parseFloat(e.target.value) || 0) })}
                  className="bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-cyan-400 text-base font-bold w-full"
                  dir="ltr"
                />
                <span className="text-xs text-slate-500 font-medium">متر</span>
              </div>
            </div>

            {/* Calculated Total Area Badge */}
            <div className="col-span-2 sm:col-span-1 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2.5 flex flex-col justify-center">
              <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-cyan-400" />
                المساحة الإجمالية
              </span>
              <div className="text-lg font-bold text-white mt-0.5">
                {totalArea} <span className="text-xs text-cyan-300 font-normal">m²</span>
              </div>
            </div>
          </div>

          {/* Automatic Column Calculation Banner */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Building className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                عدد الأعمدة الخرسانية المتوقعة: <strong className="text-emerald-400 text-sm mx-1">{estimatedColumns} عموداً</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">(شبكة 4 - 4.5m)</span>
          </div>
        </div>

        {/* Section 2: Floors & Facades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Floors count */}
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1.5">
              عدد الطوابق
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { count: 1, label: 'طابق 1' },
                { count: 2, label: 'طابقين' },
                { count: 3, label: '3 طوابق' },
              ].map((f) => (
                <button
                  key={f.count}
                  type="button"
                  onClick={() => setParams({ ...params, floorsCount: f.count })}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                    params.floorsCount === f.count
                      ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Facades count & Directional Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block flex items-center justify-between">
              <span>عدد الاتجاهات والواجهات المفتوحة</span>
              <span className="text-[10px] text-cyan-400 font-normal">إلغاء النوافذ بالجهات الجارية</span>
            </label>

            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    let dirs: ('front' | 'back' | 'right' | 'left')[] = ['front'];
                    if (f === 2) dirs = ['front', 'left'];
                    if (f === 3) dirs = ['front', 'left', 'back'];
                    if (f === 4) dirs = ['front', 'back', 'right', 'left'];
                    setParams({ ...params, facadesCount: f, openFacadeDirections: dirs });
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    params.facadesCount === f
                      ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {f === 1 ? 'واجهة' : f === 2 ? 'واجهتان' : f === 3 ? '3 واجهات' : '4 واجهات'}
                </button>
              ))}
            </div>

            {/* Custom Directions Checkboxes */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-2.5 space-y-1.5">
              <span className="text-[11px] text-slate-300 font-semibold block">اختر أي الجهات مفتوحة بها نوافذ وإضاءة:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'front', label: '⬆️ الأمامية (الشارع الرئيسي)' },
                  { id: 'back', label: '⬇️ الخلفية (الفناء/الحديقة)' },
                  { id: 'right', label: '➡️ الجانب الأيمن' },
                  { id: 'left', label: '⬅️ الجانب الأيسر' },
                ].map((dir) => {
                  const currentDirs = params.openFacadeDirections || ['front', 'left'];
                  const isChecked = currentDirs.includes(dir.id as any);
                  return (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => {
                        let newDirs = [...currentDirs];
                        if (isChecked) {
                          if (newDirs.length > 1) {
                            newDirs = newDirs.filter((d) => d !== dir.id);
                          }
                        } else {
                          newDirs.push(dir.id as any);
                        }
                        setParams({
                          ...params,
                          openFacadeDirections: newDirs,
                          facadesCount: newDirs.length,
                        });
                      }}
                      className={`p-2 rounded-lg border text-[11px] font-bold text-right flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>{dir.label}</span>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                        isChecked ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black' : 'border-slate-700'
                      }`}>
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                💡 الجهات غير المحددة تصبح <strong className="text-amber-400">جدران مصمتة بدون نوافذ</strong> (ملاصقة للمباني المجارورة).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Rooms and Spaces Counters */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block">توزيع الغرف والفضاءات</label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Bedrooms */}
            <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-slate-300">الغرف</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setParams({ ...params, bedroomsCount: Math.max(1, params.bedroomsCount - 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-sm font-bold text-cyan-400 w-4 text-center">{params.bedroomsCount}</span>
                <button
                  type="button"
                  onClick={() => setParams({ ...params, bedroomsCount: Math.min(10, params.bedroomsCount + 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bathrooms */}
            <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-slate-300">الحمامات</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setParams({ ...params, bathroomsCount: Math.max(1, params.bathroomsCount - 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-sm font-bold text-cyan-400 w-4 text-center">{params.bathroomsCount}</span>
                <button
                  type="button"
                  onClick={() => setParams({ ...params, bathroomsCount: Math.min(8, params.bathroomsCount + 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Living rooms */}
            <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-slate-300">الصالات</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setParams({ ...params, livingRoomsCount: Math.max(1, params.livingRoomsCount - 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-sm font-bold text-cyan-400 w-4 text-center">{params.livingRoomsCount}</span>
                <button
                  type="button"
                  onClick={() => setParams({ ...params, livingRoomsCount: Math.min(5, params.livingRoomsCount + 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Kitchens */}
            <div className="bg-slate-950/50 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-slate-300">المطابخ</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setParams({ ...params, kitchensCount: Math.max(1, params.kitchensCount - 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-sm font-bold text-cyan-400 w-4 text-center">{params.kitchensCount}</span>
                <button
                  type="button"
                  onClick={() => setParams({ ...params, kitchensCount: Math.min(3, params.kitchensCount + 1) })}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Special Facilities Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Majlis */}
          <button
            type="button"
            onClick={() => setParams({ ...params, hasMajlis: !params.hasMajlis })}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
              params.hasMajlis
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>مجلس ضيوف</span>
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.hasMajlis ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold' : 'border-slate-700'}`}>
              {params.hasMajlis && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Garage */}
          <button
            type="button"
            onClick={() => setParams({ ...params, hasGarage: !params.hasGarage })}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
              params.hasGarage
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>مرآب للسيارة</span>
            </div>
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.hasGarage ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold' : 'border-slate-700'}`}>
              {params.hasGarage && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Garden */}
          <button
            type="button"
            onClick={() => setParams({ ...params, hasGarden: !params.hasGarden })}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
              params.hasGarden
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-emerald-400" />
              <span>حديقة / حوش</span>
            </div>
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.hasGarden ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold' : 'border-slate-700'}`}>
              {params.hasGarden && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* Balcony */}
          <button
            type="button"
            onClick={() => setParams({ ...params, hasBalcony: !params.hasBalcony })}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
              params.hasBalcony
                ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>شرفة / تراس</span>
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${params.hasBalcony ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold' : 'border-slate-700'}`}>
              {params.hasBalcony && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Section 5: Architectural Styles Selector */}
        <div>
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1.5">الطراز المعماري للواجهات</label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stylesList.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setParams({ ...params, style: st.id })}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  params.style === st.id
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-base mb-1">{st.icon}</div>
                <div>
                  <div className="font-bold text-xs text-slate-200">{st.nameAr}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">{st.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 5.5: Facade Material Colors, Lighting & 3D Details */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Palette className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">تخصيص الخامات والألوان والديكور 3D</h3>
          </div>

          {/* Color Palettes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Facade Main Wall Color */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">لون جدران الواجهة:</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { color: '#f8fafc', label: 'رخام أبيض' },
                  { color: '#fef3c7', label: 'بيج فاخر' },
                  { color: '#d4a373', label: 'حجر طبيعي' },
                  { color: '#475569', label: 'رمادي مودرن' },
                  { color: '#1e293b', label: 'أسود معتم' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setParams({ ...params, facadeWallColor: c.color })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      (params.facadeWallColor || '#f8fafc') === c.color
                        ? 'border-cyan-400 text-cyan-300 bg-slate-800 ring-1 ring-cyan-400'
                        : 'border-slate-800 text-slate-400 bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: c.color }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Cladding Color */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">تطعيمات الخشب والماربل:</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { color: '#92400e', label: 'خشب أرز دافئ' },
                  { color: '#0f172a', label: 'ماربل أسود' },
                  { color: '#64748b', label: 'ألومنيوم رمادي' },
                  { color: '#451a03', label: 'ماهوجني غامق' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setParams({ ...params, accentColor: c.color })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      (params.accentColor || '#92400e') === c.color
                        ? 'border-cyan-400 text-cyan-300 bg-slate-800 ring-1 ring-cyan-400'
                        : 'border-slate-800 text-slate-400 bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: c.color }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Night Lighting Color */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">الإضاءة الليلية LED:</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { color: '#fbbf24', label: 'ذهبي دافئ 3000K' },
                  { color: '#f8fafc', label: 'أبيض ناصع 5000K' },
                  { color: '#38bdf8', label: 'أزرق هادئ' },
                  { color: '#34d399', label: 'أخضر زمردي' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setParams({ ...params, lightingColor: c.color })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      (params.lightingColor || '#fbbf24') === c.color
                        ? 'border-cyan-400 text-cyan-300 bg-slate-800 ring-1 ring-cyan-400'
                        : 'border-slate-800 text-slate-400 bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: c.color }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3D Features Toggles */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setParams({ ...params, showFurniture: !(params.showFurniture ?? true) })}
              className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all ${
                (params.showFurniture ?? true)
                  ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sofa className="w-3.5 h-3.5 text-cyan-400" />
                <span>أثاث منزلي 3D داخل الغرف</span>
              </span>
              <span className="text-xs">{(params.showFurniture ?? true) ? 'مفعل ✓' : 'مغلق'}</span>
            </button>

            <button
              type="button"
              onClick={() => setParams({ ...params, showFence: !(params.showFence ?? true) })}
              className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all ${
                (params.showFence ?? true)
                  ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Fence className="w-3.5 h-3.5 text-cyan-400" />
                <span>سور خارجي مع بوابة فاخرة</span>
              </span>
              <span className="text-xs">{(params.showFence ?? true) ? 'مفعل ✓' : 'مغلق'}</span>
            </button>

            <button
              type="button"
              onClick={() => setParams({ ...params, showGardenDecor: !(params.showGardenDecor ?? true) })}
              className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all ${
                (params.showGardenDecor ?? true)
                  ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>حديقة وتزيين ومسبح</span>
              </span>
              <span className="text-xs">{(params.showGardenDecor ?? true) ? 'مفعل ✓' : 'مغلق'}</span>
            </button>
          </div>
        </div>

        {/* Section 6: Custom Requirements & AI Prompt Directive Input */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
          <label className="text-xs text-cyan-400 font-bold uppercase tracking-wider block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>توجيه خاص للذكاء الاصطناعي (وصف الواجهة والمنزل)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">اكتب رغبتك بالواجهة والتصميم</span>
          </label>
          
          <textarea
            rows={3}
            value={params.customNotes}
            onChange={(e) => setParams({ ...params, customNotes: e.target.value })}
            placeholder="اكتب توجيهاتك هنا للذكاء الاصطناعي، مثل: أريد واجهة حجرية مودرن باللون الأبيض والرمادي، تطعيمات خشبية دافئة، شبابيك زجاجية كبيرة، مدخل رئيسي فاخر، وإضاءة ليلية مخفية..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none shadow-inner"
          />

          {/* Quick AI Directive Chips */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium block">إضافات سريعة لتوجه الذكاء الاصطناعي:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🏛️ واجهة حجر رخام أبيض', text: 'واجهة حجرية فرنسية بيضاء مع رخام' },
                { label: '🪟 شبابيك زجاج بانوراما', text: 'نوافذ زجاجية بانورامية كبيرة بألومنيوم أسود' },
                { label: '🪵 تطعيمات خشب وماربل', text: 'تطعيمات شرائح خشبية معتمة ورخام أسود' },
                { label: '💡 إضاءة LED ليلية', text: 'إضاءة ليد مخفية مسلطة على الواجهة الخارجية' },
                { label: '🏊 مسبح مع حديقة', text: 'حديقة واسعة مع مسبح مضاء وجلسة خارجية' },
                { label: '⬛ ألومنيوم أسود مودرن', text: 'إطارات ألومنيوم أسود فاخر وديكور معاصر' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const current = params.customNotes.trim();
                    if (!current.includes(chip.text)) {
                      setParams({
                        ...params,
                        customNotes: current ? `${current} - ${chip.text}` : chip.text,
                      });
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 rounded-lg transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Primary CTA Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || !params.length || !params.width}
          className="w-full py-4 bg-gradient-to-l from-cyan-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-950/30 hover:shadow-cyan-500/40 border border-cyan-400/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>جاري توليد المخطط والنموذج 3D بالذكاء الاصطناعي...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>توليد المخطط الذكي الآن</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
