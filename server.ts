import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  normalizeOpenFacades,
  generateMultipleProceduralOptions,
  buildPlanGeometryFromRooms,
  buildStyleFacadeImages
} from './src/utils/proceduralGenerator';
import type { ArchitecturalStyle, HouseInputParams, RoomData, RoofType } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS middleware for multi-domain access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy initialize Gemini AI client (strictly server-side)
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing. Generative features will use deterministic facade-aware procedural engine.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Deterministic spatial de-overlapping & boundary clamping for AI-generated rooms.
 * Ensures rooms remain inside [0.25, L - 0.25] x [0.25, W - 0.25] and never overlap on the same floor.
 */
function sanitizeAndDeoverlapRooms(rawRooms: any[], L: number, W: number, floors: number): RoomData[] {
  const pad = 0.25;
  const minX = pad;
  const minY = pad;
  const maxW = L - pad * 2;
  const maxL = W - pad * 2;

  const parsed: RoomData[] = (rawRooms || []).map((r: any, rIdx: number) => {
    const rw = Number(Math.max(1.6, Math.min(maxW * 0.85, Number(r.width) || 3.6)).toFixed(1));
    const rl = Number(Math.max(1.6, Math.min(maxL * 0.85, Number(r.length) || 3.4)).toFixed(1));
    const rx = Number(Math.max(minX, Math.min(L - pad - rw, Number(r.x) || minX)).toFixed(1));
    const ry = Number(Math.max(minY, Math.min(W - pad - rl, Number(r.y) || minY)).toFixed(1));
    const rFloor = Math.max(0, Math.min(floors - 1, Math.round(Number(r.floor) || 0)));

    const rawCat = String(r.category || '').toLowerCase();
    const category: RoomData['category'] =
      rawCat === 'bedroom' || rawCat === 'bathroom' || rawCat === 'kitchen' || rawCat === 'garage' || rawCat === 'hall' || rawCat === 'outdoor' || rawCat === 'balcony' || rawCat === 'living'
        ? (rawCat as RoomData['category'])
        : r.nameAr?.includes('نوم') || r.nameAr?.includes('ماستر')
        ? 'bedroom'
        : r.nameAr?.includes('حمام') || r.nameAr?.includes('مغاسل')
        ? 'bathroom'
        : r.nameAr?.includes('مطبخ')
        ? 'kitchen'
        : r.nameAr?.includes('كراج') || r.nameAr?.includes('مرآب')
        ? 'garage'
        : r.nameAr?.includes('درج') || r.nameAr?.includes('بهو')
        ? 'hall'
        : r.nameAr?.includes('شرفة') || r.nameAr?.includes('تراس')
        ? 'balcony'
        : r.nameAr?.includes('حديقة') || r.nameAr?.includes('فناء') || r.nameAr?.includes('وسط الدار')
        ? 'outdoor'
        : 'living';

    return {
      id: r.id || `ai-r-${rIdx + 1}`,
      nameAr: r.nameAr || `فضاء ${rIdx + 1}`,
      nameEn: r.nameEn || category,
      width: rw,
      length: rl,
      area: Number((rw * rl).toFixed(1)),
      floor: rFloor,
      color:
        r.color ||
        (category === 'bedroom'
          ? '#6366f1'
          : category === 'bathroom'
          ? '#06b6d4'
          : category === 'kitchen'
          ? '#f59e0b'
          : category === 'garage'
          ? '#64748b'
          : category === 'hall'
          ? '#475569'
          : category === 'outdoor'
          ? '#10b981'
          : category === 'balcony'
          ? '#ec4899'
          : '#8b5cf6'),
      description: r.description || `فضاء ${r.nameAr || 'معماري'} مصمم عبر Gemini 4 Hydrogen.`,
      x: rx,
      y: ry,
      category,
    };
  });

  // Resolve any pairwise overlap per floor cleanly by shifting or trimming within bounds
  for (let f = 0; f < floors; f++) {
    const floorList = parsed.filter((rm) => rm.floor === f);
    for (let i = 0; i < floorList.length; i++) {
      for (let j = i + 1; j < floorList.length; j++) {
        const a = floorList[i];
        const b = floorList[j];
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.length, b.y + b.length) - Math.max(a.y, b.y);
        if (overlapX > 0.2 && overlapY > 0.2) {
          // Shift b away along axis with smaller penetration if space allows, else trim
          if (overlapX <= overlapY) {
            const pushRight = Number((a.x + a.width).toFixed(1));
            if (pushRight + 1.8 <= L - pad) {
              b.x = pushRight;
              b.width = Number(Math.min(b.width, L - pad - b.x).toFixed(1));
            } else {
              const pushLeft = Number(Math.max(minX, a.x - b.width).toFixed(1));
              b.x = pushLeft;
              b.width = Number(Math.max(1.5, Math.min(b.width, a.x - b.x)).toFixed(1));
            }
          } else {
            const pushDown = Number((a.y + a.length).toFixed(1));
            if (pushDown + 1.8 <= W - pad) {
              b.y = pushDown;
              b.length = Number(Math.min(b.length, W - pad - b.y).toFixed(1));
            } else {
              const pushUp = Number(Math.max(minY, a.y - b.length).toFixed(1));
              b.y = pushUp;
              b.length = Number(Math.max(1.5, Math.min(b.length, a.y - b.y)).toFixed(1));
            }
          }
          b.area = Number((b.width * b.length).toFixed(1));
        }
      }
    }
  }

  return parsed;
}

