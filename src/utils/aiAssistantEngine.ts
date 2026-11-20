import {
  ArchitecturalStyle,
  GeneratedHousePlan,
  HouseInputParams,
  RoomData,
} from '../types';
import {
  generateProceduralPlan,
  updatePlanWithModifiedRooms,
} from './proceduralGenerator';

/**
 * Parses a natural-language architectural brief (Arabic, French, or English) into
 * structured HouseInputParams so both AI-enabled and offline/fallback modes generate
 * plans faithful to user text.
 */
export function parseNaturalPromptToParams(
  prompt: string,
  baseParams: HouseInputParams
): HouseInputParams {
  const txt = prompt.trim();
  if (!txt) return baseParams;
  const lower = txt.toLowerCase();
  const next: HouseInputParams = {
    ...baseParams,
    naturalLanguagePrompt: txt,
    customNotes: txt,
  };

  // Detect dimensions L x W (e.g. "15x10", "15×12", "15 على 10")
  const dimMatch = txt.match(/(\d+(?:\.\d+)?)\s*[x×*على]\s*(\d+(?:\.\d+)?)/i);
  if (dimMatch) {
    const a = parseFloat(dimMatch[1]);
    const b = parseFloat(dimMatch[2]);
    if (a >= 5 && a <= 60 && b >= 5 && b <= 50) {
      next.length = Math.max(a, b);
      next.width = Math.min(a, b);
    }
  } else {
    // Detect area e.g. "120 متر" / "120 m2" / "120m²"
    const areaMatch = txt.match(/(\d{2,4})\s*(?:متر|م²|m2|m²|sqm)/i);
    if (areaMatch) {
      const targetArea = parseFloat(areaMatch[1]);
      if (targetArea >= 40 && targetArea <= 1200) {
        next.targetBuiltArea = targetArea;
        if (targetArea > baseParams.length * baseParams.width * 1.15) {
          const singleFloor = targetArea / (next.floorsCount || 1);
          const sideL = Math.max(10, Math.round(Math.sqrt(singleFloor * 1.35)));
          const sideW = Math.max(8, Math.round(singleFloor / sideL) + 1);
          next.length = sideL;
          next.width = sideW;
        }
      }
    }
  }

  // Floors
  if (/طابقين|طابقان|دورين|2\s*(?:floors?|étages?|طوابق)/i.test(lower)) next.floorsCount = 2;
  else if (/3\s*(?:floors?|étages?|طوابق|أدوار)|ثلاث\s*طوابق/i.test(lower)) next.floorsCount = 3;
  else if (/طابق\s*واحد|أرضي\s*فقط|single\s*story|1\s*(?:floor|étage)|plain[-\s]pied/i.test(lower)) next.floorsCount = 1;

  // Bedrooms
  const bedMatch =
    txt.match(/(\d+)\s*(?:غرف?\s*نوم|bedrooms?|chambres?)/i) ||
    txt.match(/(?:ثلاث|3)\s*غرف/i);
  if (bedMatch) {
    const val = bedMatch[1] ? parseInt(bedMatch[1], 10) : 3;
    if (val >= 1 && val <= 10) next.bedroomsCount = val;
  }

  // Bathrooms
  if (/حمامين|حمامان|2\s*(?:bath|salle)|two\s*bath/i.test(lower)) next.bathroomsCount = 2;
  else {
    const bathMatch = txt.match(/(\d+)\s*(?:حمام|حمامات|bathrooms?|salles?\s*de\s*bain)/i);
    if (bathMatch) next.bathroomsCount = Math.max(1, Math.min(8, parseInt(bathMatch[1], 10)));
  }

  // Features
  if (/مرآب|كراج|موقف\s*سيار|garage|parking/i.test(lower)) next.hasGarage = true;
  if (/حديقة|حوش|garden|jardin/i.test(lower)) next.hasGarden = true;
  if (/فناء|وسط\s*الدار|courtyard|patio/i.test(lower)) next.hasCourtyard = true;
  if (/شرفة|تراس|balcon|terrasse/i.test(lower)) next.hasBalcony = true;
  if (/مجلس|ضيوف|majlis|réception/i.test(lower)) next.hasMajlis = true;
  if (/مائل|قرميد|sloped|pitched|tuile/i.test(lower)) next.roofType = 'sloped';
  if (/مسطح|flat\s*roof|toit\s*plat/i.test(lower)) next.roofType = 'flat';

  // Style
  const styleMap: Array<[RegExp, ArchitecturalStyle]> = [
    [/جزائري|algérien|algerian|مغاربي/i, 'algerian'],
    [/عصري|مودرن|modern|moderne/i, 'modern'],
    [/فاخر|لاكشري|luxury|luxe|قصر/i, 'luxury'],
    [/كلاسيك|classic|classique/i, 'classic'],
    [/تقليدي|traditional|traditionnel/i, 'traditional'],
    [/أندلسي|andalusian|andalou/i, 'andalusian'],
    [/متوسطي|mediterranean|méditerranéen/i, 'mediterranean'],
    [/بسيط|مينيمال|minimalist|minimaliste/i, 'minimalist'],
    [/صناعي|industrial|industriel/i, 'industrial'],
    [/اقتصادي|economic|économique/i, 'economic'],
  ];
  for (const [rx, st] of styleMap) {
    if (rx.test(lower)) {
      next.style = st;
      break;
    }
  }

  return next;
}

