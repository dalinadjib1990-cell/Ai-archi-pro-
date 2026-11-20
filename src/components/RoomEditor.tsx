import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  AlertTriangle,
  Move,
  Bed,
  Bath,
  Home,
  Utensils,
  Car,
  Trees,
  Sparkles,
  Info,
  Armchair,
} from 'lucide-react';
import { AppLanguage, GeneratedHousePlan, MeasurementUnit, RoomData } from '../types';
import { updatePlanWithModifiedRooms } from '../utils/proceduralGenerator';
import { smartFurnishPlan } from '../utils/cadGeometry';
import { formatDim, pickText } from '../utils/i18n';

interface RoomEditorProps {
  plan: GeneratedHousePlan;
  onUpdatePlan: (updatedPlan: GeneratedHousePlan) => void;
  onResetLayout: () => void;
  unit?: MeasurementUnit;
  language?: AppLanguage;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({
  plan,
  onUpdatePlan,
  onResetLayout,
  unit = 'm',
  language = 'ar',
}) => {
  const [rooms, setRooms] = useState<RoomData[]>(() => [...plan.rooms]);
  const [activeFloor, setActiveFloor] = useState<number>(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useEffect(() => {
    setRooms([...plan.rooms]);
    setSelectedRoomId(null);
  }, [plan]);

  const [newRoomName, setNewRoomName] = useState<string>('غرفة مكتب وعمل');
  const [newRoomCategory, setNewRoomCategory] = useState<RoomData['category']>('living');
  const [newRoomWidth, setNewRoomWidth] = useState<number>(3.5);
  const [newRoomLength, setNewRoomLength] = useState<number>(3.5);
  const [newRoomColor] = useState<string>('#3b82f6');

  const L = plan.params.length || 15;
  const W = plan.params.width || 10;
  const floorsCount = plan.params.floorsCount || 1;
  const floorRooms = rooms.filter((r) => r.floor === activeFloor);
  const floorFurniture = plan.furniture.filter((f) => f.floor === activeFloor);

  const handleRoomChange = (id: string, field: keyof RoomData, val: string | number) => {
    setIsSaved(false);
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        if (field === 'width' || field === 'length') {
          const w = field === 'width' ? Number(val) : r.width;
          const l = field === 'length' ? Number(val) : r.length;
          updated.area = Number((w * l).toFixed(1));
        }
        return updated;
      })
    );
  };

  const handleDeleteRoom = (id: string) => {
    setIsSaved(false);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    if (selectedRoomId === id) setSelectedRoomId(null);
  };

  const handleAddRoom = () => {
    const newRoom: RoomData = {
      id: `custom-r-${Date.now()}`,
      nameAr: newRoomName || 'غرفة جديدة',
      nameEn: 'Custom Room',
      width: Number(newRoomWidth),
      length: Number(newRoomLength),
      area: Number((newRoomWidth * newRoomLength).toFixed(1)),
      floor: activeFloor,
      color: newRoomColor,
      description: 'غرفة مخصصة تم إضافتها عبر محرر المخطط.',
      x: 0.5,
      y: 0.5,
      category: newRoomCategory,
    };
    setRooms((prev) => [...prev, newRoom]);
    setShowAddModal(false);
    setSelectedRoomId(newRoom.id);
    setIsSaved(false);
  };

  const handleApplyChanges = () => {
    const updatedPlan = updatePlanWithModifiedRooms(plan, rooms);
    onUpdatePlan(updatedPlan);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const getCategoryIcon = (category: RoomData['category']) => {
    switch (category) {
      case 'bedroom': return <Bed className="w-3.5 h-3.5 text-indigo-400" />;
      case 'bathroom': return <Bath className="w-3.5 h-3.5 text-cyan-400" />;
      case 'kitchen': return <Utensils className="w-3.5 h-3.5 text-amber-400" />;
      case 'garage': return <Car className="w-3.5 h-3.5 text-slate-400" />;
      case 'outdoor': return <Trees className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <Home className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{pickText(language, 'محرر الغرف والأثاث (Rooms & Furniture CAD)', 'Éditeur Pièces & Mobilier', 'Rooms & Furniture CAD Editor')}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {pickText(language, 'عدّل أبعاد الغرف أو استخدم التأثيث الذكي لتوزيع الأثاث تلقائياً.', 'Modifiez les cotes ou lancez Ameublement IA.', 'Adjust room dimensions or auto-furnish circulation-safe rooms.')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdatePlan(smartFurnishPlan({ ...plan, rooms }))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95"
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>{pickText(language, 'تأثيث ذكي (SMART FURNISH)', 'AMEUBLEMENT IA', 'SMART FURNISH')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{pickText(language, 'إضافة غرفة', 'Ajouter pièce', 'Add Room')}</span>
          </button>

          <button
            type="button"
            onClick={onResetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{pickText(language, 'إعادة التوزيع', 'Réinitialiser', 'Reset')}</span>
          </button>
        </div>
      </div>

      {/* Floor Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 text-xs">
          {Array.from({ length: floorsCount }).map((_, fIdx) => (
            <button
              key={fIdx}
              onClick={() => {
                setActiveFloor(fIdx);
                setSelectedRoomId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                activeFloor === fIdx
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {fIdx === 0 ? pickText(language, 'الطابق الأرضي', 'RDC', 'Ground Floor') : `${pickText(language, 'الطابق', 'Étage', 'Floor')} ${fIdx}`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium px-2">
          {formatDim(L, unit)} × {formatDim(W, unit)} • {pickText(language, 'أثاث الطابق:', 'Mobilier:', 'Furniture:')} <strong className="text-cyan-400">{floorFurniture.length}</strong>
        </div>
      </div>

      {/* Rooms List + Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-7 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {floorRooms.length === 0 ? (
            <div className="bg-slate-950/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
              {pickText(language, 'لا توجد غرف في هذا الطابق حالياً.', 'Aucune pièce à cet étage.', 'No rooms on this floor.')}
            </div>
          ) : (
            floorRooms.map((rm) => {
              const isSelected = selectedRoomId === rm.id;
              const isOutOfBounds = rm.x + rm.width > L || rm.y + rm.length > W;
              return (
                <div
                  key={rm.id}
                  onClick={() => setSelectedRoomId(rm.id)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: rm.color || '#3b82f6' }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{rm.nameAr}</span>
                        {isOutOfBounds && (
                          <span className="bg-rose-950 border border-rose-500/50 text-rose-300 text-[9px] px-1.5 rounded font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Bounds
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span><strong className="text-cyan-300">{formatDim(rm.width, unit)}</strong> × <strong className="text-cyan-300">{formatDim(rm.length, unit)}</strong></span>
                        <span>•</span>
                        <span><strong className="text-white">{rm.area}m²</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getCategoryIcon(rm.category)}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(rm.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Room Editor */}
        <div className="md:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
          {selectedRoom ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <input
                  type="text"
                  value={selectedRoom.nameAr}
                  onChange={(e) => handleRoomChange(selectedRoom.id, 'nameAr', e.target.value)}
                  className="bg-transparent border-b border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 w-full"
                />
                <span className="text-sm font-extrabold text-cyan-300 shrink-0 mr-2">{selectedRoom.area} m²</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">{pickText(language, 'العرض', 'Largeur', 'Width')}</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'width', Math.max(1.5, Number((selectedRoom.width - 0.2).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">-</button>
                    <span className="font-extrabold text-sm text-cyan-400">{formatDim(selectedRoom.width, unit)}</span>
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'width', Math.min(L - 0.5, Number((selectedRoom.width + 0.2).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">+</button>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">{pickText(language, 'الطول', 'Longueur', 'Length')}</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'length', Math.max(1.5, Number((selectedRoom.length - 0.2).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">-</button>
                    <span className="font-extrabold text-sm text-cyan-400">{formatDim(selectedRoom.length, unit)}</span>
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'length', Math.min(W - 0.5, Number((selectedRoom.length + 0.2).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">+</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">X</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'x', Math.max(0.2, Number((selectedRoom.x - 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">◀</button>
                    <span className="font-bold text-xs text-slate-200">{selectedRoom.x}m</span>
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'x', Math.min(L - selectedRoom.width - 0.2, Number((selectedRoom.x + 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">▶</button>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Y</span>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'y', Math.max(0.2, Number((selectedRoom.y - 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">▲</button>
                    <span className="font-bold text-xs text-slate-200">{selectedRoom.y}m</span>
                    <button type="button" onClick={() => handleRoomChange(selectedRoom.id, 'y', Math.min(W - selectedRoom.length - 0.2, Number((selectedRoom.y + 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 text-xs font-bold">▼</button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{pickText(language, 'يتم تلقائياً تحديث الجدران والأبواب المرتبطة عند الضغط على تطبيق التعديلات.', 'Les murs et ouvertures sont recalculés automatiquement.', 'Associated walls & openings automatically regenerate on Apply.')}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Move className="w-7 h-7 mx-auto text-slate-600" />
              <p>{pickText(language, 'انقر على أي غرفة من القائمة لتعديل أبعادها وموقعها.', 'Sélectionnez une pièce pour modifier ses dimensions.', 'Click any room in the list to edit dimensions and position.')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Save CTA */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          {pickText(language, 'إجمالي الغرف:', 'Pièces :', 'Total Rooms:')} <strong className="text-white">{rooms.length}</strong>
        </div>
        <button
          type="button"
          onClick={handleApplyChanges}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 active:scale-95 ${
            isSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-l from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500'
          }`}
        >
          {isSaved ? <Check className="w-4 h-4 stroke-[3]" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
          <span>{isSaved ? pickText(language, 'تم تحديث النموذج 3D!', 'Modèle 3D mis à jour !', 'Updated 3D & Blueprint!') : pickText(language, 'تطبيق التعديلات وتحديث 3D', 'Appliquer & Mettre à jour 3D', 'Apply Changes & Update 3D')}</span>
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>{pickText(language, 'إضافة غرفة جديدة', 'Ajouter une pièce', 'Add New Room')}</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
              />
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {[
                  { id: 'bedroom', label: 'نوم' },
                  { id: 'living', label: 'معيشة' },
                  { id: 'kitchen', label: 'مطبخ' },
                  { id: 'bathroom', label: 'حمام' },
                  { id: 'hall', label: 'موزع' },
                  { id: 'balcony', label: 'شرفة' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewRoomCategory(cat.id as RoomData['category'])}
                    className={`p-2 rounded-lg border font-bold ${
                      newRoomCategory === cat.id ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="number"
                  step="0.5"
                  min="1.5"
                  max={L - 1}
                  value={newRoomWidth}
                  onChange={(e) => setNewRoomWidth(parseFloat(e.target.value) || 3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                />
                <input
                  type="number"
                  step="0.5"
                  min="1.5"
                  max={W - 1}
                  value={newRoomLength}
                  onChange={(e) => setNewRoomLength(parseFloat(e.target.value) || 3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">إلغاء</button>
              <button type="button" onClick={handleAddRoom} className="px-4 py-1.5 rounded-xl bg-cyan-600 font-bold text-xs text-white">إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
