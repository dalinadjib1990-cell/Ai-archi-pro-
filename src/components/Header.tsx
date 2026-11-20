import React from 'react';
import { Sparkles, Printer, RotateCcw } from 'lucide-react';
import { Currency } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onPrint: () => void;
  onReset: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  setCurrency,
  onPrint,
  onReset,
  isGenerating,
}) => {
  return (
    <header className="bg-[#020617]/85 border-b border-slate-800/80 text-slate-100 py-3 px-3 sm:px-6 lg:px-8 sticky top-0 z-50 backdrop-blur-xl shadow-2xl w-full">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
          <img
            src="/pwa-192x192.png"
            alt="ARCH-AI PRO"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.45)] border border-cyan-400/40 object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white font-sans">
                ARCH-AI PRO
                <span className="text-cyan-400 font-light mx-1 text-xs sm:text-base">| المهندس المعماري 3D</span>
              </h1>
              <span className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.2)] shrink-0">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Gemini 4 Hydrogen
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
              منصة هندسية لتوليد المخططات، النماذج ثلاثية الأبعاد، وحساب الأعمدة والواجهات
            </p>
          </div>
        </div>

        {/* Action Controls & Currency */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between sm:justify-end">
          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-[11px] sm:text-xs backdrop-blur-md">
            <span className="text-slate-400 px-1.5 text-[11px] hidden md:inline">العملة:</span>
            {(['SAR', 'USD', 'DZD', 'AED', 'EGP'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all font-semibold ${
                  currency === c
                    ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {c === 'SAR' ? 'ر.س' : c === 'USD' ? '$' : c === 'DZD' ? 'د.ج' : c === 'AED' ? 'د.إ' : 'ج.م'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <PWAInstallButton />

            {/* Reset Button */}
            <button
              onClick={onReset}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-xs font-medium transition-all hover:text-white"
              title="إعادة الضبط إلى الإعدادات الافتراضية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">إعادة ضبط</span>
            </button>

            {/* Print Engineering Blueprint Sheet */}
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950/50 border border-cyan-400/30 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-200" />
              <span>طباعة المخطط</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
