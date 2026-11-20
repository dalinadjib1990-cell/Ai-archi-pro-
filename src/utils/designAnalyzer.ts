import { DesignIssue, GeneratedHousePlan, RoomData } from '../types';

/**
 * ANALYZE MY DESIGN:
 * Geometric architectural audit evaluating room sizing, corridors, door overlaps,
 * windowless habitable rooms, kitchen/bathroom adjacency, furniture-door clashes,
 * unused area, and lot coverage/setbacks.
 */
export function analyzeHouseDesign(plan: GeneratedHousePlan): {
  score: number;
  issues: DesignIssue[];
  stats: {
    totalLotArea: number;
    builtFootprint: number;
    coveragePercent: number;
    roomsSumArea: number;
    wastedAreaM2: number;
  };
} {
  const issues: DesignIssue[] = [];
  const L = plan.params.length || 15;
  const W = plan.params.width || 10;
  const totalLotArea = Number((L * W).toFixed(1));
  const builtFootprint = Number((plan.specs.buildingFootprintArea || totalLotArea * 0.85).toFixed(1));
  const groundRooms = plan.rooms.filter((r) => r.floor === 0 && r.category !== 'outdoor');
  const groundRoomsSum = groundRooms.reduce((s, r) => s + (r.area || r.width * r.length), 0);
  const roomsSumArea = Number(
    plan.rooms.reduce((s, r) => s + (r.area || r.width * r.length), 0).toFixed(1)
  );
  const coveragePercent = Math.round((builtFootprint / Math.max(1, totalLotArea)) * 100);
  const wastedAreaM2 = Number(Math.max(0, builtFootprint - groundRoomsSum).toFixed(1));

  // 1. Check undersized rooms & narrow corridors
  for (const rm of plan.rooms) {
    const area = rm.area || Number((rm.width * rm.length).toFixed(1));
    const minSide = Math.min(rm.width, rm.length);

    if (rm.category === 'bedroom' && area < 8.5) {
      issues.push({
        id: `tiny-bed-${rm.id}`,
        severity: 'warning',
        floor: rm.floor,
        targetId: rm.id,
        titleAr: `غرفة نوم صغيرة المساحة: ${rm.nameAr}`,
        titleFr: `Chambre sous-dimensionnée : ${rm.nameAr}`,
        titleEn: `Undersized Bedroom: ${rm.nameAr}`,
        detailAr: `المساحة الحالية ${area} م² (${rm.width}×${rm.length}م) أقل من الحد الموصى به لغرف النوم (9 م²).`,
        detailFr: `Surface actuelle ${area} m² inférieure au minimum conseillé (9 m²).`,
        detailEn: `Current area ${area} m² is below recommended minimum (9 m²).`,
        suggestionAr: 'وسّع عرض أو طول الغرفة إلى 3.0م على الأقل في مفتش الخصائص أو عبر المساعد الذكي.',
        suggestionFr: 'Élargissez la pièce à au moins 3,0 m.',
        suggestionEn: 'Expand room width or length to at least 3.0 m.',
      });
    } else if (rm.category === 'living' && area < 12) {
      issues.push({
        id: `tiny-living-${rm.id}`,
        severity: 'warning',
        floor: rm.floor,
        targetId: rm.id,
        titleAr: `صالة معيشة ضيقة: ${rm.nameAr}`,
        titleFr: `Séjour étroit : ${rm.nameAr}`,
        titleEn: `Compact Living Room: ${rm.nameAr}`,
        detailAr: `المساحة ${area} م² محدودة لاستقبال الجلوس والحركة المريحة.`,
        detailFr: `Surface ${area} m² limitée pour la circulation.`,
        detailEn: `Area ${area} m² may feel tight for seating and circulation.`,
        suggestionAr: 'يُنصح برفع مساحة الصالة إلى 16 م² فأكثر.',
        suggestionFr: 'Augmentez la surface du salon au-delà de 16 m².',
        suggestionEn: 'Consider enlarging the living area to 16+ m².',
      });
    } else if (rm.category === 'kitchen' && area < 5.5) {
      issues.push({
        id: `tiny-kit-${rm.id}`,
        severity: 'warning',
        floor: rm.floor,
        targetId: rm.id,
        titleAr: `مطبخ ضيق: ${rm.nameAr}`,
        titleFr: `Cuisine compacte : ${rm.nameAr}`,
        titleEn: `Small Kitchen: ${rm.nameAr}`,
        detailAr: `المساحة ${area} م² أقل من المقاس العملي لتوزيع التجهيزات (6 م²).`,
        detailFr: `Surface ${area} m² inférieure à 6 m².`,
        detailEn: `Area ${area} m² is below 6 m² recommended for counters.`,
        suggestionAr: 'مدّد عمق المطبخ بمقدار 0.5م لتوفير ممر عمل مريح.',
        suggestionFr: 'Ajoutez 0,5 m de largeur.',
        suggestionEn: 'Increase kitchen width or length by at least 0.5 m.',
      });
    } else if (rm.category === 'hall' && minSide < 1.05) {
      issues.push({
        id: `narrow-hall-${rm.id}`,
        severity: 'error',
        floor: rm.floor,
        targetId: rm.id,
        titleAr: `ممر أو بهو ضيق: ${rm.nameAr}`,
        titleFr: `Couloir trop étroit : ${rm.nameAr}`,
        titleEn: `Narrow Corridor/Hall: ${rm.nameAr}`,
        detailAr: `أقل عرض للممر هو ${minSide}م (الحد الأدنى المريح للحركة 1.10م).`,
        detailFr: `Largeur minimale ${minSide} m (< 1,10 m conseillé).`,
        detailEn: `Minimum width is ${minSide} m (< 1.10 m circulation standard).`,
        suggestionAr: 'ارفع عرض الممر إلى 1.2م لتسهيل مرور الأشخاص والأثاث.',
        suggestionFr: 'Passez la largeur à 1,2 m minimum.',
        suggestionEn: 'Widen corridor to at least 1.2 m.',
      });
    }

    // Check lot bounds violation
    if (rm.x < 0 || rm.y < 0 || rm.x + rm.width > L + 0.05 || rm.y + rm.length > W + 0.05) {
      issues.push({
        id: `oob-${rm.id}`,
        severity: 'error',
        floor: rm.floor,
        targetId: rm.id,
        titleAr: `تجاوز حدود قطعة الأرض: ${rm.nameAr}`,
        titleFr: `Dépassement de limite du terrain : ${rm.nameAr}`,
        titleEn: `Room Exceeds Lot Boundary: ${rm.nameAr}`,
        detailAr: `إحداثيات الغرفة تتخطى حدود الأرض (${L}×${W}م).`,
        detailFr: `La pièce dépasse le périmètre du terrain (${L}×${W} m).`,
        detailEn: `Room coordinates extend outside the ${L}×${W} m lot.`,
        suggestionAr: 'حرك الغرفة داخل حدود البناء أو كبّر أبعاد قطعة الأرض.',
        suggestionFr: 'Déplacez la pièce à l’intérieur des limites.',
        suggestionEn: 'Move room inside lot bounds or enlarge lot dimensions.',
      });
    }
  }

  // 2. Check windowless habitable rooms (living / bedroom / kitchen)
  for (const rm of plan.rooms) {
    if (rm.category !== 'bedroom' && rm.category !== 'living' && rm.category !== 'kitchen') continue;
    const floorWindows = plan.openings.filter((o) => o.floor === rm.floor && o.type === 'window');
    const hasWindow = floorWindows.some((w) => {
      const wx = w.x + (w.rotation === 90 || w.rotation === 270 ? 0 : w.width / 2);
      const wy = w.y + (w.rotation === 90 || w.rotation === 270 ? w.width / 2 : 0);
      return (
        wx >= rm.x - 0.65 &&
        wx <= rm.x + rm.width + 0.65 &&
        wy >= rm.y - 0.65 &&
        wy <= rm.y + rm.length + 0.65
      );
    });
    if (!hasWindow) {
      issues.push({
        id: `nowin-${rm.id}`,
        severity: 'warning',
        floor: rm.floor,
        targetId: rm.id,
        titleAr: `نقص نافذة تهوية: ${rm.nameAr}`,
        titleFr: `Pièce sans fenêtre directe : ${rm.nameAr}`,
        titleEn: `Habitable Room Without Window: ${rm.nameAr}`,
        detailAr: `لم يتم رصد نافذة مباشرة على جدران ${rm.nameAr} للإضاءة الطبيعية.`,
        detailFr: `Aucune fenêtre détectée sur les murs de ${rm.nameAr}.`,
        detailEn: `No direct daylight window detected on perimeter of ${rm.nameAr}.`,
        suggestionAr: 'أضف نافذة نحو واجهة مفتوحة أو اربط الغرفة بفناء داخلي (منور).',
        suggestionFr: 'Ajoutez une fenêtre ou reliez la pièce à un patio.',
        suggestionEn: 'Add a window on an open wall or connect to an interior courtyard.',
      });
    }
  }

  // 3. Overlapping doors check
  const floors = Math.max(1, plan.params.floorsCount || 1);
  for (let f = 0; f < floors; f++) {
    const doors = plan.openings.filter((o) => o.floor === f && o.type === 'door');
    for (let i = 0; i < doors.length; i++) {
      for (let j = i + 1; j < doors.length; j++) {
        const a = doors[i];
        const b = doors[j];
        const acx = a.x + (a.rotation === 90 || a.rotation === 270 ? 0 : a.width / 2);
        const acy = a.y + (a.rotation === 90 || a.rotation === 270 ? a.width / 2 : 0);
        const bcx = b.x + (b.rotation === 90 || b.rotation === 270 ? 0 : b.width / 2);
        const bcy = b.y + (b.rotation === 90 || b.rotation === 270 ? b.width / 2 : 0);
        if (Math.hypot(acx - bcx, acy - bcy) < 0.72) {
          issues.push({
            id: `door-clash-${a.id}-${b.id}`,
            severity: 'warning',
            floor: f,
            targetId: a.id,
            titleAr: `تقارب أو تداخل فتحتي باب (${a.label} / ${b.label})`,
            titleFr: `Chevauchement possible de portes (${a.label} / ${b.label})`,
            titleEn: `Close/Colliding Doors (${a.label} / ${b.label})`,
            detailAr: `المسافة بين البابين أقل من 0.72م مما قد يعيق فتح المصراعين معاً.`,
            detailFr: `Distance inférieure à 0,72 m entre deux portes.`,
            detailEn: `Door centers are < 0.72 m apart and swings may collide.`,
            suggestionAr: 'أزح أحد البابين بمقدار 0.6م على طول الجدار.',
            suggestionFr: 'Décalez l’une des portes de 0,6 m.',
            suggestionEn: 'Slide one door by 0.6 m along the wall.',
          });
        }
      }
    }

    // 4. Furniture blocking doors check
    const furns = plan.furniture.filter((fn) => fn.floor === f);
    for (const fn of furns) {
      const fcx = fn.x + fn.width / 2;
      const fcy = fn.y + fn.depth / 2;
      for (const dr of doors) {
        const dcx = dr.x + (dr.rotation === 90 || dr.rotation === 270 ? 0 : dr.width / 2);
        const dcy = dr.y + (dr.rotation === 90 || dr.rotation === 270 ? dr.width / 2 : 0);
        const overlapX = Math.abs(fcx - dcx) < fn.width / 2 + 0.35;
        const overlapY = Math.abs(fcy - dcy) < fn.depth / 2 + 0.35;
        if (overlapX && overlapY) {
          issues.push({
            id: `furn-door-${fn.id}-${dr.id}`,
            severity: 'warning',
            floor: f,
            targetId: fn.id,
            titleAr: `أثاث يعيق فتح الباب: ${fn.label}`,
            titleFr: `Meuble gênant une porte : ${fn.label}`,
            titleEn: `Furniture Blocking Door: ${fn.label}`,
            detailAr: `قطعة «${fn.label}» قريبة جداً من مسار «${dr.label}».`,
            detailFr: `L’élément « ${fn.label} » bloque l’ouverture « ${dr.label} ».`,
            detailEn: `"${fn.label}" sits inside the swing clearance of "${dr.label}".`,
            suggestionAr: 'اسحب الأثاث للداخل أو اضغط «تأثيث ذكي تلقائي».',
            suggestionFr: 'Déplacez le meuble ou lancez Ameublement Intelligent.',
            suggestionEn: 'Move furniture inward or click SMART FURNISH.',
          });
          break;
        }
      }
    }

    // 5. Poor kitchen/bathroom adjacency check (bathroom touching kitchen without corridor buffer)
    const kitchens = plan.rooms.filter((r) => r.floor === f && r.category === 'kitchen');
    const baths = plan.rooms.filter((r) => r.floor === f && r.category === 'bathroom');
    for (const kt of kitchens) {
      for (const bt of baths) {
        const touchX =
          Math.abs(kt.x + kt.width - bt.x) < 0.3 || Math.abs(bt.x + bt.width - kt.x) < 0.3;
        const touchY =
          Math.abs(kt.y + kt.length - bt.y) < 0.3 || Math.abs(bt.y + bt.length - kt.y) < 0.3;
        const overlapY = Math.min(kt.y + kt.length, bt.y + bt.length) - Math.max(kt.y, bt.y) > 0.8;
        const overlapX = Math.min(kt.x + kt.width, bt.x + bt.width) - Math.max(kt.x, bt.x) > 0.8;
        if ((touchX && overlapY) || (touchY && overlapX)) {
          issues.push({
            id: `adj-kit-bath-${kt.id}-${bt.id}`,
            severity: 'info',
            floor: f,
            targetId: bt.id,
            titleAr: `ملاصقة مباشرة بين المطبخ والحمام`,
            titleFr: `Adjacence directe Cuisine / Salle de bain`,
            titleEn: `Direct Kitchen-Bathroom Wall Adjacency`,
            detailAr: `يفضل عزل مدخل الحمام عن المطبخ بموزع صغير للخصوصية والتهوية الصحية.`,
            detailFr: `Il est conseillé de séparer l’accès WC de la cuisine par un dégagement.`,
            detailEn: `Separating bathroom access from the kitchen with a vestibule improves hygiene & privacy.`,
            suggestionAr: 'تأكد من عدم فتح باب الحمام مباشرة باتجاه المطبخ.',
            suggestionFr: 'Vérifiez que la porte de salle de bain donne sur le couloir.',
            suggestionEn: 'Ensure the bathroom door opens toward a hallway rather than the kitchen.',
          });
        }
      }
    }
  }

  // 6. Wasted area / excessive coverage check
  if (wastedAreaM2 > totalLotArea * 0.28) {
    issues.push({
      id: 'wasted-space',
      severity: 'info',
      titleAr: 'مساحة مفقودة أو غير مستغلة في الطابق الأرضي',
      titleFr: 'Surface non exploitée au rez-de-chaussée',
      titleEn: 'High Unallocated Ground Floor Area',
      detailAr: `يوجد ${wastedAreaM2} م² غير مخصصة كغرف مغلقة ضمن مساحة البناء.`,
      detailFr: `Environ ${wastedAreaM2} m² ne sont pas affectés à des pièces.`,
      detailEn: `About ${wastedAreaM2} m² of footprint is unallocated to defined rooms.`,
      suggestionAr: 'استفد من الفراغ لتوسيع الصالة أو إضافة غرفة تخزين/مكتب.',
      suggestionFr: 'Agrandissez le séjour ou ajoutez un rangement.',
      suggestionEn: 'Consider expanding living spaces or adding storage/study.',
    });
  }

  if (coveragePercent > 94) {
    issues.push({
      id: 'high-coverage',
      severity: 'info',
      titleAr: `نسبة شغل الأرض مرتفعة (${coveragePercent}%)`,
      titleFr: `Taux d’emprise élevé (${coveragePercent}%)`,
      titleEn: `High Lot Coverage (${coveragePercent}%)`,
      detailAr: 'نسبة تغطية البناء للأرض مرتفعة وقد تتطلب ارتداداً نظامياً أو فناء تهوية حسب لائحة البلدية.',
      detailFr: 'Vérifiez le CES et les retraits réglementaires avec votre commune.',
      detailEn: 'Verify setback and lot coverage rules against local municipal zoning.',
      suggestionAr: 'فعّل الفناء الداخلي (وسط الدار) أو قلّص مساحة البناء المطلوبة لإتاحة حوش تهوية.',
      suggestionFr: 'Activez une cour intérieure ou ajustez l’emprise au sol.',
      suggestionEn: 'Enable an interior courtyard or adjust target built area for setbacks.',
    });
  }

  const penalty = issues.reduce(
    (s, it) => s + (it.severity === 'error' ? 14 : it.severity === 'warning' ? 6 : 2),
    0
  );
  const score = Math.max(42, Math.min(100, 100 - penalty));

  return {
    score,
    issues,
    stats: {
      totalLotArea,
      builtFootprint,
      coveragePercent,
      roomsSumArea,
      wastedAreaM2,
    },
  };
}
