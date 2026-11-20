import React, { useMemo } from 'react';
import {
  Calculator,
  Coins,
  ShieldCheck,
  FileSpreadsheet,
  Wind,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { AppLanguage, Currency, GeneratedHousePlan } from '../types';
import {
  CURRENCY_MULTIPLIER_FROM_DZD,
  DEFAULT_COST_RATES_DZD,
  compute12StageCostBreakdown,
} from '../utils/costEstimator';
import { pickText } from '../utils/i18n';

interface StructuralReportProps {
  plan: GeneratedHousePlan;
  currency: Currency;
  customRatesDZD?: Record<string, { material: number; labor: number }>;
  onChangeCustomRatesDZD?: (next: Record<string, { material: number; labor: number }>) => void;
  language?: AppLanguage;
}

export const StructuralReport: React.FC<StructuralReportProps> = ({
  plan,
  currency,
  customRatesDZD = DEFAULT_COST_RATES_DZD,
  onChangeCustomRatesDZD,
  language = 'ar',
}) => {
  const specs = plan.specs;
  const curr = CURRENCY_MULTIPLIER_FROM_DZD[currency] || CURRENCY_MULTIPLIER_FROM_DZD.DZD;

  const breakdown = useMemo(
    () => compute12StageCostBreakdown(plan, customRatesDZD),
    [plan, customRatesDZD]
  );

  const fmtCurr = (amountDZD: number) => {
    const val = Math.round(amountDZD * curr.factor);
    return `${val.toLocaleString()} ${curr.symbol}`;
  };

  const handleRateEdit = (stageId: string, field: 'material' | 'labor', val: number) => {
    if (!onChangeCustomRatesDZD) return;
    const base = customRatesDZD[stageId] || DEFAULT_COST_RATES_DZD[stageId] || { material: 1000, labor: 500 };
    onChangeCustomRatesDZD({
      ...customRatesDZD,
      [stageId]: {
        ...base,
        [field]: Math.max(0, Math.round(val || 0)),
      },
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {pickText(language, 'حاسبة التكلفة والكميات الهندسية (12 مرحلة)', 'Devis Quantitatif & Structure (12 Étapes)', '12-Stage Construction Cost & Engineering Quantities')}
            </h3>
            <p className="text-xs text-slate-400">
              {pickText(language, 'الأسعار الافتراضية بالدينار الجزائري (DZD) مع إمكانية تعديل أسعار الوحدات والمصنعية مباشرة', 'Tarifs DZD éditables par étape', 'Default rates in DZD with editable material & labor unit prices')}
            </p>
          </div>
        </div>

        {onChangeCustomRatesDZD && (
          <button
            type="button"
            onClick={() => onChangeCustomRatesDZD({ ...DEFAULT_COST_RATES_DZD })}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{pickText(language, 'استعادة أسعار السوق DZD', 'Réinitialiser tarifs', 'Reset DZD Rates')}</span>
          </button>
        )}
      </div>

      {/* Low / Mid / High Budget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block mb-1">
            {pickText(language, 'التقدير الاقتصادي (Low)', 'Estimation Basse', 'Low Estimate (-14%)')}
          </span>
          <div className="text-lg font-extrabold text-emerald-400 font-mono">
            {fmtCurr(breakdown.totalLowDZD)}
          </div>
        </div>

        <div className="bg-cyan-950/35 border border-cyan-500/50 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1 mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            {pickText(language, 'التقدير المتوسط الواقعي (Mid)', 'Estimation Moyenne', 'Mid Estimate (Materials + Labor)')}
          </span>
          <div className="text-xl font-black text-white font-mono">
            {fmtCurr(breakdown.totalMidDZD)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {pickText(language, 'المواد:', 'Matériaux:', 'Mat:')} {fmtCurr(breakdown.totalMaterialDZD)} | {pickText(language, 'اليد العاملة:', 'Main d’œuvre:', 'Labor:')} {fmtCurr(breakdown.totalLaborDZD)}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block mb-1">
            {pickText(language, 'التقدير الفاخر / الاحتياطي (High)', 'Estimation Haute', 'High Estimate (+22%)')}
          </span>
          <div className="text-lg font-extrabold text-amber-400 font-mono">
            {fmtCurr(breakdown.totalHighDZD)}
          </div>
        </div>
      </div>

      {/* Material Quantities Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'مساحة البناء', 'Surface Bâtie', 'Built Area')}</span>
          <strong className="text-base font-extrabold text-cyan-400">{breakdown.quantities.builtAreaM2} m²</strong>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'الأعمدة / الأساسات', 'Poteaux / Semelles', 'Cols / Footings')}</span>
          <strong className="text-base font-extrabold text-rose-400">{plan.columns.length} / {plan.foundations?.length || plan.columns.length}</strong>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'الخرسانة المسلحة', 'Béton Armé', 'RC Concrete')}</span>
          <strong className="text-base font-extrabold text-emerald-400">{breakdown.quantities.concreteM3} m³</strong>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'حديد التسليح', 'Acier HA', 'Rebar Steel')}</span>
          <strong className="text-base font-extrabold text-white">{breakdown.quantities.steelTons} T</strong>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'الآجر / الطوب', 'Briques', 'Bricks Est.')}</span>
          <strong className="text-base font-extrabold text-amber-300">{breakdown.quantities.bricksCount.toLocaleString()}</strong>
        </div>
      </div>

      {/* 12-Stage Editable Cost Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>{pickText(language, 'تفصيل المراحل الإنشائية الـ 12 (تعديل أسعار DZD مباشرة)', 'Détail des 12 Phases de Construction', '12-Stage Cost & Unit Rates Breakdown')}</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">12 Stages</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="p-2.5">{pickText(language, 'المرحلة', 'Étape', 'Stage')}</th>
                <th className="p-2.5">{pickText(language, 'الكمية', 'Qté', 'Qty')}</th>
                <th className="p-2.5">{pickText(language, 'مواد (DZD/وحدة)', 'Matériaux (DZD)', 'Mat. Unit (DZD)')}</th>
                <th className="p-2.5">{pickText(language, 'مصنعية (DZD/وحدة)', 'Main d’œuvre (DZD)', 'Labor Unit (DZD)')}</th>
                <th className="p-2.5">{pickText(language, 'الإجمالي', 'Total', 'Subtotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {breakdown.stages.map((st) => {
                const subDZD = st.quantity * (st.materialUnitRateDZD + st.laborUnitRateDZD);
                return (
                  <tr key={st.id} className="hover:bg-slate-800/35">
                    <td className="p-2.5 font-semibold text-white">
                      {pickText(language, st.nameAr, st.nameFr, st.nameEn)}
                    </td>
                    <td className="p-2.5 font-mono text-cyan-300 whitespace-nowrap">
                      {st.quantity.toLocaleString()} {pickText(language, st.unitAr, st.unitFr, st.unitEn)}
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={customRatesDZD[st.id]?.material ?? DEFAULT_COST_RATES_DZD[st.id]?.material ?? st.materialUnitRateDZD}
                        onChange={(e) => handleRateEdit(st.id, 'material', parseFloat(e.target.value))}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                        dir="ltr"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={customRatesDZD[st.id]?.labor ?? DEFAULT_COST_RATES_DZD[st.id]?.labor ?? st.laborUnitRateDZD}
                        onChange={(e) => handleRateEdit(st.id, 'labor', parseFloat(e.target.value))}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                        dir="ltr"
                      />
                    </td>
                    <td className="p-2.5 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {fmtCurr(subDZD)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Structural & Ventilation Reasoning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{pickText(language, 'التحليل الإنشائي للأعمدة والجسور:', 'Analyse Structurelle:', 'Structural Grid & Beams Analysis:')}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{specs.columnsReasoning}</p>
          <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-800">{specs.structuralNotes}</p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
            <Wind className="w-4 h-4" />
            <span>{pickText(language, 'التهوية والتوجيه الشمسي:', 'Ventilation & Orientation:', 'Ventilation & Solar Orientation:')}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{specs.orientationNotes}</p>
          <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-800">{specs.ventilationNotes}</p>
        </div>
      </div>

      {/* Columns Schedule */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-rose-400" />
            <span>{pickText(language, 'جدول الأعمدة الخرسانية (Columns Schedule)', 'Tableau des Poteaux', 'Structural Columns Schedule')}</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">{plan.columns.length} pts</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="p-2.5">{pickText(language, 'المحور', 'Axe', 'Axis')}</th>
                <th className="p-2.5">(X , Y)</th>
                <th className="p-2.5">{pickText(language, 'المقطع', 'Section', 'Section')}</th>
                <th className="p-2.5">{pickText(language, 'رتبة الخرسانة', 'Béton', 'Concrete')}</th>
                <th className="p-2.5">{pickText(language, 'التسليح التقديري', 'Ferraillage', 'Rebar Est.')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {plan.columns.slice(0, 8).map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-rose-400 font-mono">{col.gridAxis}</td>
                  <td className="p-2.5 dir-ltr font-mono">{col.x}m , {col.y}m</td>
                  <td className="p-2.5">{Math.round((col.sizeX || 0.25) * 100)} × {Math.round((col.sizeY || 0.45) * 100)} cm</td>
                  <td className="p-2.5 font-mono text-slate-400">C25/30</td>
                  <td className="p-2.5 text-slate-400">8–12 Ø14 HA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preliminary Engineering Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-500/35 rounded-xl p-3 text-xs text-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          {pickText(
            language,
            'تنبيه هندسي ومالي: الأرقام والكميات والتكاليف المحسوبة استرشادية أولية بناءً على الأبعاد الحالية، ويجب اعتماد مخططات التسليح ودراسة التربة والمقايسة النهائية من مكتب دراسات هندسية معتمد.',
            'Avertissement : Les quantités et coûts sont préliminaires et doivent être validés par un bureau d’études agréé.',
            'Preliminary Advisory Disclaimer: Quantities, structural elements, and cost estimates are preliminary and require certified civil engineer verification and soil study.'
          )}
        </span>
      </div>
    </div>
  );
};
