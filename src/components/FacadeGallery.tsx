import React, { useState, useEffect } from 'react';
import { Sparkles, Image, Maximize2, RefreshCw, Wand2, Download } from 'lucide-react';
import { GeneratedHousePlan, FacadeImageData } from '../types';

interface FacadeGalleryProps {
  plan: GeneratedHousePlan;
}

export const FacadeGallery: React.FC<FacadeGalleryProps> = ({ plan }) => {
  const [images, setImages] = useState<FacadeImageData[]>(plan.facadeImages || []);
  const [selectedImage, setSelectedImage] = useState<FacadeImageData | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    setImages(plan.facadeImages || []);
  }, [plan]);

  const handleGenerateNewFacade = async () => {
    setIsGeneratingImg(true);
    setGenError(null);
    try {
      const openDirs = (plan.params.openFacadeDirections || ['front']).join(', ');
      const prompt =
        customPrompt.trim() ||
        `Photorealistic ${plan.params.style} architectural villa exterior facade, ${plan.params.length}x${plan.params.width} meters, ${plan.params.floorsCount} floors, ${plan.params.roofType} roof, open facades: ${openDirs}, ${plan.params.wallMaterial || ''}`;
      const res = await fetch('/api/generate-facade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio: '16:9', style: plan.params.style }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        const newImg: FacadeImageData = {
          id: `facade-ai-${Date.now()}`,
          title: customPrompt ? 'واجهة مخصصة جديدة' : 'واجهة معمارية جديدة 3D',
          description: `تصميم معالج بالذكاء الاصطناعي لطراز ${plan.params.style}`,
          url: data.imageUrl,
          prompt,
        };
        setImages((prev) => [newImg, ...prev]);
        setCustomPrompt('');
      } else {
        setGenError(data.error || 'تعذر توليد صورة واجهة جديدة حالياً.');
      }
    } catch (e) {
      console.error('Failed to generate facade image:', e);
      setGenError('حدث خطأ في الاتصال بالخادم لتوليد الواجهة.');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">صور الواجهات المعمارية (AI Renderings)</h3>
            <p className="text-xs text-slate-400">صور ثلاثية الأبعاد وواقعية للواجهات الخارجية والنهارية والليلية</p>
          </div>
        </div>
      </div>

      {/* AI Facade Generator Prompt Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="اكتب وصفاً خاصاً للواجهة التي تريدها (مثال: واجهة حجرية مودرن مع مدخل خشبي وإضاءة دافئة وقشور رخام...)"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
          />
          <button
            onClick={handleGenerateNewFacade}
            disabled={isGeneratingImg}
            className="w-full sm:w-auto shrink-0 py-3 px-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
          >
            {isGeneratingImg ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري التوليد...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>توليد واجهة بالذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Facade Style Prompt Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-semibold ml-1">اقتراحات سريعة للواجهة:</span>
          {[
            'واجهة حجرية مودرن ناصعة البياض مع إضاءات دافئة',
            'واجهة فيلا ليلية مع إضاءات LED سبوت لايت للكتل',
            'مدخل فاخر بأبواب خشبية معتمة ونوافذ بانوراما',
            'واجهة كلاسيكية بأعمدة رخامية وأقواس فرنسية',
            'فيلا مع حديقة ومسبح مضاء وجلسة خارجية عصرية'
          ].map((promptPreset, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => setCustomPrompt(promptPreset)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-[11px] text-cyan-300 rounded-lg transition-all active:scale-95"
            >
              + {promptPreset}
            </button>
          ))}
        </div>
        {genError && (
          <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2">
            {genError}
          </div>
        )}
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-cyan-500/50 transition-all"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-900">
              <img
                src={img.url}
                alt={img.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => setSelectedImage(img)}
                className="absolute top-2 left-2 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                title="تكبير الصورة"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3">
              <h4 className="font-bold text-xs text-white">{img.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{img.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Fullscreen View */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">{selectedImage.title}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-slate-900 text-xs text-slate-300 flex items-center justify-between">
              <p>{selectedImage.description}</p>
              <a
                href={selectedImage.url}
                download="facade-render.jpg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل الصورة</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
