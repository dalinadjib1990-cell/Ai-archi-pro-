import React, { useState } from 'react';
import {
  Compass,
  Box,
  Layers,
  Calculator,
  Image,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Check,
  RotateCw,
  Sliders,
  Shuffle,
  Wand2
} from 'lucide-react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { Blueprint2DCanvas } from './components/Blueprint2DCanvas';
import { House3DViewer } from './components/House3DViewer';
import { StructuralReport } from './components/StructuralReport';
import { FacadeGallery } from './components/FacadeGallery';
import { PrintReportModal } from './components/PrintReportModal';
import { RoomEditor } from './components/RoomEditor';
import { HouseInputParams, GeneratedHousePlan, Currency } from './types';
import { DEFAULT_HOUSE_PLAN } from './data/presetTemplates';
import { generateMultipleProceduralOptions, generateProceduralPlan } from './utils/proceduralGenerator';

export default function App() {
  const [params, setParams] = useState<HouseInputParams>({ ...DEFAULT_HOUSE_PLAN.params });
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedHousePlan[]>(() =>
    generateMultipleProceduralOptions(DEFAULT_HOUSE_PLAN.params)
  );
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'editor' | 'specs' | 'facades'>('3d');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiSuccessBadge, setAiSuccessBadge] = useState<string | null>(null);
  const [alternativeVariantCounter, setAlternativeVariantCounter] = useState<number>(1);

  const currentPlan = generatedPlans[selectedOptionIndex] || generatedPlans[0] || DEFAULT_HOUSE_PLAN;

  // Check if current user inputs differ from the active plan's parameters
  const hasUnappliedInputChanges = React.useMemo(() => {
    if (!currentPlan?.params) return false;
    return (
      params.length !== currentPlan.params.length ||
      params.width !== currentPlan.params.width ||
      params.bedroomsCount !== currentPlan.params.bedroomsCount ||
      params.bathroomsCount !== currentPlan.params.bathroomsCount ||
      params.floorsCount !== currentPlan.params.floorsCount ||
      params.hasMajlis !== currentPlan.params.hasMajlis ||
      params.hasGarage !== currentPlan.params.hasGarage ||
      params.hasGarden !== currentPlan.params.hasGarden ||
      params.hasBalcony !== currentPlan.params.hasBalcony ||
      params.hasStairs !== currentPlan.params.hasStairs ||
      params.hasCourtyard !== currentPlan.params.hasCourtyard ||
      params.roofType !== currentPlan.params.roofType ||
      params.targetBuiltArea !== currentPlan.params.targetBuiltArea ||
      params.style !== currentPlan.params.style ||
      params.customNotes !== currentPlan.params.customNotes
    );
  }, [params, currentPlan]);

  // Handle AI House Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setAiSuccessBadge(null);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.plans && data.plans.length > 0) {
        setGeneratedPlans(data.plans);
        setSelectedOptionIndex(0);
        setActiveTab('3d');
        if (data.source === 'gemini') {
          setAiSuccessBadge(`تم التوليد بنجاح عبر الذكاء الاصطناعي الفعلي Gemini (${data.modelUsed || 'Gemini Flash'})`);
        } else {
          setAiSuccessBadge('تم إنشاء 3 نماذج معمارية مخصصة لمدخلاتك بدقة');
        }
      } else {
        // Fallback to client procedural generator options
        const fallbackPlans = generateMultipleProceduralOptions(params);
        setGeneratedPlans(fallbackPlans);
        setSelectedOptionIndex(0);
        setActiveTab('3d');
        setAiSuccessBadge('تم إنشاء 3 نماذج معمارية مخصصة لمدخلاتك بدقة');
      }
    } catch (err: any) {
      console.warn('Backend API call fallback to client procedural generator:', err);
      const fallbackPlans = generateMultipleProceduralOptions(params);
      setGeneratedPlans(fallbackPlans);
      setSelectedOptionIndex(0);
      setActiveTab('3d');
      setAiSuccessBadge('تم إنشاء 3 نماذج معمارية مخصصة لمدخلاتك بدقة');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Alternative Architecture Layout (توليد تصميم آخر)
  const handleGenerateAlternative = () => {
    const nextVariant = (alternativeVariantCounter + 1) % 5;
    setAlternativeVariantCounter(nextVariant);
    const newAlternativePlan = generateProceduralPlan(params, nextVariant);
    
    setGeneratedPlans((prev) => {
      const copy = [...prev];
      copy[selectedOptionIndex] = newAlternativePlan;
      return copy;
    });

    setAiSuccessBadge(`تم إنشاء توزيع معماري بديل: ${newAlternativePlan.optionTitle}`);
  };

  // Update plan with modified rooms from RoomEditor
  const handleUpdatePlan = (updatedPlan: GeneratedHousePlan) => {
    setGeneratedPlans((prev) => {
      const copy = [...prev];
      copy[selectedOptionIndex] = updatedPlan;
      return copy;
    });
    setAiSuccessBadge('تم تطبيق تعديلات الغرف وحفظها في النموذج 3D والمخطط!');
  };

  const handleReset = () => {
    setParams({ ...DEFAULT_HOUSE_PLAN.params });
    const defaultOptions = generateMultipleProceduralOptions(DEFAULT_HOUSE_PLAN.params);
    setGeneratedPlans(defaultOptions);
    setSelectedOptionIndex(0);
    setErrorMsg(null);
    setAiSuccessBadge(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans dir-rtl antialiased flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header */}
      <Header
        currency={currency}
        setCurrency={setCurrency}
        onPrint={() => setShowPrintModal(true)}
        onReset={handleReset}
        isGenerating={isGenerating}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-10">
        {/* Error Alert if any */}
        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-4 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* Two Column Layout: Inputs on Left, Visual Studio on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Input Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <InputForm
              params={params}
              setParams={setParams}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Column 2: Interactive Architectural Studio (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Real AI Generation Status Banner */}
            {aiSuccessBadge && (
              <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-blue-950/90 border border-cyan-500/50 rounded-2xl p-3 text-xs text-cyan-200 flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{aiSuccessBadge}</span>
                    <span className="text-[11px] text-cyan-300/80">
                      أبعاد: {currentPlan.params.length}×{currentPlan.params.width}م | {currentPlan.params.bedroomsCount} غرف نوم | {currentPlan.params.floorsCount} طوابق | الطراز: {currentPlan.params.style}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setAiSuccessBadge(null)}
                  className="text-slate-400 hover:text-white px-2 py-1 hover:bg-slate-800 rounded-lg transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Unapplied Changes Prompt Banner */}
            {hasUnappliedInputChanges && (
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/80 border border-amber-500/50 rounded-2xl p-3 text-xs text-amber-200 flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">تم تعديل المدخلات في اللوحة الجانبية</span>
                    <span className="text-[11px] text-amber-300/90">
                      اضغط لتوليد 3 نماذج ذكاء اصطناعي جديدة متطابقة مع أبعادك ومتطلباتك الجديدة.
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-bold text-xs shadow-lg transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'جاري التوليد...' : 'تحديث النماذج الآن'}</span>
                </button>
              </div>
            )}

            {/* AI Generated Multi-Options Toolbar */}
            <div className="bg-slate-900/80 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>خيارات التوليد المعماري ({generatedPlans.length} نماذج مقترحة)</span>
                      <span className="bg-cyan-950 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30">
                        {currentPlan.source === 'gemini' ? 'Gemini AI مُولّد' : 'توزيع هندسي ذكي'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">انقر على الخيار للتبديل بين المخططات والنماذج المعمارية 3D فوراً:</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleGenerateAlternative}
                    disabled={isGenerating}
                    className="px-2.5 py-1.5 bg-gradient-to-l from-indigo-900 to-purple-950 hover:from-indigo-800 hover:to-purple-900 border border-purple-500/50 text-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
                    title="إنشاء توزيع معماري بديل ومختلف تماماً"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-purple-300" />
                    <span>توليد تصميم آخر</span>
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95"
                    title="توليد أفكار ونماذج جديدة بالذكاء الاصطناعي"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
                    <span>{isGenerating ? 'جاري التوليد...' : 'توليد أفكار جديدة'}</span>
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {generatedPlans.map((planOption, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  return (
                    <button
                      key={planOption.id || idx}
                      onClick={() => setSelectedOptionIndex(idx)}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between relative overflow-hidden group ${
                        isSelected
                          ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Active Checkmark Pill */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-cyan-500 text-slate-950 font-black p-0.5 rounded-full shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <span>نموذج 0{idx + 1}</span>
                            {planOption.source === 'gemini' && (
                              <span className="text-[9px] bg-blue-950 text-blue-300 px-1 rounded border border-blue-500/30">AI</span>
                            )}
                          </span>
                          {planOption.optionBadge && (
                            <span className="text-[9px] bg-slate-800/90 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium truncate max-w-[100px]">
                              {planOption.optionBadge}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-xs text-white group-hover:text-cyan-200 transition-colors line-clamp-1">
                          {planOption.optionTitle || `الخيار ${idx + 1}`}
                        </div>

                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">
                          {planOption.optionDescription || 'توزيع خاص بمتطلبات البناء المحددة.'}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span>غرف: <strong className="text-cyan-300">{planOption.rooms.length}</strong></span>
                        <span>أعمدة: <strong className="text-emerald-400">{planOption.columns.length}</strong></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-2xl backdrop-blur-xl overflow-x-auto">
              <button
                onClick={() => setActiveTab('3d')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === '3d'
                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Box className="w-4 h-4 text-cyan-200" />
                <span>نموذج 3D تفاعلي</span>
              </button>

              <button
                onClick={() => setActiveTab('2d')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === '2d'
                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4 text-cyan-200" />
                <span>المخطط الهندسي 2D</span>
              </button>

              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'editor'
                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-4 h-4 text-cyan-200" />
                <span>محرر الغرف</span>
              </button>

              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'specs'
                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Calculator className="w-4 h-4 text-cyan-200" />
                <span>تقرير الكميات والأعمدة</span>
              </button>

              <button
                onClick={() => setActiveTab('facades')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'facades'
                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Image className="w-4 h-4 text-cyan-200" />
                <span>صور الواجهات</span>
              </button>
            </div>

            {/* Tab Views Content */}
            {activeTab === '3d' && <House3DViewer plan={currentPlan} />}
            {activeTab === '2d' && <Blueprint2DCanvas plan={currentPlan} />}
            {activeTab === 'editor' && (
              <RoomEditor
                plan={currentPlan}
                onUpdatePlan={handleUpdatePlan}
                onResetLayout={() => {
                  const fresh = generateProceduralPlan(params, selectedOptionIndex);
                  handleUpdatePlan(fresh);
                }}
              />
            )}
            {activeTab === 'specs' && <StructuralReport plan={currentPlan} currency={currency} />}
            {activeTab === 'facades' && <FacadeGallery plan={currentPlan} />}
          </div>
        </div>
      </main>

      {/* Print Blueprint Modal */}
      {showPrintModal && (
        <PrintReportModal
          plan={currentPlan}
          currency={currency}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 mt-auto bg-[#020617]/90 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-slate-400 font-medium">
            ARCH-AI PRO — نظام تصميم وتوليد المخططات المعمارية والنماذج ثلاثية الأبعاد
          </div>
          <div className="flex items-center gap-3">
            <span className="text-cyan-400/80">3D CAD Renderer &bull; AI Blueprint Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