/**
 * Local Deterministic AI Design Assistant Command Interpreter
 * Handles direct edits on the live GeneratedHousePlan with feasibility checks.
 */
export function applyLocalDesignCommand(
  plan: GeneratedHousePlan,
  rawCommand: string
): {
  updatedPlan: GeneratedHousePlan | null;
  explanation: string;
  applied: boolean;
} {
  const cmd = rawCommand.trim();
  if (!cmd) {
    return { updatedPlan: null, explanation: 'اكتب أمراً معمارياً واضحاً لتنفيذه.', applied: false };
  }
  const lower = cmd.toLowerCase();
  const L = plan.params.length || 15;
  const W = plan.params.width || 10;

  // 1. Resize lot dimensions (e.g. "اجعل الأرض 18 في 12" / "lot 18x12")
  const lotMatch = cmd.match(/(?:أرض|قطعة|lot|terrain).*?(\d+(?:\.\d+)?)\s*[x×*فيعلى]\s*(\d+(?:\.\d+)?)/i);
  if (lotMatch) {
    const nL = Math.max(6, Math.min(60, parseFloat(lotMatch[1])));
    const nW = Math.max(5, Math.min(50, parseFloat(lotMatch[2])));
    const nextParams = { ...plan.params, length: nL, width: nW };
    const updated = generateProceduralPlan(nextParams, 0);
    return {
      updatedPlan: updated,
      applied: true,
      explanation: `تم تعديل أبعاد الأرض إلى ${nL}م × ${nW}م وإعادة توزيع الغرف والهيكل بما يلائم المساحة الجديدة.`,
    };
  }

  // 2. Add Garage
  if (/(?:أضف|إضافة|add|ajouter).*(?:كراج|مرآب|موقف|garage)/i.test(lower)) {
    const already = plan.rooms.some((r) => r.category === 'garage');
    if (already && plan.params.hasGarage) {
      return {
        updatedPlan: null,
        applied: false,
        explanation: 'يوجد مرآب سيارات مسبقاً في المخطط الحالي.',
      };
    }
    const nextParams = { ...plan.params, hasGarage: true, garageCapacity: Math.max(1, plan.params.garageCapacity || 1) };
    const updated = generateProceduralPlan(nextParams, 0);
    return {
      updatedPlan: updated,
      applied: true,
      explanation: 'تمت إضافة مرآب سيارات متكامل على الواجهة الأمامية مع باب أوتوماتيكي ومدخل مباشر.',
    };
  }

  // 3. Add a Floor
  if (/(?:أضف|إضافة|زيادة|add|ajouter).*(?:طابق|دور|floor|étage)/i.test(lower)) {
    const nextFloors = Math.min(4, (plan.params.floorsCount || 1) + 1);
    if (nextFloors === plan.params.floorsCount) {
      return {
        updatedPlan: null,
        applied: false,
        explanation: 'المخطط وصل بالفعل للحد الأقصى (4 طوابق).',
      };
    }
    const updated = generateProceduralPlan(
      { ...plan.params, floorsCount: nextFloors, hasStairs: true },
      0
    );
    return {
      updatedPlan: updated,
      applied: true,
      explanation: `تمت إضافة الطابق رقم ${nextFloors} مع ربط بئر الدرج والأعمدة الإنشائية عبر جميع الطوابق.`,
    };
  }

  // 4. Add Bedroom
  if (/(?:أضف|إضافة|add|ajouter).*(?:غرفة\s*نوم|bedroom|chambre)/i.test(lower)) {
    const nextBeds = Math.min(10, (plan.params.bedroomsCount || 3) + 1);
    const updated = generateProceduralPlan({ ...plan.params, bedroomsCount: nextBeds }, 0);
    return {
      updatedPlan: updated,
      applied: true,
      explanation: `تمت إضافة غرفة نوم جديدة ليصبح الإجمالي ${nextBeds} غرف نوم متوافقة مع الحدود.`,
    };
  }

  // 5. Add Second Bathroom
  if (/(?:أضف|إضافة|add|ajouter).*(?:حمام|bathroom|salle\s*de\s*bain)/i.test(lower)) {
    const nextBaths = Math.min(8, (plan.params.bathroomsCount || 1) + 1);
    const updated = generateProceduralPlan({ ...plan.params, bathroomsCount: nextBaths }, 0);
    return {
      updatedPlan: updated,
      applied: true,
      explanation: `تمت إضافة حمام جديد (إجمالي الحمامات: ${nextBaths}) بمحاذات شبكة الخدمات.`,
    };
  }

  // 6. Enlarge Living Room / Majlis ("وسع الصالون" / "كبر الصالة" / "enlarge living")
  if (/(?:كبّر|كبر|وسّع|وسع|توسيع|enlarge|agrandir).*(?:صالون|صالة|معيشة|living|salon|majlis|مجلس)/i.test(lower)) {
    const living = plan.rooms.find((r) => r.category === 'living');
    if (!living) {
      return { updatedPlan: null, applied: false, explanation: 'لم يتم العثور على صالة لتوسيعها.' };
    }
    const maxExtraW = Math.max(0, Number((L - 0.3 - (living.x + living.width)).toFixed(1)));
    const deltaW = Math.min(1.5, maxExtraW > 0.4 ? maxExtraW : 0);
    const maxExtraL = Math.max(0, Number((W - 0.3 - (living.y + living.length)).toFixed(1)));
    const deltaL = Math.min(1.2, maxExtraL > 0.4 ? maxExtraL : 0);

    if (deltaW < 0.4 && deltaL < 0.4) {
      // Fall back to regenerating with increased living ratio via larger footprint
      const nextLivingW = Number(Math.min(L - 1, living.width + 0.8).toFixed(1));
      const modifiedRooms: RoomData[] = plan.rooms.map((r) =>
        r.id === living.id
          ? {
              ...r,
              x: Math.max(0.25, Math.min(r.x, L - 0.25 - nextLivingW)),
              width: nextLivingW,
              area: Number((nextLivingW * r.length).toFixed(1)),
            }
          : r
      );
      return {
        updatedPlan: updatePlanWithModifiedRooms(plan, modifiedRooms),
        applied: true,
        explanation: `تم توسيع «${living.nameAr}» ليصبح عرضه ${nextLivingW}م مع تحديث الجدران والأثاث.`,
      };
    }

    const modifiedRooms = plan.rooms.map((r) =>
      r.id === living.id
        ? {
            ...r,
            width: Number((r.width + deltaW).toFixed(1)),
            length: Number((r.length + deltaL).toFixed(1)),
            area: Number(((r.width + deltaW) * (r.length + deltaL)).toFixed(1)),
          }
        : r
    );
    return {
      updatedPlan: updatePlanWithModifiedRooms(plan, modifiedRooms),
      applied: true,
      explanation: `تم تكبير «${living.nameAr}» بمقدار (+${deltaW}م × +${deltaL}م) وإعادة حساب الجدران والأثاث.`,
    };
  }

  // 7. Change Roof Type
  if (/(?:سقف|roof|toit).*(?:مائل|قرميد|sloped|pitched|tuile)/i.test(lower)) {
    const updated = generateProceduralPlan({ ...plan.params, roofType: 'sloped' }, 0);
    return {
      updatedPlan: updated,
      applied: true,
      explanation: 'تم تحويل السقف إلى سقف مائل مغطى بالقرميد في المخطط والنموذج 3D.',
    };
  }
  if (/(?:سقف|roof|toit).*(?:مسطح|flat|plat)/i.test(lower)) {
    const updated = generateProceduralPlan({ ...plan.params, roofType: 'flat' }, 0);
    return {
      updatedPlan: updated,
      applied: true,
      explanation: 'تم تحويل السقف إلى سقف مسطح حديث مع سترة حماية.',
    };
  }

  // 8. Change Wall Color or Facade Style
  if (/(?:لون|طلاء|color|couleur|جدار|واجهة|facade|façade)/i.test(lower)) {
    let nextColor = plan.params.facadeWallColor || '#f8fafc';
    let colorLabel = 'أبيض رخامي';
    if (/بيج|كريمي|ذهبي|sand|beige/i.test(lower)) {
      nextColor = '#fef3c7';
      colorLabel = 'بيج دافئ';
    } else if (/رمادي|غرافيت|gray|grey|gris/i.test(lower)) {
      nextColor = '#475569';
      colorLabel = 'رمادي معماري';
    } else if (/حجري|ترابي|stone|pierre/i.test(lower)) {
      nextColor = '#d4a373';
      colorLabel = 'حجر طبيعي';
    } else if (/أبيض|white|blanc/i.test(lower)) {
      nextColor = '#f8fafc';
      colorLabel = 'أبيض ناصع';
    }

    const styleParsed = parseNaturalPromptToParams(cmd, plan.params);
    const updated: GeneratedHousePlan = {
      ...plan,
      params: { ...styleParsed, facadeWallColor: nextColor },
      materials: { ...plan.materials, exteriorWallColor: nextColor },
    };
    return {
      updatedPlan: updated,
      applied: true,
      explanation: `تم تحديث مظهر الواجهة واللون الخارجي إلى (${colorLabel}) مع الطراز (${styleParsed.style}).`,
    };
  }

  // 9. Add Large Panoramic Windows
  if (/(?:نوافذ|شبابيك|نافذة|window|fenêtre)/i.test(lower)) {
    const updatedOpenings = plan.openings.map((op) =>
      op.type === 'window' && op.width < 2.2
        ? { ...op, width: Number(Math.min(2.6, op.width + 0.6).toFixed(2)) }
        : op
    );
    return {
      updatedPlan: { ...plan, openings: updatedOpenings },
      applied: true,
      explanation: 'تم تكبير عرض النوافذ على الواجهات المفتوحة لزيادة الإضاءة الطبيعية البانورامية.',
    };
  }

  // 10. Add Interior Door between rooms
  if (/(?:باب\s*داخلي|أضف\s*باب|add\s*door|ajouter\s*porte)/i.test(lower)) {
    const floorRooms = plan.rooms.filter((r) => r.floor === 0 && r.category !== 'outdoor');
    const targetRoom = floorRooms[0];
    if (!targetRoom) {
      return { updatedPlan: null, applied: false, explanation: 'لا توجد غرف متاحة لإضافة باب.' };
    }
    const newDoor = {
      id: `op-int-ai-${Date.now()}`,
      type: 'door' as const,
      x: Number((targetRoom.x + targetRoom.width / 2 - 0.45).toFixed(2)),
      y: Number((targetRoom.y + targetRoom.length).toFixed(2)),
      width: 0.95,
      rotation: 0,
      label: `باب ${targetRoom.nameAr}`,
      floor: 0,
    };
    return {
      updatedPlan: { ...plan, openings: [...plan.openings, newDoor] },
      applied: true,
      explanation: `تمت إضافة باب داخلي لغرفة «${targetRoom.nameAr}» بعرض 0.95م.`,
    };
  }

  // 11. General style or courtyard toggle
  const reparsed = parseNaturalPromptToParams(cmd, plan.params);
  if (reparsed.style !== plan.params.style || reparsed.hasCourtyard !== plan.params.hasCourtyard || reparsed.hasBalcony !== plan.params.hasBalcony) {
    const updated = generateProceduralPlan(reparsed, 0);
    return {
      updatedPlan: updated,
      applied: true,
      explanation: `تمت إعادة توليد المخطط وفق الطراز والمواصفات المطلوبة (${reparsed.style}).`,
    };
  }

  return {
    updatedPlan: null,
    applied: false,
    explanation:
      'يمكنك تجربة أوامر مثل: «أضف مرآب سيارات»، «أضف طابق»، «أضف غرفة نوم»، «كبّر الصالة»، «اجعل السقف مائل»، «غيّر لون الجدران إلى حجر طبيعي»، أو «اجعل الأرض 18×12».',
  };
}
