import React, { useMemo, useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, ScanSearch } from 'lucide-react';
import { AppLanguage, GeneratedHousePlan, SelectedEntity } from '../types';
import { analyzeHouseDesign } from '../utils/designAnalyzer';
import { pickText } from '../utils/i18n';

interface DesignAnalyzerPanelProps {
  plan: GeneratedHousePlan;
  onSelectTarget?: (entity: SelectedEntity, floor?: number) => void;
  language: AppLanguage;
}

export const DesignAnalyzerPanel: React.FC<DesignAnalyzerPanelProps> = ({
  plan,
  onSelectTarget,
  language,
}) => {
  const [scanTick, setScanTick] = useState(0);
  const analysis = useMemo(() => analyzeHouseDesign(plan), [plan, scanTick]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ScanSearch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {pickText(language, 'فحص وتدقيق التصميم المعماري (ANALYZE MY DESIGN)', 'Audit Architectural', 'ANALYZE MY DESIGN — Geometric Audit')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {pickText(
                language,
                'تحليل هندسي لمقاسات الغرف والممرات والتهوية وتداخل الأبواب والأثاث ونسبة البناء.',
                'Analyse géométrique des surfaces, fenêtres, circulations et conflits.',
                'Geometric check for room sizing, corridors, daylight windows, door clearances, and lot coverage.'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setScanTick((t) => t + 1)}
          className="px-4 py-2 rounded-xl bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95"
        >
          <ScanSearch className="w-4 h-4" />
          <span>{pickText(language, 'إعادة فحص التصميم', 'RELANCER L’ANALYSE', 'ANALYZE MY DESIGN')}</span>
        </button>
      </div>

      {/* Score & Coverage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
        <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'جودة المخطط', 'Score', 'Design Score')}</span>
          <strong className={`text-xl font-black ${analysis.score >= 85 ? 'text-emerald-400' : analysis.score >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
            {analysis.score}/100
          </strong>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'مساحة الأرض', 'Terrain', 'Lot Area')}</span>
          <strong className="text-base font-bold text-white">{analysis.stats.totalLotArea} m²</strong>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'نسبة البناء', 'Emprise', 'Coverage')}</span>
          <strong className="text-base font-bold text-cyan-400">{analysis.stats.coveragePercent}%</strong>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'مجموع الغرف', 'Pièces', 'Rooms Sum')}</span>
          <strong className="text-base font-bold text-emerald-400">{analysis.stats.roomsSumArea} m²</strong>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 block">{pickText(language, 'فراغ غير مخصص', 'Non affecté', 'Unallocated')}</span>
          <strong className="text-base font-bold text-amber-300">{analysis.stats.wastedAreaM2} m²</strong>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-2.5">
        {analysis.issues.length === 0 ? (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3 text-xs text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              {pickText(
                language,
                'ممتاز! لم يتم العثور على تعارضات أبواب أو غرف ضيقة أو تجاوز لحدود الأرض.',
                'Parfait ! Aucun conflit géométrique majeur détecté.',
                'Great layout! No door clashes, room sizing errors, or boundary violations detected.'
              )}
            </span>
          </div>
        ) : (
          analysis.issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => {
                if (issue.targetId && onSelectTarget) {
                  const isFurn = plan.furniture.some((f) => f.id === issue.targetId);
                  const isRoom = plan.rooms.some((r) => r.id === issue.targetId);
                  const isOp = plan.openings.some((o) => o.id === issue.targetId);
                  const entity: SelectedEntity = isFurn
                    ? { kind: 'furniture', id: issue.targetId }
                    : isRoom
                    ? { kind: 'room', id: issue.targetId }
                    : isOp
                    ? { kind: 'opening', id: issue.targetId }
                    : null;
                  if (entity) onSelectTarget(entity, issue.floor);
                }
              }}
              className={`p-3.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-all hover:brightness-110 ${
                issue.severity === 'error'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-100'
                  : issue.severity === 'warning'
                  ? 'bg-amber-950/35 border-amber-500/40 text-amber-100'
                  : 'bg-slate-950/70 border-cyan-500/30 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-bold">
                <span className="flex items-center gap-1.5">
                  {issue.severity === 'error' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : issue.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <span>{pickText(language, issue.titleAr, issue.titleFr, issue.titleEn)}</span>
                </span>
                {typeof issue.floor === 'number' && (
                  <span className="text-[10px] font-mono opacity-75">F{issue.floor}</span>
                )}
              </div>
              <p className="text-[11px] opacity-90">{pickText(language, issue.detailAr, issue.detailFr, issue.detailEn)}</p>
              <p className="text-[11px] text-cyan-300">
                ➜ {pickText(language, issue.suggestionAr, issue.suggestionFr, issue.suggestionEn)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Preliminary Engineering Disclaimer */}
      <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
        {pickText(
          language,
          'ملاحظة هندسية: يعتمد الفحص على القواعد المعمارية الاسترشادية الأولية ولا يُغني عن مراجعة مهندس معماري ومدني معتمد وفق أنظمة البناء المحلية.',
          'Note : Cet audit est purement indicatif et ne remplace pas une validation d’architecte agréé.',
          'Advisory Note: Automated checks provide preliminary design guidance only and do not replace licensed local code review.'
        )}
      </div>
    </div>
  );
};
