import React, { useMemo, useState } from 'react';
import { Printer, X, Building2, FileCode2, Image as ImageIcon } from 'lucide-react';
import { AppLanguage, Currency, GeneratedHousePlan, MeasurementUnit } from '../types';
import { generateBlueprintSVGString } from './Blueprint2DCanvas';
import { compute12StageCostBreakdown, CURRENCY_MULTIPLIER_FROM_DZD } from '../utils/costEstimator';
import { pickText } from '../utils/i18n';

interface PrintReportModalProps {
  plan: GeneratedHousePlan;
  currency: Currency;
  projectName?: string;
  unit?: MeasurementUnit;
  language?: AppLanguage;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  plan,
  currency,
  projectName,
  unit = 'm',
  language = 'ar',
  onClose,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [activeFloor, setActiveFloor] = useState<number>(0);

  const specs = plan.specs;
  const svgString = useMemo(
    () => generateBlueprintSVGString(plan, activeFloor, unit),
    [plan, activeFloor, unit]
  );
  const svgDataUri = useMemo(
    () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
    [svgString]
  );
  const cost = useMemo(() => compute12StageCostBreakdown(plan), [plan]);
  const curr = CURRENCY_MULTIPLIER_FROM_DZD[currency] || CURRENCY_MULTIPLIER_FROM_DZD.DZD;

  const handlePrintAction = () => {
    window.print();
  };

  const handleExportSVG = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-${plan.params.style}-floor-${activeFloor}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHighResPNG = () => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1632;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `blueprint-hd-${plan.params.style}-floor-${activeFloor}.png`;
      a.click();
    };
    img.src = svgDataUri;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <style>{`@media print { @page { size: ${paperSize} ${orientation}; margin: 10mm; } }`}</style>
      <div className="relative max-w-5xl w-full max-h-[94vh] overflow-y-auto bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 my-auto">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 print:hidden sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm">
              {pickText(language, 'استوديو الطباعة والتصدير الهندسي (Blueprint Export)', 'Export & Impression Plans', 'Blueprint Print & Export Studio')}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* Paper Size */}
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              {(['A4', 'A3'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPaperSize(sz)}
                  className={`px-2 py-1 rounded font-bold ${paperSize === sz ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Orientation */}
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2 py-1 rounded font-bold ${orientation === 'portrait' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
              >
                {pickText(language, 'طولي', 'Portrait', 'Portrait')}
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2 py-1 rounded font-bold ${orientation === 'landscape' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
              >
                {pickText(language, 'عرضي', 'Paysage', 'Landscape')}
              </button>
            </div>

            {/* Floor Selector */}
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              {Array.from({ length: plan.params.floorsCount || 1 }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveFloor(idx)}
                  className={`px-2 py-1 rounded font-bold ${activeFloor === idx ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  F{idx}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportSVG}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 rounded-lg font-bold"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>SVG</span>
            </button>

            <button
              type="button"
              onClick={handleExportHighResPNG}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-bold"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>PNG HD</span>
            </button>

            <button
              onClick={handlePrintAction}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>{pickText(language, 'طباعة / PDF', 'Imprimer / PDF', 'Print / PDF')}</span>
            </button>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Engineering Sheet */}
        <div className="p-5 sm:p-8 space-y-5 font-sans bg-white text-slate-900">
          {/* Title Block */}
          <div className="border-4 border-slate-900 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                ARCH-AI PRO • {paperSize} {orientation.toUpperCase()} ENGINEERING SHEET
              </span>
              <h1 className="text-xl font-black text-slate-900">{projectName || specs.title}</h1>
              <p className="text-xs text-slate-600">
                Lot: {plan.params.length}m × {plan.params.width}m ({specs.totalLandArea} m²) | Built: {specs.totalBuiltArea} m² | Floor: {activeFloor}
              </p>
            </div>
            <div className="border-r-2 border-slate-900 pr-4 space-y-0.5 text-xs">
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Style:</strong> {plan.params.style}</div>
              <div><strong>Est. Cost:</strong> {Math.round(cost.totalMidDZD * curr.factor).toLocaleString()} {curr.symbol}</div>
            </div>
          </div>

          {/* Embedded Vector Blueprint SVG Sheet */}
          <div className="border-2 border-slate-900 rounded-xl overflow-hidden bg-[#020617]">
            <img src={svgDataUri} alt="Architectural Blueprint Sheet" className="w-full h-auto block" />
          </div>

          {/* Key Architectural Specs */}
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
              <div className="text-slate-500 font-bold mb-1">Built Area</div>
              <div className="text-base font-black text-blue-900">{specs.totalBuiltArea} m²</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
              <div className="text-slate-500 font-bold mb-1">Columns</div>
              <div className="text-base font-black text-rose-900">{plan.columns.length}</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
              <div className="text-slate-500 font-bold mb-1">Concrete Est.</div>
              <div className="text-base font-black text-slate-900">{cost.quantities.concreteM3} m³</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
              <div className="text-slate-500 font-bold mb-1">Steel Est.</div>
              <div className="text-base font-black text-emerald-900">{cost.quantities.steelTons} T</div>
            </div>
          </div>

          {/* Rooms Distribution Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 border-b-2 border-slate-900 pb-1">
              {pickText(language, 'جدول بيان الفضاءات والغرف', 'Nomenclature des Pièces', 'Rooms Schedule')}
            </h3>
            <table className="w-full text-right text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Room</th>
                  <th className="p-2 border-r border-slate-300">Floor</th>
                  <th className="p-2 border-r border-slate-300">Dimensions (m)</th>
                  <th className="p-2 border-r border-slate-300">Area (m²)</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {plan.rooms.map((r, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{r.nameAr}</td>
                    <td className="p-2 border-r border-slate-300">F{r.floor}</td>
                    <td className="p-2 border-r border-slate-300 font-mono">{r.width} × {r.length}</td>
                    <td className="p-2 border-r border-slate-300 font-bold">{r.area} m²</td>
                    <td className="p-2 text-slate-600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sign & Preliminary Disclaimer Footer */}
          <div className="border-2 border-slate-900 rounded-xl p-3.5 flex items-center justify-between text-xs font-bold text-slate-700">
            <div>
              <span>ARCH-AI PRO • AI Architecture Studio</span>
              <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                Preliminary architectural concept & quantities. Must be stamped by a licensed local engineer prior to construction.
              </div>
            </div>
            <div className="w-36 border-b border-dashed border-slate-900 text-center pb-1 text-[10px] text-slate-400">
              Architect / Engineer Stamp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
