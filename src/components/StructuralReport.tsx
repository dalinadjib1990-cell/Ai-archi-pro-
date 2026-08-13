import React from 'react';
import {
  Calculator,
  Building2,
  Boxes,
  Coins,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Wind,
  Sun
} from 'lucide-react';
import { GeneratedHousePlan, Currency } from '../types';

interface StructuralReportProps {
  plan: GeneratedHousePlan;
  currency: Currency;
}

export const StructuralReport: React.FC<StructuralReportProps> = ({ plan, currency }) => {
  const specs = plan.specs;

  // Currency conversion rate multipliers relative to USD base
  const rates: Record<Currency, { rate: number; label: string; symbol: string }> = {
    SAR: { rate: 3.75, label: 'ريال سعودي', symbol: 'ر.س' },
    USD: { rate: 1.0, label: 'دولار أمريكي', symbol: '$' },
    DZD: { rate: 135.0, label: 'دينار جزائري', symbol: 'د.ج' },
    AED: { rate: 3.67, label: 'درهم إماراتي', symbol: 'د.إ' },
    EGP: { rate: 48.5, label: 'جنيه مصري', symbol: 'ج.م' },
  };

  const curr = rates[currency] || rates.USD;
  const minCostConverted = Math.round((specs.estimatedCostMin || 100000) * curr.rate);
  const maxCostConverted = Math.round((specs.estimatedCostMax || 150000) * curr.rate);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">التقرير والكميات الإنشائية والهندسية</h3>
            <p className="text-xs text-slate-400">حسابات الأعمدة الخرسانية، التكلفة التقديرية، والاشتراطات المعمارية</p>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 px-3 text-xs flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>
            التكلفة التقديرية للبناء: <strong className="text-amber-400 font-bold">{minCostConverted.toLocaleString()} - {maxCostConverted.toLocaleString()} {curr.symbol}</strong>
          </span>
        </div>
      </div>

      {/* Grid Cards: Quantities Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Land Area */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">مساحة الأرض الإجمالية:</span>
          <div className="text-lg font-extrabold text-white">
            {specs.totalLandArea} <span className="text-xs text-slate-400 font-normal">م²</span>
          </div>
        </div>

        {/* Built Area */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">إجمالي مساحة البناء:</span>
          <div className="text-lg font-extrabold text-cyan-400">
            {specs.totalBuiltArea} <span className="text-xs text-slate-400 font-normal">م²</span>
          </div>
        </div>

        {/* Columns Count */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">عدد الأعمدة الخرسانية:</span>
          <div className="text-lg font-extrabold text-rose-400">
            {specs.recommendedColumnsCount || plan.columns.length} <span className="text-xs text-slate-400 font-normal">عموداً</span>
          </div>
        </div>

        {/* Concrete Volume */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">حجم الخرسانة المسلحة:</span>
          <div className="text-lg font-extrabold text-emerald-400">
            {specs.estimatedConcreteM3 || Math.round(specs.totalBuiltArea * 0.45)} <span className="text-xs text-slate-400 font-normal">م³</span>
          </div>
        </div>
      </div>

      {/* Structural Reasoning & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>التوصيات والتحليل الإنشائي للأعمدة:</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{specs.columnsReasoning}</p>
          <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-800">{specs.structuralNotes}</p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
            <Wind className="w-4 h-4" />
            <span>دراسة التهوية والتوجيه الشمسي:</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{specs.orientationNotes}</p>
          <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-800">{specs.ventilationNotes}</p>
        </div>
      </div>

      {/* Columns Schedule Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-rose-400" />
            <span>جدول توزيع أبعاد الأعمدة الخرسانية (Columns Schedule):</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">إجمالي: {plan.columns.length} نقطة</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="p-2.5">المحور الشبكي</th>
                <th className="p-2.5">إحداثيات التوقيع (X , Y)</th>
                <th className="p-2.5">المقطع الخرساني</th>
                <th className="p-2.5">رتبة الخرسانة</th>
                <th className="p-2.5">تثبيت التسليح الرئيسي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {plan.columns.slice(0, 10).map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-rose-400 font-mono">{col.gridAxis}</td>
                  <td className="p-2.5 dir-ltr font-mono">{col.x}م , {col.y}م</td>
                  <td className="p-2.5">20 × 50 سم</td>
                  <td className="p-2.5 font-mono text-slate-400">C25/30</td>
                  <td className="p-2.5 text-slate-400">12 أسياخ قطر 14 ملم (Ф14)</td>
                </tr>
              ))}
            </tbody>
          </table>
          {plan.columns.length > 10 && (
            <div className="text-center text-[11px] text-slate-500 py-2 bg-slate-800/30">
              وغيرها {plan.columns.length - 10} أعمدة موزعة بالتساوي...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
