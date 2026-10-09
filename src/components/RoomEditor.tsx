import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  AlertTriangle,
  Move,
  Maximize2,
  Layers,
  Bed,
  Bath,
  Home,
  Utensils,
  Car,
  Trees,
  Sparkles,
  Info
} from 'lucide-react';
import { GeneratedHousePlan, RoomData } from '../types';
import { updatePlanWithModifiedRooms } from '../utils/proceduralGenerator';

interface RoomEditorProps {
  plan: GeneratedHousePlan;
  onUpdatePlan: (updatedPlan: GeneratedHousePlan) => void;
  onResetLayout: () => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({
  plan,
  onUpdatePlan,
  onResetLayout
}) => {
  const [rooms, setRooms] = useState<RoomData[]>(() => [...plan.rooms]);
  const [activeFloor, setActiveFloor] = useState<number>(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New room modal state
  const [newRoomName, setNewRoomName] = useState<string>('غرفة مكتب وعمل');
  const [newRoomCategory, setNewRoomCategory] = useState<RoomData['category']>('living');
  const [newRoomWidth, setNewRoomWidth] = useState<number>(3.5);
  const [newRoomLength, setNewRoomLength] = useState<number>(3.5);
  const [newRoomColor, setNewRoomColor] = useState<string>('#3b82f6');

  const L = plan.params.length || 15;
  const W = plan.params.width || 10;
  const floorsCount = plan.params.floorsCount || 1;

  // Filter rooms on active floor
  const floorRooms = rooms.filter((r) => r.floor === activeFloor);

  // Update specific room property
  const handleRoomChange = (id: string, field: keyof RoomData, val: any) => {
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

  // Delete a room
  const handleDeleteRoom = (id: string) => {
    setIsSaved(false);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    if (selectedRoomId === id) setSelectedRoomId(null);
  };

  // Add a new room
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
      category: newRoomCategory
    };

    setRooms((prev) => [...prev, newRoom]);
    setShowAddModal(false);
    setSelectedRoomId(newRoom.id);
    setIsSaved(false);
  };

  // Apply changes to the global house plan
  const handleApplyChanges = () => {
    const updatedPlan = updatePlanWithModifiedRooms(plan, rooms);
    onUpdatePlan(updatedPlan);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Helper category icon
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
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>محرر أبعاد ومواقع الغرف (Room CAD Editor)</span>
              <span className="text-[10px] bg-cyan-950 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full font-medium">
                تعديل يدوي تفاعلي
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              عدّل أبعاد أي غرفة بالمتر، غيّر موقعها، أو أضف غرفاً جديدة ثم طبّق التغييرات فوراً على 3D.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة غرفة جديدة</span>
          </button>

          <button
            onClick={onResetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all active:scale-95"
            title="إعادة توزيع الغرف إلى وضعها الافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة التوزيع الأصلي</span>
          </button>
        </div>
      </div>

      {/* Floors selector tab */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 text-xs">
          <span className="px-2 text-slate-500 text-[11px] font-semibold">اختر الطابق للتعديل:</span>
          {Array.from({ length: floorsCount }).map((_, fIdx) => (
            <button
              key={fIdx}
              onClick={() => {
                setActiveFloor(fIdx);
                setSelectedRoomId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                activeFloor === fIdx
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {fIdx === 0 ? 'الطابق الأرضي' : `الطابق ${fIdx}`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium px-2">
          أبعاد قطعة الأرض: <strong className="text-cyan-400">{L}م</strong> × <strong className="text-cyan-400">{W}م</strong>
        </div>
      </div>

      {/* Main editor grid: Rooms list on right, Selected Room Inspector on left */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Rooms Cards List (7 cols) */}
        <div className="md:col-span-7 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {floorRooms.length === 0 ? (
            <div className="bg-slate-950/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
              لا توجد غرف في هذا الطابق حالياً. يمكنك النقر على «إضافة غرفة جديدة».
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
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: rm.color || '#3b82f6' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{rm.nameAr}</span>
                        {isOutOfBounds && (
                          <span className="bg-rose-950 border border-rose-500/50 text-rose-300 text-[9px] px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            تجاوز حدود الأرض!
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>
                          الأبعاد: <strong className="text-cyan-300">{rm.width}م</strong> × <strong className="text-cyan-300">{rm.length}م</strong>
                        </span>
                        <span>•</span>
                        <span>
                          المساحة: <strong className="text-white">{rm.area}م²</strong>
                        </span>
                        <span>•</span>
                        <span>
                          الموقع: ({rm.x}م, {rm.y}م)
                        </span>
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
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="حذف الغرفة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Room Inspector Panel (5 cols) */}
        <div className="md:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
          {selectedRoom ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold block uppercase tracking-wider">خصائص الغرفة المحددة</span>
                  <input
                    type="text"
                    value={selectedRoom.nameAr}
                    onChange={(e) => handleRoomChange(selectedRoom.id, 'nameAr', e.target.value)}
                    className="bg-transparent border-b border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 mt-0.5 w-full"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">المساحة</span>
                  <span className="text-base font-extrabold text-cyan-300">{selectedRoom.area} m²</span>
                </div>
              </div>

              {/* Width & Length Steppers */}
              <div className="grid grid-cols-2 gap-3">
                {/* Width */}
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">العرض (بالمتر)</span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'width', Math.max(1.5, Number((selectedRoom.width - 0.2).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm text-cyan-400">{selectedRoom.width}م</span>
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'width', Math.min(L - 0.5, Number((selectedRoom.width + 0.2).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Length */}
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">الطول (بالمتر)</span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'length', Math.max(1.5, Number((selectedRoom.length - 0.2).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm text-cyan-400">{selectedRoom.length}م</span>
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'length', Math.min(W - 0.5, Number((selectedRoom.length + 0.2).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Offset X & Offset Y Steppers */}
              <div className="grid grid-cols-2 gap-3">
                {/* X Position */}
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">الموقع الأفقي X (متر)</span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'x', Math.max(0.2, Number((selectedRoom.x - 0.5).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      ◀
                    </button>
                    <span className="font-bold text-xs text-slate-200">{selectedRoom.x}م</span>
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'x', Math.min(L - selectedRoom.width - 0.2, Number((selectedRoom.x + 0.5).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Y Position */}
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">الموقع الرأسي Y (متر)</span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'y', Math.max(0.2, Number((selectedRoom.y - 0.5).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      ▲
                    </button>
                    <span className="font-bold text-xs text-slate-200">{selectedRoom.y}م</span>
                    <button
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'y', Math.min(W - selectedRoom.length - 0.2, Number((selectedRoom.y + 0.5).toFixed(1))))}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center active:scale-95"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* Color swatch selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-medium">لون تمييز الغرفة:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#10b981', '#f59e0b', '#d97706'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleRoomChange(selectedRoom.id, 'color', color)}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        selectedRoom.color === color ? 'ring-2 ring-white scale-110' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Boundary Safety Notice */}
              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>يتم تلقائياً تحديث الجدران والأبواب والأثاث المرتبط بهذه الغرفة عند الضغط على تطبيق التعديلات.</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Move className="w-7 h-7 mx-auto text-slate-600 animate-pulse" />
              <p>انقر على أي غرفة من القائمة يميناً لتعديل أبعادها وموقعها.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save & Apply CTA Bar */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          إجمالي الغرف في المخطط: <strong className="text-white">{rooms.length} غرف</strong>
        </div>

        <button
          type="button"
          onClick={handleApplyChanges}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 active:scale-95 ${
            isSaved
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-l from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>تم تطبيق التعديلات وتحديث النموذج 3D بنجاح!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>تطبيق التعديلات وتحديث النموذج 3D والمخطط</span>
            </>
          )}
        </button>
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>إضافة غرفة مخصصة للطابق {activeFloor}</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">اسم الغرفة:</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="مثال: غرفة مكتب، جيم رياضي، مخزن..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">نوع وفئة الغرفة:</label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {[
                    { id: 'bedroom', label: 'نوم' },
                    { id: 'living', label: 'معيشة / صالون' },
                    { id: 'kitchen', label: 'مطبخ / طعام' },
                    { id: 'bathroom', label: 'حمام / خدمات' },
                    { id: 'hall', label: 'بهو / موزع' },
                    { id: 'balcony', label: 'شرفة / تراس' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewRoomCategory(cat.id as any)}
                      className={`p-2 rounded-lg border text-center font-bold ${
                        newRoomCategory === cat.id ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">العرض (متر):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1.5"
                    max={L - 1}
                    value={newRoomWidth}
                    onChange={(e) => setNewRoomWidth(parseFloat(e.target.value) || 3)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الطول (متر):</label>
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddRoom}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white shadow-md shadow-cyan-500/20"
              >
                إضافة الغرفة الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
