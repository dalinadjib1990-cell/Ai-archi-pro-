import React from 'react';
import {
  Printer,
  RotateCcw,
  Save,
  Undo2,
  Redo2,
  FolderOpen,
  Globe,
  Check,
} from 'lucide-react';
import { AppLanguage, Currency, MeasurementUnit } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { pickText } from '../utils/i18n';

interface HeaderProps {
  projectName: string;
  onChangeProjectName: (name: string) => void;
  onSaveProject: () => void;
  justSaved: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenProjects: () => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  unit: MeasurementUnit;
  onChangeUnit: (u: MeasurementUnit) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onPrint: () => void;
  onReset: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onChangeProjectName,
  onSaveProject,
  justSaved,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenProjects,
  language,
  onChangeLanguage,
  unit,
  onChangeUnit,
  currency,
  setCurrency,
  onPrint,
  onReset,
  isGenerating,
}) => {
  return (
    <header className="bg-[#020617]/90 border-b border-slate-800/80 text-slate-100 py-2.5 px-3 sm:px-5 sticky top-0 z-50 backdrop-blur-xl shadow-2xl w-full print:hidden">
      <div className="max-w-[1680px] mx-auto flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
        {/* Brand + Editable Project Name */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/pwa-192x192.png"
              alt="ARCH-AI PRO"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-[0_0_16px_rgba(6,182,212,0.4)] border border-cyan-400/40 object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                  ARCH-AI PRO
                </h1>
                <span className="text-[10px] sm:text-xs text-cyan-400 font-medium hidden sm:inline">
                  | AI Architecture Studio
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[260px] sm:max-w-none">
                {pickText(
                  language,
                  'استوديو التصميم المعماري 3D CAD ومولد المخططات',
                  '3D CAD & Générateur de Plans',
                  '3D CAD & Blueprint Generator'
                )}
              </p>
            </div>
          </div>

          {/* Inline Project Name + Save + Undo/Redo + Projects */}
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="text"
              value={projectName}
              onChange={(e) => onChangeProjectName(e.target.value)}
              aria-label="Project Name"
              className="bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white w-36 sm:w-44 focus:outline-none"
            />

            <button
              type="button"
              onClick={onSaveProject}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                justSaved
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-cyan-300'
              }`}
              title="Save Project"
            >
              {justSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {justSaved ? pickText(language, 'محفوظ', 'Sauvé', 'Saved') : pickText(language, 'حفظ', 'Sauver', 'Save')}
              </span>
            </button>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35"
                title={pickText(language, 'تراجع', 'Annuler', 'Undo')}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35"
                title={pickText(language, 'إعادة', 'Rétablir', 'Redo')}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenProjects}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold"
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">{pickText(language, 'المشاريع', 'Projets', 'Projects')}</span>
            </button>
          </div>
        </div>

        {/* Settings & Export Controls */}
        <div className="flex flex-wrap items-center justify-between xl:justify-end gap-1.5">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-cyan-400 mx-1.5 hidden sm:block" />
            {(['ar', 'fr', 'en'] as AppLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onChangeLanguage(lang)}
                className={`px-2 py-1 rounded-lg font-bold uppercase ${
                  language === lang ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px]">
            {(['m', 'cm'] as MeasurementUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onChangeUnit(u)}
                className={`px-2 py-1 rounded-lg font-bold ${
                  unit === u ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Currency Switcher (DZD default first) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px]">
            {(['DZD', 'SAR', 'USD', 'AED', 'EGP'] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-1.5 sm:px-2 py-1 rounded-lg font-bold ${
                  currency === c ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <PWAInstallButton />

          <button
            type="button"
            onClick={onReset}
            disabled={isGenerating}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            title={pickText(language, 'إعادة ضبط', 'Réinitialiser', 'Reset')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg border border-cyan-400/30 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{pickText(language, 'تصدير / طباعة', 'Exporter / Imprimer', 'Export / Print')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