/**
 * Enriches Gemini 4 Hydrogen architectural options with deterministic CAD walls,
 * structural columns, facade-respecting openings (no windows on blind neighbor walls),
 * furniture, and local architectural facade previews.
 */
function enrichGeminiOptions(rawOptions: any[], params: HouseInputParams, modelName: string) {
  const L = Math.max(6, Math.min(60, Number(params.length) || 15));
  const W = Math.max(5, Math.min(50, Number(params.width) || 10));
  const area = Number((L * W).toFixed(1));
  const floors = Math.max(1, Math.min(4, Number(params.floorsCount) || 1));
  const style: ArchitecturalStyle = params.style || 'modern';
  const roofType: RoofType = params.roofType || 'flat';
  const bedroomsCount = Math.max(1, Number(params.bedroomsCount) || 3);
  const openDirs = normalizeOpenFacades(params);

  const normalizedParams: HouseInputParams = {
    ...params,
    facadesCount: openDirs.length,
    openFacadeDirections: openDirs,
  };

  return rawOptions.map((opt, idx) => {
    const validRooms = sanitizeAndDeoverlapRooms(opt.rooms || [], L, W, floors);
    const { walls, columns, openings, furniture } = buildPlanGeometryFromRooms(validRooms, normalizedParams);

    const sumRoomsArea = validRooms.reduce((acc, r) => acc + (r.area || 0), 0);
    const totalBuiltArea = Number(Math.max(area * floors * 0.72, sumRoomsArea * 1.12).toFixed(1));
    const costPerM2 =
      style === 'luxury' ? 850 :
      style === 'algerian' || style === 'andalusian' ? 640 :
      style === 'classic' ? 620 :
      style === 'economic' ? 380 : 520;
    const costMin = Math.round(totalBuiltArea * costPerM2 * 0.9);
    const costMax = Math.round(totalBuiltArea * costPerM2 * 1.25);

    return {
      id: `ai-plan-opt-${idx}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'gemini' as const,
      aiModel: modelName,
      optionTitle: opt.optionTitle || `الخيار 0${idx + 1}`,
      optionBadge: opt.optionBadge || `Gemini 4 Hydrogen ✨`,
      optionDescription: opt.optionDescription || opt.summary || `توزيع معماري ذكي لقطعة أرض ${L}×${W}م وفق الواجهات المفتوحة.`,
      params: normalizedParams,
      specs: {
        title: `${opt.optionTitle || `الخيار 0${idx + 1}`} (${L}م × ${W}م - ${openDirs.length} واجهات)`,
        summary: opt.summary || opt.optionDescription || `تصميم معماري بواسطة ${modelName} (${bedroomsCount} غرف نوم، ${floors} طوابق).`,
        totalLandArea: area,
        totalBuiltArea,
        buildingFootprintArea: Number((area * 0.85).toFixed(1)),
        recommendedColumnsCount: columns.length,
        columnsReasoning: opt.columnsReasoning || `شبكة أعمدة خرسانية منتظمة (${columns.length} عمود) بمسافات تحمّل هندسية آمنة.`,
        orientationNotes: opt.orientationNotes || `توزيع الغرف الرئيسية والنوافذ حصرياً نحو الواجهات المفتوحة (${openDirs.join('، ')}) وعزل الجدران الجارية.`,
        ventilationNotes: opt.ventilationNotes || 'توزيع متوازن للفتحات والفناء لتأمين مسارات تهوية متقاطعة داخل المنزل.',
        structuralNotes: opt.structuralNotes || `هيكل خرساني مسلح متين بسقف ${roofType === 'sloped' ? 'مائل بالقرميد' : 'مسطح مع سترة'}.`,
        estimatedCostMin: opt.estimatedCostMin || costMin,
        estimatedCostMax: opt.estimatedCostMax || costMax,
        currency: 'SAR' as const,
        estimatedConcreteM3: Math.round(totalBuiltArea * 0.44),
        estimatedSteelTons: Number((totalBuiltArea * 0.046).toFixed(1)),
        estimatedBricksCount: Math.round(totalBuiltArea * 33),
      },
      rooms: validRooms,
      walls,
      columns,
      openings,
      furniture,
      materials: {
        exteriorWallColor: params.facadeWallColor || (style === 'algerian' || style === 'traditional' ? '#fef3c7' : '#f8fafc'),
        interiorWallColor: '#f8fafc',
        roofColor: roofType === 'sloped' ? (style === 'algerian' ? '#b91c1c' : '#7f1d1d') : '#334155',
        windowFrameColor: '#0f172a',
        floorMaterial: style === 'luxury' ? 'رخام فاخر' : 'سيراميك وبورسلان نخب أول',
      },
      facadeImages: buildStyleFacadeImages(style, roofType, L, W, openDirs, normalizedParams, `f-ai-${idx}`),
    };
  });
}

// Endpoint: AI Generate Plan powered by Gemini 4 Hydrogen
app.post('/api/generate-plan', async (req, res) => {
  try {
    const params: HouseInputParams = req.body;
    const openDirs = normalizeOpenFacades(params);
    const normalizedParams: HouseInputParams = {
      ...params,
      facadesCount: openDirs.length,
      openFacadeDirections: openDirs,
    };

    const ai = getAIClient();

    if (!ai) {
      const fallbackPlans = generateMultipleProceduralOptions(normalizedParams);
      return res.json({ success: true, plans: fallbackPlans, plan: fallbackPlans[0], source: 'procedural' });
    }

    const L = Math.max(6, Math.min(60, Number(params.length) || 15));
    const W = Math.max(5, Math.min(50, Number(params.width) || 10));
    const bedroomsCount = Number(params.bedroomsCount) || 3;
    const bathroomsCount = Number(params.bathroomsCount) || 2;
    const floorsCount = Math.max(1, Math.min(4, Number(params.floorsCount) || 1));
    const livingRoomsCount = Number(params.livingRoomsCount) || 1;
    const kitchensCount = Number(params.kitchensCount) || 1;

    const closedDirs = (['front', 'back', 'left', 'right'] as const).filter((d) => !openDirs.includes(d));
    const dirLabel = (d: string) =>
      d === 'front'
        ? 'الأمامية (y = W، الشارع الرئيسي)'
        : d === 'back'
        ? 'الخلفية (y = 0)'
        : d === 'left'
        ? 'اليسرى (x = 0)'
        : 'اليمنى (x = L)';

    const promptText = `
أنت مهندس معماري وإنشائي استشاري أول وخبير في التوزيع المكاني البارامتري الدقيق.
المطلوب: توليد 3 خيارات معمارية (options) مختلفة هندسياً وواقعياً لقطعة أرض بالمواصفات الدقيقة التالية:
- أبعاد الأرض: الطول X = ${L}م، العرض Y = ${W}م (المساحة = ${L * W} م²).
- عدد الطوابق: ${floorsCount} (من 0 للأرضي حتى ${floorsCount - 1}).
- عدد الواجهات المفتوحة: ${openDirs.length} واجهات فقط!
  * الواجهات المفتوحة (المسموح بها للنوافذ والمداخل): ${openDirs.map(dirLabel).join(' | ')}.
  * الواجهات المغلقة (جدران صماء ملاصقة للجيران — ممنوع وضع نوافذ عليها): ${closedDirs.length ? closedDirs.map(dirLabel).join(' | ') : 'لا يوجد (فيلا حرة 4 واجهات)'}.
- غرف النوم: ${bedroomsCount} غرف (تشمل الماستر + غرف النوم الباقية).
- الحمامات: ${bathroomsCount} | الصالات: ${livingRoomsCount} | المطابخ: ${kitchensCount}.
- مجلس ضيوف: ${params.hasMajlis ? 'نعم' : 'لا'} | مرآب: ${params.hasGarage ? `نعم (${params.garageCapacity || 1} سيارة)` : 'لا'} | حديقة: ${params.hasGarden ? 'نعم' : 'لا'} | شرفة: ${params.hasBalcony ? 'نعم' : 'لا'}.
- درج داخلي: ${params.hasStairs || floorsCount > 1 ? 'نعم' : 'لا'} | فناء داخلي (وسط الدار/منور): ${params.hasCourtyard || openDirs.length <= 2 || params.style === 'algerian' ? 'نعم (أساسي للتهوية عندما تكون الواجهات مغلقة)' : 'اختياري'}.
- مساحة البناء المطلوبة: ${params.targetBuiltArea ? `${params.targetBuiltArea} م²` : 'استغلال أمثل'}.
- نوع السقف: ${params.roofType === 'sloped' ? 'مائل بالقرميد' : 'مسطح مع سترة'}.
- الطراز المعماري والخامة: ${params.style} (${params.wallMaterial || 'بناء قياسي'}).
- ملاحظات العميل: "${params.customNotes || 'توزيع عملي يحترم الخصوصية والإضاءة الطبيعية'}".

قواعد الهندسة والتوزيع غير العشوائي:
1. ضع غرف الاستقبال والمعيشة وغرف النوم والمطابخ بمحاذات الواجهات المفتوحة (${openDirs.join(', ')}) أو حول الفناء/المنور الداخلي.
2. ضع الحمامات والخدمات والدرج بمحاذات الجدران المغلقة (${closedDirs.join(', ') || 'المنتصف'}) كي لا تضيع الواجهات المفتوحة.
3. يُمنع منعاً باتاً تداخل الغرف في نفس الطابق! يجب أن تشغل كل غرفة مستطيلاً مستقلاً تماماً ضمن الحدود:
   0.25 <= x, x + width <= ${L - 0.25}
   0.25 <= y, y + length <= ${W - 0.25}
4. التنويع الفعلي بين الخيارات الثلاثة:
   - الخيار 1: مخطط مفتوح يربط الصالات بالواجهة المفتوحة والفناء.
   - الخيار 2: فصل تام لمجلس الضيوف وخدماته عن فضاءات العائلة.
   - الخيار 3: تنظيم حول فناء/منور داخلي (أو حرف L) يناسب عدد الواجهات المفتوحة بدقة.
5. ${floorsCount === 1 ? 'بما أن المنزل طابق واحد، ضع كل الغرف بما فيها غرف النوم في الطابق 0.' : 'وزّع الاستقبال والمطبخ والمرآب في الطابق 0، وغرف النوم في الطوابق العليا (1 فأعلى)، مع تكرار بئر الدرج في نفس الإحداثيات across الطوابق.'}
`;

    // Primary model: Gemini 4 Hydrogen (no temperature/topP/topK/thinkingBudget allowed!)
    const modelsToTry = ['gemini-4-hydrogen', 'gemini-2.5-flash'];
    let lastError: any = null;
    let successfulData: any = null;
    let modelUsed = '';

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting architectural generation with ${model}...`);
        const config: any = {
          systemInstruction:
            'أنت مهندس معماري وإنشائي استشاري متخصص في توليد المخططات السكنية الهندسية غير المتداخلة والمحترمة لاتجاهات الواجهات المفتوحة بصيغة JSON عربية دقيقة.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    optionTitle: { type: Type.STRING },
                    optionBadge: { type: Type.STRING },
                    optionDescription: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    orientationNotes: { type: Type.STRING },
                    ventilationNotes: { type: Type.STRING },
                    structuralNotes: { type: Type.STRING },
                    estimatedCostMin: { type: Type.NUMBER },
                    estimatedCostMax: { type: Type.NUMBER },
                    rooms: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          nameAr: { type: Type.STRING },
                          category: { type: Type.STRING },
                          floor: { type: Type.INTEGER },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          width: { type: Type.NUMBER },
                          length: { type: Type.NUMBER },
                          color: { type: Type.STRING },
                          description: { type: Type.STRING },
                        },
                        required: ['nameAr', 'category', 'floor', 'x', 'y', 'width', 'length'],
                      },
                    },
                  },
                  required: ['optionTitle', 'optionBadge', 'optionDescription', 'rooms'],
                },
              },
            },
            required: ['options'],
          },
        };

        if (model === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.MEDIUM };
        }

        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config,
        });

        const jsonString = response.text ? response.text.trim() : '';
        const parsed = JSON.parse(jsonString);

        if (parsed.options && parsed.options.length > 0) {
          successfulData = parsed;
          modelUsed = model === 'gemini-4-hydrogen' ? 'Gemini 4 Hydrogen' : model;
          console.log(`Generation succeeded with ${modelUsed} (${parsed.options.length} options)`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} issue:`, err.message || err);
        lastError = err;
      }
    }

    if (successfulData && successfulData.options) {
      const enrichedPlans = enrichGeminiOptions(successfulData.options, normalizedParams, modelUsed);
      return res.json({
        success: true,
        plans: enrichedPlans,
        plan: enrichedPlans[0],
        source: 'gemini',
        modelUsed,
      });
    }

    console.warn('Gemini generation unavailable, using facade-aware parametric engine:', lastError?.message);
    const fallbackPlans = generateMultipleProceduralOptions(normalizedParams);
    return res.json({
      success: true,
      plans: fallbackPlans,
      plan: fallbackPlans[0],
      source: 'procedural-fallback',
      reason: lastError?.message || 'Service fallback',
    });
  } catch (error: any) {
    console.error('Server error generating plan:', error);
    const fallbackPlans = generateMultipleProceduralOptions(req.body);
    res.json({ success: true, plans: fallbackPlans, plan: fallbackPlans[0], source: 'procedural-fallback' });
  }
});

// Endpoint: AI Facade Image Generator
app.post('/api/generate-facade', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', style = 'modern' } = req.body;
    const ai = getAIClient();

    const localFallback =
      style === 'algerian' || style === 'andalusian' || style === 'mediterranean'
        ? '/images/facades/algerian.jpg'
        : style === 'classic' || style === 'traditional'
        ? '/images/facades/classic.jpg'
        : '/images/facades/modern.jpg';

    if (!ai) {
      return res.json({
        success: true,
        imageUrl: localFallback,
        isFallback: true,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Photorealistic architectural facade rendering: ${prompt}. Realistic daylighting, crisp architectural details, ultra detailed architectural photography, no text or watermarks.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({ success: true, imageUrl, isFallback: false });
      }
      return res.json({ success: true, imageUrl: localFallback, isFallback: true });
    } catch (imgError) {
      console.error('Image generation error:', imgError);
      return res.json({ success: true, imageUrl: localFallback, isFallback: true });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARCH-AI PRO server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
