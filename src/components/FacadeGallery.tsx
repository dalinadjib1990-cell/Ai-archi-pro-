import React, { useState, useEffect } from 'react';
import { Image, Maximize2, Wand2, Download, Compass, Palette } from 'lucide-react';
import {
  AppLanguage,
  ArchitecturalStyle,
  FacadeImageData,
  GeneratedHousePlan,
} from '../types';
import { pickText } from '../utils/i18n';

interface FacadeGalleryProps {
  plan: GeneratedHousePlan;
  onUpdatePlan?: (updated: GeneratedHousePlan) => void;
  language?: AppLanguage;
}

const ELEVATION_VIEWS = [
  { id: 'front' as const, ar: 'الواجهة الأمامية (Front)', fr: 'Façade Avant', en: 'Front Elevation' },
  { id: 'back' as const, ar: 'الواجهة الخلفية (Back)', fr: 'Façade Arrière', en: 'Rear Elevation' },
  { id: 'left' as const, ar: 'الواجهة اليسرى (Left)', fr: 'Façade Gauche', en: 'Left Elevation' },
  { id: 'right' as const, ar: 'الواجهة اليمنى (Right)', fr: 'Façade Droite', en: 'Right Elevation' },
];

const FACADE_STYLE_PRESETS: Array<{
  id: ArchitecturalStyle;
  ar: string;
  fr: string;
  en: string;
  wallColor: string;
  accentColor: string;
}> = [
  { id: 'modern', ar: 'عصري', fr: 'Moderne', en: 'Modern', wallColor: '#f8fafc', accentColor: '#0f172a' },
  { id: 'minimalist', ar: 'مينيمال', fr: 'Minimaliste', en: 'Minimalist', wallColor: '#e2e8f0', accentColor: '#334155' },
  { id: 'classic', ar: 'كلاسيك', fr: 'Classique', en: 'Classic', wallColor: '#fef3c7', accentColor: '#78350f' },
  { id: 'mediterranean', ar: 'متوسطي', fr: 'Méditerranéen', en: 'Mediterranean', wallColor: '#fffbeb', accentColor: '#b45309' },
  { id: 'algerian', ar: 'جزائري حديث', fr: 'Algérien Moderne', en: 'Algerian Modern', wallColor: '#f8fafc', accentColor: '#92400e' },
  { id: 'luxury', ar: 'فيلا فاخرة', fr: 'Villa Luxe', en: 'Luxury Villa', wallColor: '#f1f5f9', accentColor: '#1e293b' },
  { id: 'industrial', ar: 'صناعي', fr: 'Industriel', en: 'Industrial', wallColor: '#475569', accentColor: '#18181b' },
];

