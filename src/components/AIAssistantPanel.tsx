import React, { useState } from 'react';
import { Bot, Send, RotateCcw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import {
  AIAssistantCommandEntry,
  AppLanguage,
  GeneratedHousePlan,
} from '../types';
import { applyLocalDesignCommand } from '../utils/aiAssistantEngine';
import { pickText } from '../utils/i18n';

interface AIAssistantPanelProps {
  plan: GeneratedHousePlan;
  log: AIAssistantCommandEntry[];
  onApplyPlanEdit: (updatedPlan: GeneratedHousePlan, entry: AIAssistantCommandEntry) => void;
  onUndo: () => void;
  canUndo: boolean;
  language: AppLanguage;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  plan,
  log,
  onApplyPlanEdit,
  onUndo,
  canUndo,
  language,
}) => {
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const quickCommands =
    language === 'fr'
      ? [
          'Ajouter un garage voiture',
          'Ajouter un étage',
          'Agrandir le salon',
          'Ajouter une chambre',
          'Toit en tuiles inclinées',
          'Changer la couleur façade en pierre beige',
        ]
      : language === 'en'
      ? [
          'Add a car garage',
          'Add second floor',
          'Enlarge living room',
          'Add a bedroom',
          'Make roof sloped',
          'Change wall color to beige stone',
        ]
      : [
          'أضف مرآب سيارات',
          'أضف طابق',
          'كبّر الصالة',
          'أضف غرفة نوم',
          'اجعل السقف مائل',
          'غيّر لون الجدران إلى بيج دافئ',
          'اجعل الأرض 18×12',
        ];

  const handleSubmit = async (customCmd?: string) => {
    const cmdText = (customCmd ?? command).trim();
    if (!cmdText || isRunning) return;
    setIsRunning(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdText, plan }),
      });
      if (res.ok) {
        const data = await res.json();
        const entry: AIAssistantCommandEntry = {
          id: `cmd-${Date.now()}`,
          timestamp: new Date().toISOString(),
          command: cmdText,
          explanation: data.explanation || 'تم تنفيذ التعديل.',
          applied: Boolean(data.applied && data.updatedPlan),
          source: data.source === 'gemini' ? 'gemini' : 'local',
        };
        if (data.applied && data.updatedPlan) {
          onApplyPlanEdit(data.updatedPlan, entry);
          setCommand('');
          return;
        }
        onApplyPlanEdit(plan, entry);
        return;
      }
    } catch {
      // Fallback transparently to deterministic engine
    } finally {
      setIsRunning(false);
    }

    const localResult = applyLocalDesignCommand(plan, cmdText);
    const entry: AIAssistantCommandEntry = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      command: cmdText,
      explanation: localResult.explanation,
      applied: localResult.applied,
      source: 'local',
    };
    onApplyPlanEdit(localResult.updatedPlan || plan, entry);
    if (localResult.applied) setCommand('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{pickText(language, 'مساعد التصميم المعماري بالذكاء الاصطناعي', 'Assistant Design IA', 'AI Design Assistant')}</span>
              <span className="text-[10px] bg-cyan-950 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
                Gemini 4 Hydrogen
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {pickText(
                language,
                'أعط أوامر مباشرة لتعديل التصميم الحي مع دعم التراجع الكامل (Undo).',
                'Modifiez le plan actif par commandes en langage naturel.',
                'Issue natural-language edits directly onto your live house plan with full Undo support.'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{pickText(language, 'تراجع عن آخر تعديل', 'Annuler', 'Undo Last Edit')}</span>
        </button>
      </div>

      {/* Command Input */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder={pickText(
            language,
            'مثال: أضف مرآب سيارات، وسّع الصالون، أضف طابقاً ثانياً، اجعل السقف مائل...',
            'Ex: Ajouter un garage, agrandir le salon, toit incliné...',
            'e.g. Add a garage, enlarge living room, add second floor, make roof sloped...'
          )}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isRunning || !command.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isRunning ? pickText(language, 'جاري التنفيذ...', 'Exécution...', 'Executing...') : pickText(language, 'تنفيذ الأمر', 'Exécuter', 'Apply Edit')}</span>
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {quickCommands.map((qc, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSubmit(qc)}
            disabled={isRunning}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-cyan-300 flex items-center gap-1 transition-all"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{qc}</span>
          </button>
        ))}
      </div>

      {/* Command Log */}
      <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
        {log.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6 border border-dashed border-slate-800 rounded-xl">
            {pickText(language, 'لم يتم تنفيذ أي أوامر تعديل بعد.', 'Aucune commande exécutée pour le moment.', 'No assistant edits executed yet.')}
          </div>
        ) : (
          log.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                item.applied
                  ? 'bg-emerald-950/25 border-emerald-500/30 text-slate-100'
                  : 'bg-rose-950/25 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1.5">
                  {item.applied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>{item.command}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{item.source.toUpperCase()}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{item.explanation}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
