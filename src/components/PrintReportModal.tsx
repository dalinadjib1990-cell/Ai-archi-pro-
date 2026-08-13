import React from 'react';
import { Printer, X, Building2, CheckCircle2 } from 'lucide-react';
import { GeneratedHousePlan, Currency } from '../types';

interface PrintReportModalProps {
  plan: GeneratedHousePlan;
  currency: Currency;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ plan, currency, onClose }) => {
  const handlePrintAction = () => {
    window.print();
  };

  const specs = plan.specs;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative max-w-4xl w-full max-h-[94vh] overflow-y-auto bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 my-auto">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between border-b border-slate-800 print:hidden sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm">معاينة ورقة الترسيم والمخطط القابل للطباعة</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAction}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة / حفظ PDF</span>
              <span className="sm:hidden">طباعة</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Blueprint Page Body */}
        <div className="p-4 sm:p-8 space-y-6 font-sans dir-rtl bg-white text-slate-900 overflow-x-auto">
          {/* Engineering Title Block Header */}
          <div className="border-4 border-slate-900 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">مخطط تسليم استشاري ومعماري</span>
              <h1 className="text-xl font-black text-slate-900">{specs.title}</h1>
              <p className="text-xs text-slate-600">الأبعاد: {plan.params.length}م × {plan.params.width}م | المساحة: {specs.totalLandArea} م²</p>
            </div>
            <div className="text-left border-r-2 border-slate-900 pr-4 space-y-0.5 text-xs">
              <div><strong>تاريخ الإصدار:</strong> {new Date().toLocaleDateString('ar-SA')}</div>
              <div><strong>الطراز:</strong> {plan.params.style}</div>
              <div><strong>عدد الأعمدة:</strong> {specs.recommendedColumnsCount} عموداً</div>
            </div>
          </div>

          {/* Key Architectural Specs */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
              <div className="text-slate-500 font-bold mb-1">مساحة البناء الإجمالية</div>
              <div className="text-lg font-black text-blue-900">{specs.totalBuiltArea} م²</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
              <div className="text-slate-500 font-bold mb-1">الخرسانة المسلحة المتوقعة</div>
              <div className="text-lg font-black text-slate-900">{specs.estimatedConcreteM3} م³</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
              <div className="text-slate-500 font-bold mb-1">حديد التسليح المتوقع</div>
              <div className="text-lg font-black text-emerald-900">{specs.estimatedSteelTons} طن</div>
            </div>
          </div>

          {/* Rooms Distribution Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 border-b-2 border-slate-900 pb-1">جدول بيان وتقسيم الفضاءات والغرف:</h3>
            <table className="w-full text-right text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">اسم الغرفة / الفضاء</th>
                  <th className="p-2 border-r border-slate-300">الطابق</th>
                  <th className="p-2 border-r border-slate-300">الأبعاد (م)</th>
                  <th className="p-2 border-r border-slate-300">المساحة (م²)</th>
                  <th className="p-2">الوصف والاستعمال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {plan.rooms.map((r, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{r.nameAr}</td>
                    <td className="p-2 border-r border-slate-300">{r.floor === 0 ? 'الأرضي' : 'الأول'}</td>
                    <td className="p-2 border-r border-slate-300 font-mono">{r.width} × {r.length}</td>
                    <td className="p-2 border-r border-slate-300 font-bold">{r.area} م²</td>
                    <td className="p-2 text-slate-600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Engineering Sign Block Footer */}
          <div className="border-2 border-slate-900 rounded-xl p-4 flex items-center justify-between text-xs font-bold text-slate-700 mt-8">
            <div>
              <span>اعتماد الاستشاري الإنشائي والذكاء الاصطناعي</span>
              <div className="text-[10px] text-slate-500 font-normal mt-1">تطبيق المهندس المعماري الذكي 3D - AI Studio Build</div>
            </div>
            <div className="w-32 border-b border-dashed border-slate-900 text-center pb-1 text-[10px] text-slate-400">
              ختم واعتماد المهندس
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
