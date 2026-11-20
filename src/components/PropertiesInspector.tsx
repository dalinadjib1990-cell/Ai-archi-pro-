import React from 'react';
import {
  Sliders,
  Trash2,
  RotateCw,
  Copy,
  Sparkles,
  Box,
  Armchair,
  DoorOpen,
  PenTool,
  Home,
  Plus,
} from 'lucide-react';
import {
  AppLanguage,
  FurnitureCatalogType,
  FurnitureData,
  GeneratedHousePlan,
  MeasurementUnit,
  SelectedEntity,
  WallData,
  WallType,
} from '../types';
import {
  FURNITURE_CATALOG,
  clampFurnitureToRoom,
  detectClosedRoomsFromWalls,
  getCatalogItem,
  smartFurnishPlan,
} from '../utils/cadGeometry';
import { formatDim, pickText } from '../utils/i18n';
import { updatePlanWithModifiedRooms } from '../utils/proceduralGenerator';

interface PropertiesInspectorProps {
  plan: GeneratedHousePlan;
  selectedEntity: SelectedEntity;
  onSelectEntity: (entity: SelectedEntity) => void;
  onUpdatePlan: (updated: GeneratedHousePlan) => void;
  activeFloor: number;
  activeFurnitureType: FurnitureCatalogType;
  onChangeActiveFurnitureType: (type: FurnitureCatalogType) => void;
  unit: MeasurementUnit;
  language: AppLanguage;
}

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
  plan,
  selectedEntity,
  onSelectEntity,
  onUpdatePlan,
  activeFloor,
  activeFurnitureType,
  onChangeActiveFurnitureType,
  unit,
  language,
}) => {
  const L = plan.params.length || 15;
  const W = plan.params.width || 10;

  const selectedWall =
    selectedEntity?.kind === 'wall' ? plan.walls.find((w) => w.id === selectedEntity.id) : null;
  const selectedRoom =
    selectedEntity?.kind === 'room' ? plan.rooms.find((r) => r.id === selectedEntity.id) : null;
  const selectedFurn =
    selectedEntity?.kind === 'furniture'
      ? plan.furniture.find((f) => f.id === selectedEntity.id)
      : null;
  const selectedOp =
    selectedEntity?.kind === 'opening'
      ? plan.openings.find((o) => o.id === selectedEntity.id)
      : null;
  const selectedCol =
    selectedEntity?.kind === 'column'
      ? plan.columns.find((c) => c.id === selectedEntity.id)
      : null;

  const updateWall = (patch: Partial<WallData>, recalcRooms = false) => {
    if (!selectedWall) return;
    const nextWalls = plan.walls.map((w) => (w.id === selectedWall.id ? { ...w, ...patch } : w));
    const nextRooms = recalcRooms
      ? detectClosedRoomsFromWalls(nextWalls, plan.rooms, selectedWall.floor)
      : plan.rooms;
    onUpdatePlan({ ...plan, walls: nextWalls, rooms: nextRooms });
  };

  const resizeWallLength = (newLen: number) => {
    if (!selectedWall) return;
    const curLen = Math.hypot(selectedWall.x2 - selectedWall.x1, selectedWall.y2 - selectedWall.y1);
    if (curLen < 0.1) return;
    const ux = (selectedWall.x2 - selectedWall.x1) / curLen;
    const uy = (selectedWall.y2 - selectedWall.y1) / curLen;
    const clampedLen = Math.max(0.5, Math.min(60, newLen));
    const x2 = Number(Math.max(0, Math.min(L, selectedWall.x1 + ux * clampedLen)).toFixed(2));
    const y2 = Number(Math.max(0, Math.min(W, selectedWall.y1 + uy * clampedLen)).toFixed(2));
    updateWall({ x2, y2 }, true);
  };

  const updateRoom = (patch: Partial<typeof selectedRoom & {}>) => {
    if (!selectedRoom) return;
    const nextRooms = plan.rooms.map((r) => {
      if (r.id !== selectedRoom.id) return r;
      const merged = { ...r, ...patch };
      merged.area = Number((merged.width * merged.length).toFixed(1));
      return merged;
    });
    onUpdatePlan(updatePlanWithModifiedRooms(plan, nextRooms));
  };

  const updateFurn = (patch: Partial<FurnitureData>) => {
    if (!selectedFurn) return;
    const next = clampFurnitureToRoom({ ...selectedFurn, ...patch }, plan.rooms, L, W, false);
    onUpdatePlan({
      ...plan,
      furniture: plan.furniture.map((f) => (f.id === selectedFurn.id ? next : f)),
    });
  };

  const addCatalogItemToActiveFloor = (type: FurnitureCatalogType) => {
    onChangeActiveFurnitureType(type);
    const cat = getCatalogItem(type);
    const targetRoom =
      selectedRoom ||
      plan.rooms.find((r) => r.floor === activeFloor && cat.categoryHint.includes(r.category)) ||
      plan.rooms.find((r) => r.floor === activeFloor && r.category !== 'outdoor');
    const rx = targetRoom ? targetRoom.x + targetRoom.width / 2 - cat.defaultWidth / 2 : L / 2 - cat.defaultWidth / 2;
    const ry = targetRoom ? targetRoom.y + targetRoom.length / 2 - cat.defaultDepth / 2 : W / 2 - cat.defaultDepth / 2;
    const item = clampFurnitureToRoom(
      {
        id: `furn-cat-${Date.now()}`,
        type: cat.type,
        label: pickText(language, cat.labelAr, cat.labelFr, cat.labelEn),
        x: Number(rx.toFixed(2)),
        y: Number(ry.toFixed(2)),
        width: cat.defaultWidth,
        depth: cat.defaultDepth,
        height: cat.defaultHeight,
        color: cat.defaultColor,
        scale: 1,
        rotation: 0,
        floor: targetRoom ? targetRoom.floor : activeFloor,
        roomId: targetRoom?.id,
      },
      plan.rooms,
      L,
      W,
      false
    );
    onUpdatePlan({
      ...plan,
      params: { ...plan.params, showFurniture: true },
      furniture: [...plan.furniture, item],
    });
    onSelectEntity({ kind: 'furniture', id: item.id });
  };

  const handleSmartFurnish = () => {
    onUpdatePlan(smartFurnishPlan(plan));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {pickText(language, 'مفتش الخصائص والأثاث', 'Inspecteur & Mobilier', 'Properties & Furniture')}
          </h3>
        </div>

        <button
          type="button"
          onClick={handleSmartFurnish}
          className="px-2.5 py-1.5 bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-md active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{pickText(language, 'تأثيث ذكي تلقائي', 'AMEUBLEMENT IA', 'SMART FURNISH')}</span>
        </button>
      </div>

      {/* Selected Entity Contextual Inspector */}
      {selectedWall && (
        <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5" />
              {pickText(language, 'تعديل الجدار المحدد', 'Mur sélectionné', 'Selected Wall')}
            </span>
            <button
              type="button"
              onClick={() => {
                const nextWalls = plan.walls.filter((w) => w.id !== selectedWall.id);
                const nextRooms = detectClosedRoomsFromWalls(nextWalls, plan.rooms, selectedWall.floor);
                onUpdatePlan({ ...plan, walls: nextWalls, rooms: nextRooms });
                onSelectEntity(null);
              }}
              className="text-rose-400 hover:text-rose-300 p-1 rounded"
              title="Delete Wall"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">
                {pickText(language, 'الطول', 'Longueur', 'Length')} ({formatDim(Math.hypot(selectedWall.x2 - selectedWall.x1, selectedWall.y2 - selectedWall.y1), unit)})
              </label>
              <input
                type="number"
                step="0.2"
                min="0.5"
                max="60"
                value={Number(Math.hypot(selectedWall.x2 - selectedWall.x1, selectedWall.y2 - selectedWall.y1).toFixed(2))}
                onChange={(e) => resizeWallLength(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">{pickText(language, 'السماكة (م)', 'Épaisseur', 'Thickness')}</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.5"
                value={selectedWall.thickness}
                onChange={(e) => updateWall({ thickness: Math.max(0.1, parseFloat(e.target.value) || 0.15) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">{pickText(language, 'الارتفاع (م)', 'Hauteur', 'Height')}</label>
              <input
                type="number"
                step="0.1"
                min="2.2"
                max="5.0"
                value={selectedWall.height ?? 3.2}
                onChange={(e) => updateWall({ height: Math.max(2.2, parseFloat(e.target.value) || 3.2) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(['exterior', 'interior', 'structural'] as WallType[]).map((wt) => (
              <button
                key={wt}
                type="button"
                onClick={() => updateWall({ wallType: wt, isExterior: wt === 'exterior', thickness: wt === 'exterior' ? 0.25 : wt === 'structural' ? 0.22 : 0.15 })}
                className={`flex-1 py-1 rounded-lg border text-[10px] font-bold ${
                  (selectedWall.wallType || (selectedWall.isExterior ? 'exterior' : 'interior')) === wt
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {wt === 'exterior' ? pickText(language, 'خارجي', 'Extérieur', 'Exterior') : wt === 'structural' ? pickText(language, 'حامل', 'Porteur', 'Structural') : pickText(language, 'داخلي', 'Intérieur', 'Interior')}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRoom && (
        <div className="bg-slate-950/70 border border-cyan-500/40 rounded-xl p-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <input
                type="text"
                value={selectedRoom.nameAr}
                onChange={(e) => updateRoom({ nameAr: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-white text-xs font-bold w-40"
              />
            </span>
            <span className="text-cyan-400 font-mono font-bold">{selectedRoom.area} m²</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <div>
              <label className="text-[10px] text-slate-400 block">W (m)</label>
              <input
                type="number"
                step="0.2"
                min="1.4"
                max={L}
                value={selectedRoom.width}
                onChange={(e) => updateRoom({ width: Math.max(1.4, parseFloat(e.target.value) || 2) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">L (m)</label>
              <input
                type="number"
                step="0.2"
                min="1.4"
                max={W}
                value={selectedRoom.length}
                onChange={(e) => updateRoom({ length: Math.max(1.4, parseFloat(e.target.value) || 2) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">X (m)</label>
              <input
                type="number"
                step="0.2"
                min="0"
                max={L - selectedRoom.width}
                value={selectedRoom.x}
                onChange={(e) => updateRoom({ x: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">Y (m)</label>
              <input
                type="number"
                step="0.2"
                min="0"
                max={W - selectedRoom.length}
                value={selectedRoom.y}
                onChange={(e) => updateRoom({ y: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {selectedFurn && (
        <div className="bg-slate-950/70 border border-blue-500/40 rounded-xl p-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-300 flex items-center gap-1.5">
              <Armchair className="w-3.5 h-3.5" />
              <span>{selectedFurn.label}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateFurn({ rotation: ((selectedFurn.rotation || 0) + 90) % 360 })}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const dup: FurnitureData = {
                    ...selectedFurn,
                    id: `furn-dup-${Date.now()}`,
                    x: Number((selectedFurn.x + 0.4).toFixed(2)),
                    y: Number((selectedFurn.y + 0.4).toFixed(2)),
                  };
                  onUpdatePlan({ ...plan, furniture: [...plan.furniture, clampFurnitureToRoom(dup, plan.rooms, L, W)] });
                  onSelectEntity({ kind: 'furniture', id: dup.id });
                }}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Duplicate"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdatePlan({ ...plan, furniture: plan.furniture.filter((f) => f.id !== selectedFurn.id) });
                  onSelectEntity(null);
                }}
                className="p-1 bg-rose-950/60 hover:bg-rose-900 rounded text-rose-300"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block">W (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.3"
                max="5"
                value={selectedFurn.width}
                onChange={(e) => updateFurn({ width: Math.max(0.3, parseFloat(e.target.value) || 0.5) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">D (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.3"
                max="5"
                value={selectedFurn.depth}
                onChange={(e) => updateFurn({ depth: Math.max(0.3, parseFloat(e.target.value) || 0.5) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">{pickText(language, 'الحجم', 'Échelle', 'Scale')}</label>
              <input
                type="number"
                step="0.1"
                min="0.6"
                max="1.6"
                value={selectedFurn.scale ?? 1}
                onChange={(e) => updateFurn({ scale: Math.max(0.6, Math.min(1.6, parseFloat(e.target.value) || 1)) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['#1d4ed8', '#334155', '#78350f', '#0f172a', '#e2e8f0', '#16a34a', '#fbbf24', '#be123c'].map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => updateFurn({ color: col })}
                className={`w-5 h-5 rounded-full border ${
                  selectedFurn.color === col ? 'ring-2 ring-white scale-110' : 'border-slate-700'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>
      )}

      {selectedOp && (
        <div className="bg-slate-950/70 border border-emerald-500/40 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5" />
              <span>{selectedOp.label} ({selectedOp.type})</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onUpdatePlan({
                    ...plan,
                    openings: plan.openings.map((o) =>
                      o.id === selectedOp.id ? { ...o, rotation: (o.rotation + 90) % 360 } : o
                    ),
                  });
                }}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdatePlan({ ...plan, openings: plan.openings.filter((o) => o.id !== selectedOp.id) });
                  onSelectEntity(null);
                }}
                className="p-1 bg-rose-950/60 hover:bg-rose-900 rounded text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">
              {pickText(language, 'عرض الفتحة', 'Largeur', 'Opening Width')}: {formatDim(selectedOp.width, unit)}
            </label>
            <input
              type="range"
              min="0.7"
              max="3.2"
              step="0.05"
              value={selectedOp.width}
              onChange={(e) => {
                const nw = parseFloat(e.target.value);
                onUpdatePlan({
                  ...plan,
                  openings: plan.openings.map((o) => (o.id === selectedOp.id ? { ...o, width: nw } : o)),
                });
              }}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      )}

      {selectedCol && (
        <div className="bg-slate-950/70 border border-rose-500/40 rounded-xl p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <Box className="w-4 h-4" />
            <span>{pickText(language, 'عمود', 'Poteau', 'Column')} {selectedCol.gridAxis}</span>
          </div>
          <span className="font-mono text-slate-300">
            ({selectedCol.x}m, {selectedCol.y}m) • {selectedCol.sizeX}×{selectedCol.sizeY}m
          </span>
        </div>
      )}

      {!selectedWall && !selectedRoom && !selectedFurn && !selectedOp && !selectedCol && (
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 text-center">
          {pickText(
            language,
            'انقر على أي جدار أو غرفة أو أثاث أو فتحة لتعديل أبعاده وخصائصه مباشرة.',
            'Sélectionnez un mur, une pièce, un meuble ou une ouverture pour éditer ses cotes.',
            'Click any wall, room, furniture item, or opening on the 2D plan to edit dimensions.'
          )}
        </div>
      )}

      {/* 16-Item Smart Furniture Catalog Quick Adder */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
          <span>{pickText(language, 'مكتبة الأثاث (16 عنصراً + سيارة) — انقر لإضافته للغرفة', 'Catalogue Mobilier (17)', 'Smart Furniture Catalog (17)')}</span>
          <span className="font-mono text-cyan-400">{plan.furniture.length}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
          {FURNITURE_CATALOG.map((cat) => {
            const active = activeFurnitureType === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => addCatalogItemToActiveFloor(cat.type)}
                className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all truncate ${
                  active
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                title={`${cat.defaultWidth}×${cat.defaultDepth}m`}
              >
                <Plus className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{pickText(language, cat.labelAr, cat.labelFr, cat.labelEn)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
