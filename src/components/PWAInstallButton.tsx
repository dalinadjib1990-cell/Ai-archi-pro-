import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { canInstallNative, isIOS, isInstalled, promptInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (canInstallNative) {
      await promptInstall();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
        title="إضافة اختصار التطبيق إلى الشاشة الرئيسية للهاتف"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span>تثبيت على الهاتف</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="ARCH-AI PRO"
                  className="w-11 h-11 rounded-xl border border-cyan-500/40 object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">إضافة اختصار ARCH-AI PRO</h4>
                  <p className="text-[11px] text-slate-400">تشغيل سريع كـتطبيق مستقل على هاتفك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-slate-200 leading-relaxed">
                <li className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <Share className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>1. اضغط على أيقونة المشاركة (Share) في متصفح سفاري أسفل الشاشة.</span>
                </li>
                <li className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen) ثم «إضافة».</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-slate-200 leading-relaxed">
                <li className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. افتح قائمة المتصفح (⋮) أعلى الشاشة في Chrome أو Edge.</span>
                </li>
                <li className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <PlusSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>2. اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» ليظهر بالأيقونة المخصصة.</span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
