import React, { useState } from 'react';
import {
  Compass,
  Box,
  Layers,
  Calculator,
  Image,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { Blueprint2DCanvas } from './components/Blueprint2DCanvas';
import { House3DViewer } from './components/House3DViewer';
import { StructuralReport } from './components/StructuralReport';
import { FacadeGallery } from './components/FacadeGallery';
import { PrintReportModal } from './components/PrintReportModal';
import { HouseInputParams, GeneratedHousePlan, Currency } from './types';
import { DEFAULT_HOUSE_PLAN } from './data/presetTemplates';

export default function App() {
  const [params, setParams] = useState<HouseInputParams>({ ...DEFAULT_HOUSE_PLAN.params });
  const [currentPlan, setCurrentPlan] = useState<GeneratedHousePlan>(DEFAULT_HOUSE_PLAN);
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'specs' | 'facades'>('3d');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle AI House Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success && data.plan) {
        setCurrentPlan(data.plan);
        // Switch to 3D or 2D tab automatically after generation
        setActiveTab('3d');
      } else {
        setErrorMsg(data.error || 'حدث خطأ أثناء توليد المخطط المعماري');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg('تعذر الاتصال بالسيرفر. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setParams({ ...DEFAULT_HOUSE_PLAN.params });
    setCurrentPlan(DEFAULT_HOUSE_PLAN);
    setErrorMsg(null);
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