export const FacadeGallery: React.FC<FacadeGalleryProps> = ({
  plan,
  onUpdatePlan,
  language = 'ar',
}) => {
  const [images, setImages] = useState<FacadeImageData[]>(plan.facadeImages || []);
  const [selectedImage, setSelectedImage] = useState<FacadeImageData | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [genError, setGenError] = useState<string | null>(null);
  const [activeElevation, setActiveElevation] = useState<'front' | 'back' | 'left' | 'right'>('front');

  useEffect(() => {
    setImages(plan.facadeImages || []);
  }, [plan]);

  const applyFacadeStyle = (st: typeof FACADE_STYLE_PRESETS[number]) => {
    if (!onUpdatePlan) return;
    onUpdatePlan({
      ...plan,
      params: {
        ...plan.params,
        style: st.id,
        facadeWallColor: st.wallColor,
        accentColor: st.accentColor,
      },
      materials: {
        ...plan.materials,
        exteriorWallColor: st.wallColor,
      },
    });
  };

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
          title: customPrompt ? pickText(language, 'واجهة مخصصة', 'Façade personnalisée', 'Custom Facade') : `${plan.params.style.toUpperCase()} 3D Render`,
          description: `${plan.params.length}×${plan.params.width}m • ${plan.params.floorsCount}F • ${plan.params.style}`,
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

  // Parametric SVG Architectural Elevation synced to live building dimensions & openings
  const L = plan.params.length || 15;
  const W = plan.params.width || 10;
  const floors = Math.max(1, plan.params.floorsCount || 1);
  const elevSpanM = activeElevation === 'front' || activeElevation === 'back' ? L : W;
  const wallH = 3.2;
  const totalH = floors * wallH + (plan.params.roofType === 'sloped' ? 1.8 : 0.75);
  const openDirs = plan.params.openFacadeDirections || ['front', 'left'];
  const isOpenSide = openDirs.includes(activeElevation);
  const wallHex = plan.params.facadeWallColor || plan.materials.exteriorWallColor || '#f8fafc';
  const accentHex = plan.params.accentColor || '#92400e';

  const svgW = 720;
  const svgH = 300;
  const scale = Math.min((svgW - 120) / elevSpanM, (svgH - 70) / totalH);
  const bPxW = elevSpanM * scale;
  const bPxX = (svgW - bPxW) / 2;
  const groundY = svgH - 36;
  const bodyH = floors * wallH * scale;
  const bodyTopY = groundY - bodyH;

  // Map openings on this elevation side
  const sideOpenings = plan.openings.filter((op) => {
    if (activeElevation === 'front') return op.y > W * 0.78 && (op.rotation === 0 || op.rotation === 180);
    if (activeElevation === 'back') return op.y < W * 0.22 && (op.rotation === 0 || op.rotation === 180);
    if (activeElevation === 'left') return op.x < L * 0.22 && (op.rotation === 90 || op.rotation === 270);
    return op.x > L * 0.78 && (op.rotation === 90 || op.rotation === 270);
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {pickText(language, 'استوديو الواجهات والرفع المعماري (Facade Generator)', 'Générateur de Façades & Élévations', 'Facade Generator & Elevation Studio')}
            </h3>
            <p className="text-xs text-slate-400">
              {pickText(language, 'مساقط واجهات هندسية حية مرتبطة بأبعادك + توليد تصاميم واقعية بالذكاء الاصطناعي', 'Élévations paramétriques + rendus IA', 'Dimension-synced architectural elevations + AI photorealistic renders')}
            </p>
          </div>
        </div>
      </div>

      {/* Live Facade Style & Material Switcher */}
      {onUpdatePlan && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Palette className="w-4 h-4" />
            <span>{pickText(language, 'تبديل نمط الواجهة فوراً (ينعكس على 3D والرفع الهندسي)', 'Style de Façade instantané', 'Instant Facade Style Switcher')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FACADE_STYLE_PRESETS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => applyFacadeStyle(st)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  plan.params.style === st.id
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: st.wallColor }} />
                <span>{pickText(language, st.ar, st.fr, st.en)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parametric Elevation CAD Preview (Front / Back / Left / Right) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{pickText(language, 'الرفع المعماري الهندسي للواجهات (2D Elevations)', 'Élévations Architecturales', 'Parametric 2D Architectural Elevations')}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {ELEVATION_VIEWS.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setActiveElevation(ev.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  activeElevation === ev.id
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pickText(language, ev.ar, ev.fr, ev.en)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#020617]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto block">
            <rect width="100%" height="100%" fill="#020617" />
            {/* Ground line */}
            <line x1="30" y1={groundY} x2={svgW - 30} y2={groundY} stroke="#10b981" strokeWidth="2" />
            {/* Main facade mass */}
            <rect
              x={bPxX}
              y={bodyTopY}
              width={bPxW}
              height={bodyH}
              fill={wallHex}
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Floor slab lines & Balcony ledges */}
            {Array.from({ length: floors }).map((_, f) => {
              const fy = groundY - (f + 1) * wallH * scale;
              return (
                <g key={f}>
                  <line x1={bPxX - 4} y1={fy} x2={bPxX + bPxW + 4} y2={fy} stroke={accentHex} strokeWidth="3" />
                  {f > 0 && plan.params.hasBalcony && isOpenSide && (
                    <rect
                      x={bPxX + bPxW * 0.2}
                      y={groundY - f * wallH * scale - 1.05 * scale}
                      width={bPxW * 0.6}
                      height={1.05 * scale}
                      fill="#38bdf844"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}
            {/* Roof */}
            {plan.params.roofType === 'sloped' ? (
              <polygon
                points={`${bPxX - 8},${bodyTopY} ${bPxX + bPxW / 2},${bodyTopY - 1.8 * scale} ${bPxX + bPxW + 8},${bodyTopY}`}
                fill={plan.materials.roofColor || '#991b1b'}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            ) : (
              <rect
                x={bPxX - 4}
                y={bodyTopY - 0.65 * scale}
                width={bPxW + 8}
                height={0.65 * scale}
                fill={plan.materials.roofColor || '#1e293b'}
                stroke="#38bdf8"
                strokeWidth="1"
              />
            )}
            {/* Dimensioned Windows & Doors only on Open Facades */}
            {isOpenSide ? (
              sideOpenings.map((op) => {
                const posAlong = activeElevation === 'front' || activeElevation === 'back' ? op.x : op.y;
                const ox = bPxX + Math.max(0.2, Math.min(elevSpanM - op.width - 0.2, posAlong)) * scale;
                const ow = op.width * scale;
                const floorBottom = groundY - op.floor * wallH * scale;
                if (op.type === 'door') {
                  const dh = 2.2 * scale;
                  return (
                    <rect
                      key={op.id}
                      x={ox}
                      y={floorBottom - dh}
                      width={ow}
                      height={dh}
                      fill={accentHex}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                    />
                  );
                }
                const wh = 1.35 * scale;
                return (
                  <rect
                    key={op.id}
                    x={ox}
                    y={floorBottom - 2.35 * scale}
                    width={ow}
                    height={wh}
                    fill="#38bdf8aa"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                  />
                );
              })
            ) : (
              <text
                x={svgW / 2}
                y={bodyTopY + bodyH / 2}
                fill="#ef4444"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
              >
                {pickText(language, 'جدار جار أصم (بدون نوافذ)', 'Mur mitoyen aveugle', 'Closed Neighbor Party Wall (No Windows)')}
              </text>
            )}
            {/* Elevation Dimension Callout */}
            <text x={svgW / 2} y={svgH - 12} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
              {`${activeElevation.toUpperCase()} ELEVATION | Width: ${elevSpanM}m | Height: ${(floors * wallH).toFixed(1)}m | Style: ${plan.params.style}`}
            </text>
          </svg>
        </div>
      </div>

      {/* AI Facade Generator Prompt Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={pickText(
              language,
              'اكتب وصفاً خاصاً للواجهة (مثال: واجهة حجرية مودرن مع مدخل خشبي وإضاءة دافئة...)',
              'Décrivez la façade souhaitée...',
              'Describe a custom facade render (e.g. modern limestone facade with warm LED accents)...'
            )}
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
                <span>{pickText(language, 'جاري التوليد...', 'Génération...', 'Rendering...')}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>{pickText(language, 'توليد واجهة بالذكاء الاصطناعي', 'Générer Rendu IA', 'Generate AI Facade')}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-semibold ml-1">
            {pickText(language, 'اقتراحات سريعة:', 'Suggestions:', 'Quick Presets:')}
          </span>
          {[
            'واجهة حجرية مودرن ناصعة البياض مع إضاءات دافئة',
            'واجهة فيلا جزائرية حديثة مع أقواس وقرميد قرمزي',
            'مدخل فاخر بأبواب خشبية ونوافذ بانوراما',
            'واجهة كلاسيكية بأعمدة رخامية',
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

      {/* Rendered AI Images Grid */}
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
                title="Expand"
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

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">{selectedImage.title}</h3>
              <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
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
                <span>{pickText(language, 'تحميل الصورة', 'Télécharger', 'Download')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
