import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Download,
  FileCode2,
  Grid,
  Box,
  Ruler,
  Crosshair,
  Move,
  PenTool,
  DoorOpen,
  AppWindow,
  Armchair,
  Trash2,
  Square,
} from 'lucide-react';
import {
  AppLanguage,
  ColumnData,
  DEFAULT_LAYERS,
  EditorTool,
  FurnitureCatalogType,
  FurnitureData,
  GeneratedHousePlan,
  LayerVisibilityMap,
  MeasurementUnit,
  OpeningData,
  RoomData,
  SelectedEntity,
  WallData,
} from '../types';
import {
  addWallWithJunctionSnapping,
  clampFurnitureToRoom,
  detectClosedRoomsFromWalls,
  getCatalogItem,
  snapPointToWalls,
} from '../utils/cadGeometry';
import { formatDim, pickText } from '../utils/i18n';
import { updatePlanWithModifiedRooms } from '../utils/proceduralGenerator';

interface Blueprint2DCanvasProps {
  plan: GeneratedHousePlan;
  activeTool?: EditorTool;
  onToolChange?: (tool: EditorTool) => void;
  unit?: MeasurementUnit;
  onUnitChange?: (u: MeasurementUnit) => void;
  selectedEntity?: SelectedEntity;
  onSelectEntity?: (e: SelectedEntity) => void;
  onUpdatePlan?: (updated: GeneratedHousePlan) => void;
  layers?: LayerVisibilityMap;
  activeFurnitureType?: FurnitureCatalogType;
  activeFloorExternal?: number;
  onFloorChange?: (f: number) => void;
  language?: AppLanguage;
}

export function generateBlueprintSVGString(
  plan: GeneratedHousePlan,
  activeFloor: number,
  unit: MeasurementUnit | string = 'm'
): string {
  const L = plan.params.length || 15;
  const W = plan.params.width || 10;
  const svgW = 1000;
  const svgH = 680;
  const margin = 80;
  const scale = Math.min((svgW - margin * 2) / L, (svgH - margin * 2 - 50) / W);
  const ox = (svgW - L * scale) / 2;
  const oy = (svgH - 40 - W * scale) / 2;
  const sx = (x: number) => (ox + x * scale).toFixed(1);
  const sy = (y: number) => (oy + y * scale).toFixed(1);

  const floorRooms = plan.rooms.filter((r) => r.floor === activeFloor);
  const floorWalls = plan.walls.filter((w) => w.floor === activeFloor);
  const floorOpenings = plan.openings.filter((o) => o.floor === activeFloor);
  const floorFurniture = plan.furniture.filter((f) => f.floor === activeFloor);

  const gridLines: string[] = [];
  for (let x = 0; x <= L; x += 1) {
    gridLines.push(
      `<line x1="${sx(x)}" y1="${oy - 10}" x2="${sx(x)}" y2="${oy + W * scale + 10}" stroke="#1e293b" stroke-width="1"/>`
    );
  }
  for (let y = 0; y <= W; y += 1) {
    gridLines.push(
      `<line x1="${ox - 10}" y1="${sy(y)}" x2="${ox + L * scale + 10}" y2="${sy(y)}" stroke="#1e293b" stroke-width="1"/>`
    );
  }

  const roomRects = floorRooms
    .map(
      (r) => `
    <g>
      <rect x="${sx(r.x)}" y="${sy(r.y)}" width="${(r.width * scale).toFixed(1)}" height="${(r.length * scale).toFixed(1)}" fill="${r.color}22" stroke="${r.color}" stroke-width="1.4"/>
      <text x="${(ox + (r.x + r.width / 2) * scale).toFixed(1)}" y="${(oy + (r.y + r.length / 2) * scale - 6).toFixed(1)}" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">${r.nameAr}</text>
      <text x="${(ox + (r.x + r.width / 2) * scale).toFixed(1)}" y="${(oy + (r.y + r.length / 2) * scale + 10).toFixed(1)}" fill="#94a3b8" font-size="10" text-anchor="middle">${formatDim(r.width, unit)} × ${formatDim(r.length, unit)} (${r.area} m²)</text>
    </g>`
    )
    .join('\n');

  const furnRects = floorFurniture
    .map(
      (f) =>
        `<rect x="${sx(f.x)}" y="${sy(f.y)}" width="${(f.width * scale).toFixed(1)}" height="${(f.depth * scale).toFixed(1)}" fill="#33415555" stroke="#64748b" stroke-width="1"/>`
    )
    .join('\n');

  const wallLines = floorWalls
    .map(
      (w) =>
        `<line x1="${sx(w.x1)}" y1="${sy(w.y1)}" x2="${sx(w.x2)}" y2="${sy(w.y2)}" stroke="${w.isExterior ? '#0ea5e9' : '#94a3b8'}" stroke-width="${Math.max(2, w.thickness * scale).toFixed(1)}" stroke-linecap="square"/>`
    )
    .join('\n');

  const openingMarks = floorOpenings
    .map((op) => {
      const isVert = op.rotation === 90 || op.rotation === 270;
      const x1 = Number(sx(op.x));
      const y1 = Number(sy(op.y));
      const len = op.width * scale;
      if (op.type === 'door') {
        return `<line x1="${x1}" y1="${y1}" x2="${isVert ? x1 : x1 + len}" y2="${isVert ? y1 + len : y1}" stroke="#f59e0b" stroke-width="3.5"/>`;
      }
      return `<line x1="${x1}" y1="${y1}" x2="${isVert ? x1 : x1 + len}" y2="${isVert ? y1 + len : y1}" stroke="#38bdf8" stroke-width="4"/>`;
    })
    .join('\n');

  const colRects = plan.columns
    .map((c) => {
      const cw = (c.sizeX || 0.25) * scale;
      const ch = (c.sizeY || 0.45) * scale;
      return `<rect x="${(ox + c.x * scale - cw / 2).toFixed(1)}" y="${(oy + c.y * scale - ch / 2).toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="#f43f5e" stroke="#ffffff" stroke-width="1"/>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">
  <rect width="100%" height="100%" fill="#020617"/>
  ${gridLines.join('\n')}
  <rect x="${ox}" y="${oy}" width="${(L * scale).toFixed(1)}" height="${(W * scale).toFixed(1)}" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="8,5"/>
  ${roomRects}
  ${furnRects}
  ${wallLines}
  ${openingMarks}
  ${colRects}
  <!-- Title Block & Scale -->
  <rect x="20" y="${svgH - 46}" width="${svgW - 40}" height="34" rx="6" fill="#0f172a" stroke="#1e293b"/>
  <text x="36" y="${svgH - 25}" fill="#38bdf8" font-size="12" font-weight="bold">ARCH-AI PRO | ${plan.specs.title} | Floor ${activeFloor} | Lot ${L}×${W}m (${plan.specs.totalLandArea}m²) | Built ${plan.specs.totalBuiltArea}m²</text>
  <line x1="${svgW - 220}" y1="${svgH - 24}" x2="${svgW - 220 + 5 * scale}" y2="${svgH - 24}" stroke="#f8fafc" stroke-width="2"/>
  <text x="${svgW - 220}" y="${svgH - 30}" fill="#f8fafc" font-size="10">Scale: 5m</text>
  <text x="${svgW - 40}" y="32" fill="#38bdf8" font-size="13" font-weight="bold" text-anchor="end">N ⬆</text>
</svg>`;
}

export const Blueprint2DCanvas: React.FC<Blueprint2DCanvasProps> = ({
  plan,
  activeTool = 'select',
  onToolChange,
  unit = 'm',
  onUnitChange,
  selectedEntity = null,
  onSelectEntity,
  onUpdatePlan,
  layers = DEFAULT_LAYERS,
  activeFurnitureType = 'sofa',
  activeFloorExternal,
  onFloorChange,
  language = 'ar',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [internalFloor, setInternalFloor] = useState<number>(0);
  const activeFloor = activeFloorExternal ?? internalFloor;
  const setActiveFloor = (f: number) => {
    setInternalFloor(f);
    onFloorChange?.(f);
  };

  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showRoomFills, setShowRoomFills] = useState<boolean>(true);

  const [selectedRoomLocal, setSelectedRoomLocal] = useState<RoomData | null>(null);
  const [selectedColLocal, setSelectedColLocal] = useState<ColumnData | null>(null);

  // Interactive drawing / measuring / dragging transient states
  const [draftStart, setDraftStart] = useState<{ x: number; y: number } | null>(null);
  const [draftEnd, setDraftEnd] = useState<{ x: number; y: number } | null>(null);
  const [measureLine, setMeasureLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dragState, setDragState] = useState<
    | { kind: 'furniture'; id: string; grabOffsetX: number; grabOffsetY: number }
    | { kind: 'room'; id: string; grabOffsetX: number; grabOffsetY: number }
    | { kind: 'wall_p1' | 'wall_p2'; id: string }
    | null
  >(null);

  const L = plan.params.length || 15;
  const W = plan.params.width || 10;

  const floorRooms = useMemo(() => plan.rooms.filter((r) => r.floor === activeFloor), [plan.rooms, activeFloor]);
  const floorColumns = plan.columns;
  const floorWalls = useMemo(() => plan.walls.filter((w) => w.floor === activeFloor), [plan.walls, activeFloor]);
  const floorOpenings = useMemo(() => plan.openings.filter((o) => o.floor === activeFloor), [plan.openings, activeFloor]);
  const floorFurniture = useMemo(() => plan.furniture.filter((f) => f.floor === activeFloor), [plan.furniture, activeFloor]);

  const builtAreaM2 = plan.specs.totalBuiltArea || 0;
  const roomsSumFloor = useMemo(
    () => Number(floorRooms.reduce((s, r) => s + (r.area || r.width * r.length), 0).toFixed(1)),
    [floorRooms]
  );

  // Geometry transform helpers matching canvas width/height
  const getTransform = (canvas: HTMLCanvasElement) => {
    const margin = 65;
    const availW = canvas.width - margin * 2;
    const availH = canvas.height - margin * 2;
    const scale = Math.min(availW / L, availH / W) * zoom;
    const offsetX = (canvas.width - L * scale) / 2;
    const offsetY = (canvas.height - W * scale) / 2;
    return { scale, offsetX, offsetY };
  };

  const clientToMeters = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleCssX = canvas.width / rect.width;
    const scaleCssY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleCssX;
    const py = (e.clientY - rect.top) * scaleCssY;
    const { scale, offsetX, offsetY } = getTransform(canvas);
    return {
      mx: Number(((px - offsetX) / scale).toFixed(2)),
      my: Number(((py - offsetY) / scale).toFixed(2)),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const { scale, offsetX, offsetY } = getTransform(canvas);
    const toPxX = (mX: number) => offsetX + mX * scale;
    const toPxY = (mY: number) => offsetY + mY * scale;

    // 1. CAD Grid
    if (showGrid) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let x = 0; x <= L; x += 0.5) {
        const px = toPxX(x);
        ctx.strokeStyle = x % 1 === 0 ? '#1e293b' : '#0f172a';
        ctx.beginPath();
        ctx.moveTo(px, offsetY - 16);
        ctx.lineTo(px, offsetY + W * scale + 16);
        ctx.stroke();

        if (x % 2 === 0 || x === L) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(formatDim(x, unit), px, offsetY - 22);
        }
      }
      for (let y = 0; y <= W; y += 0.5) {
        const py = toPxY(y);
        ctx.strokeStyle = y % 1 === 0 ? '#1e293b' : '#0f172a';
        ctx.beginPath();
        ctx.moveTo(offsetX - 16, py);
        ctx.lineTo(offsetX + L * scale + 16, py);
        ctx.stroke();

        if (y % 2 === 0 || y === W) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(formatDim(y, unit), offsetX - 22, py + 3);
        }
      }
    }

    // 2. Lot Boundary & Open Facade Edges
    const openDirs = plan.params.openFacadeDirections || ['front', 'left'];
    const bx0 = offsetX;
    const by0 = offsetY;
    const bx1 = offsetX + L * scale;
    const by1 = offsetY + W * scale;

    const drawBoundaryEdge = (
      xA: number,
      yA: number,
      xB: number,
      yB: number,
      isOpen: boolean,
      label: string,
      lx: number,
      ly: number
    ) => {
      ctx.save();
      ctx.strokeStyle = isOpen ? '#10b981' : '#ef4444';
      ctx.lineWidth = isOpen ? 2 : 3;
      ctx.setLineDash(isOpen ? [8, 5] : []);
      ctx.beginPath();
      ctx.moveTo(xA, yA);
      ctx.lineTo(xB, yB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isOpen ? '#34d399' : '#f87171';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, lx, ly);
      ctx.restore();
    };

    drawBoundaryEdge(bx0, by1, bx1, by1, openDirs.includes('front'), openDirs.includes('front') ? 'الواجهة الأمامية (شارع)' : 'واجهة أمامية مغلقة', (bx0 + bx1) / 2, by1 + 18);
    drawBoundaryEdge(bx0, by0, bx1, by0, openDirs.includes('back'), openDirs.includes('back') ? 'واجهة خلفية مفتوحة' : 'جدار جار خلفي', (bx0 + bx1) / 2, by0 - 10);
    drawBoundaryEdge(bx0, by0, bx0, by1, openDirs.includes('left'), openDirs.includes('left') ? 'يسار مفتوح' : 'جار يسار', bx0 - 30, (by0 + by1) / 2);
    drawBoundaryEdge(bx1, by0, bx1, by1, openDirs.includes('right'), openDirs.includes('right') ? 'يمين مفتوح' : 'جار يمين', bx1 + 30, (by0 + by1) / 2);

    // 3. Rooms
    floorRooms.forEach((r) => {
      const rx = toPxX(r.x);
      const ry = toPxY(r.y);
      const rw = r.width * scale;
      const rh = r.length * scale;
      const isSelected = selectedEntity?.kind === 'room' && selectedEntity.id === r.id;

      if (showRoomFills) {
        ctx.fillStyle = isSelected ? '#0ea5e938' : r.color + '24';
        ctx.fillRect(rx, ry, rw, rh);
      }

      ctx.strokeStyle = isSelected ? '#38bdf8' : r.color + 'aa';
      ctx.lineWidth = isSelected ? 2.5 : 1.3;
      ctx.strokeRect(rx, ry, rw, rh);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11.5px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = rx + rw / 2;
      const cy = ry + rh / 2;
      ctx.fillText(r.nameAr, cx, cy - 7);

      if (showDimensions) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(`${formatDim(r.width, unit)}×${formatDim(r.length, unit)} (${r.area}m²)`, cx, cy + 9);
      }
    });

    // 4. Walls
    if (layers.walls) {
      floorWalls.forEach((w) => {
        const x1 = toPxX(w.x1);
        const y1 = toPxY(w.y1);
        const x2 = toPxX(w.x2);
        const y2 = toPxY(w.y2);
        const isSel = selectedEntity?.kind === 'wall' && selectedEntity.id === w.id;

        ctx.strokeStyle = isSel
          ? '#fbbf24'
          : w.wallType === 'structural'
          ? '#a855f7'
          : w.isExterior
          ? '#0284c7'
          : '#64748b';
        ctx.lineWidth = Math.max(2.5, w.thickness * scale);
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Highlight endpoints & show wall length when selected
        if (isSel) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(x1, y1, 5, 0, Math.PI * 2);
          ctx.arc(x2, y2, 5, 0, Math.PI * 2);
          ctx.fill();
          const wLen = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(formatDim(wLen, unit), (x1 + x2) / 2, (y1 + y2) / 2 - 10);
        }
      });
    }

    // 5. Furniture
    if (layers.furniture) {
      floorFurniture.forEach((f) => {
        const fx = toPxX(f.x);
        const fy = toPxY(f.y);
        const fw = f.width * scale;
        const fh = f.depth * scale;
        const isSel = selectedEntity?.kind === 'furniture' && selectedEntity.id === f.id;

        ctx.save();
        ctx.translate(fx + fw / 2, fy + fh / 2);
        ctx.rotate(((f.rotation || 0) * Math.PI) / 180);
        ctx.fillStyle = isSel ? '#0284c755' : (f.color || '#334155') + '55';
        ctx.strokeStyle = isSel ? '#38bdf8' : '#94a3b8';
        ctx.lineWidth = isSel ? 2.2 : 1;
        ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
        ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.label, 0, 0);
        ctx.restore();
      });
    }

    // 6. Openings (Doors & Windows)
    floorOpenings.forEach((op) => {
      if (op.type === 'door' && !layers.doors) return;
      if (op.type === 'window' && !layers.windows) return;
      const ox = toPxX(op.x);
      const oy = toPxY(op.y);
      const ow = op.width * scale;
      const isVertical = op.rotation === 90 || op.rotation === 270;
      const isSel = selectedEntity?.kind === 'opening' && selectedEntity.id === op.id;

      if (op.type === 'door') {
        if (isVertical) {
          ctx.fillStyle = '#020617';
          ctx.fillRect(ox - 4, oy, 8, ow);
          ctx.strokeStyle = isSel ? '#38bdf8' : '#f59e0b';
          ctx.lineWidth = isSel ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(op.rotation === 270 ? ox - ow : ox + ow, oy);
          ctx.stroke();
          ctx.strokeStyle = '#f59e0b66';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (op.rotation === 270) ctx.arc(ox, oy, ow, Math.PI / 2, Math.PI);
          else ctx.arc(ox, oy, ow, 0, Math.PI / 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#020617';
          ctx.fillRect(ox, oy - 4, ow, 8);
          const swingUp = op.y > W / 2;
          ctx.strokeStyle = isSel ? '#38bdf8' : '#f59e0b';
          ctx.lineWidth = isSel ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox, swingUp ? oy - ow : oy + ow);
          ctx.stroke();
          ctx.strokeStyle = '#f59e0b66';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (swingUp) ctx.arc(ox, oy, ow, -Math.PI / 2, 0);
          else ctx.arc(ox, oy, ow, 0, Math.PI / 2);
          ctx.stroke();
        }
      } else {
        if (isVertical) {
          ctx.fillStyle = '#020617';
          ctx.fillRect(ox - 4, oy, 8, ow);
          ctx.strokeStyle = isSel ? '#fbbf24' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(ox - 3, oy, 6, ow);
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox, oy + ow);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#020617';
          ctx.fillRect(ox, oy - 4, ow, 8);
          ctx.strokeStyle = isSel ? '#fbbf24' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(ox, oy - 3, ow, 6);
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + ow, oy);
          ctx.stroke();
        }
      }
    });

    // 7. Columns
    if (layers.columns) {
      floorColumns.forEach((col) => {
        const cx = toPxX(col.x);
        const cy = toPxY(col.y);
        const cw = (col.sizeX || 0.25) * scale;
        const ch = (col.sizeY || 0.45) * scale;
        const isSel = selectedEntity?.kind === 'column' && selectedEntity.id === col.id;
        ctx.fillStyle = isSel ? '#fbbf24' : '#f43f5e';
        ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - cw / 2, cy - ch / 2, cw, ch);
        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(col.gridAxis, cx, cy - ch / 2 - 4);
      });
    }

    // 8. Draft Wall / Draft Room Overlay
    if (draftStart && draftEnd) {
      const dx1 = toPxX(draftStart.x);
      const dy1 = toPxY(draftStart.y);
      const dx2 = toPxX(draftEnd.x);
      const dy2 = toPxY(draftEnd.y);
      if (activeTool === 'wall') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(dx1, dy1);
        ctx.lineTo(dx2, dy2);
        ctx.stroke();
        ctx.setLineDash([]);
        const len = Math.hypot(draftEnd.x - draftStart.x, draftEnd.y - draftStart.y);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(formatDim(len, unit), (dx1 + dx2) / 2, (dy1 + dy2) / 2 - 12);
      } else if (activeTool === 'room') {
        const rx = Math.min(dx1, dx2);
        const ry = Math.min(dy1, dy2);
        const rw = Math.abs(dx2 - dx1);
        const rh = Math.abs(dy2 - dy1);
        ctx.fillStyle = '#38bdf822';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
        const wM = Math.abs(draftEnd.x - draftStart.x);
        const lM = Math.abs(draftEnd.y - draftStart.y);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${formatDim(wM, unit)} × ${formatDim(lM, unit)}`, rx + rw / 2, ry + rh / 2);
      }
    }

    // 9. Active Precision Measure Overlay
    if (measureLine) {
      const mx1 = toPxX(measureLine.x1);
      const my1 = toPxY(measureLine.y1);
      const mx2 = toPxX(measureLine.x2);
      const my2 = toPxY(measureLine.y2);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(mx1, my1);
      ctx.lineTo(mx2, my2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(mx1, my1, 4.5, 0, Math.PI * 2);
      ctx.arc(mx2, my2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      const dist = Math.hypot(measureLine.x2 - measureLine.x1, measureLine.y2 - measureLine.y1);
      const txt = formatDim(dist, unit);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect((mx1 + mx2) / 2 - 36, (my1 + my2) / 2 - 20, 72, 20);
      ctx.strokeStyle = '#22d3ee';
      ctx.strokeRect((mx1 + mx2) / 2 - 36, (my1 + my2) / 2 - 20, 72, 20);
      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(txt, (mx1 + mx2) / 2, (my1 + my2) / 2 - 7);
    }

    // 10. Scale Bar & North Arrow
    const rulerMeters = 5;
    const rulerPx = rulerMeters * scale;
    const rx = 28;
    const ry = canvasHeight - 24;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rulerPx, ry);
    ctx.moveTo(rx, ry - 5);
    ctx.lineTo(rx, ry + 5);
    ctx.moveTo(rx + rulerPx, ry - 5);
    ctx.lineTo(rx + rulerPx, ry + 5);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${pickText(language, 'مقياس', 'Échelle', 'Scale')}: ${formatDim(rulerMeters, unit)}`, rx, ry - 8);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('⬆ N', canvasWidth - 24, 28);
  }, [
    plan,
    activeFloor,
    zoom,
    showGrid,
    showDimensions,
    showRoomFills,
    layers,
    selectedEntity,
    draftStart,
    draftEnd,
    measureLine,
    activeTool,
    unit,
    language,
    floorRooms,
    floorWalls,
    floorOpenings,
    floorFurniture,
    floorColumns,
    L,
    W,
  ]);

  // Helper to commit a plan update safely
  const commitPlan = (updated: GeneratedHousePlan) => {
    onUpdatePlan?.(updated);
  };

  // Find entity hit in meters
  const hitTestEntity = (mx: number, my: number): SelectedEntity => {
    // 1. Furniture (top layer)
    const hitFurn = [...floorFurniture].reverse().find(
      (f) => mx >= f.x && mx <= f.x + f.width && my >= f.y && my <= f.y + f.depth
    );
    if (hitFurn) return { kind: 'furniture', id: hitFurn.id };

    // 2. Openings
    const hitOp = floorOpenings.find((op) => {
      const isV = op.rotation === 90 || op.rotation === 270;
      const cx = isV ? op.x : op.x + op.width / 2;
      const cy = isV ? op.y + op.width / 2 : op.y;
      return Math.hypot(mx - cx, my - cy) < Math.max(0.55, op.width / 2 + 0.25);
    });
    if (hitOp) return { kind: 'opening', id: hitOp.id };

    // 3. Columns
    const hitCol = floorColumns.find((c) => Math.abs(c.x - mx) < 0.45 && Math.abs(c.y - my) < 0.45);
    if (hitCol) return { kind: 'column', id: hitCol.id };

    // 4. Walls (distance to segment < 0.35m)
    const hitWall = floorWalls.find((w) => {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 0.01) return false;
      const t = Math.max(0, Math.min(1, ((mx - w.x1) * dx + (my - w.y1) * dy) / lenSq));
      return Math.hypot(mx - (w.x1 + t * dx), my - (w.y1 + t * dy)) < 0.35;
    });
    if (hitWall) return { kind: 'wall', id: hitWall.id };

    // 5. Rooms
    const hitRoom = floorRooms.find(
      (r) => mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.length
    );
    if (hitRoom) return { kind: 'room', id: hitRoom.id };

    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { mx, my } = clientToMeters(e);

    if (activeTool === 'wall' || activeTool === 'room') {
      const snapped = snapPointToWalls(mx, my, floorWalls, 0.35);
      setDraftStart({ x: snapped.x, y: snapped.y });
      setDraftEnd({ x: snapped.x, y: snapped.y });
      return;
    }

    if (activeTool === 'measure') {
      if (!draftStart) {
        setDraftStart({ x: mx, y: my });
        setMeasureLine({ x1: mx, y1: my, x2: mx, y2: my });
      } else {
        setMeasureLine({ x1: draftStart.x, y1: draftStart.y, x2: mx, y2: my });
        setDraftStart(null);
      }
      return;
    }

    if (activeTool === 'door' || activeTool === 'window') {
      if (!onUpdatePlan) return;
      // Find nearest wall segment
      let bestWall: WallData | null = null;
      let bestDist = 1.2;
      let projX = mx;
      let projY = my;
      for (const w of floorWalls) {
        const dx = w.x2 - w.x1;
        const dy = w.y2 - w.y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq < 0.3) continue;
        const t = Math.max(0.08, Math.min(0.92, ((mx - w.x1) * dx + (my - w.y1) * dy) / lenSq));
        const px = w.x1 + t * dx;
        const py = w.y1 + t * dy;
        const d = Math.hypot(mx - px, my - py);
        if (d < bestDist) {
          bestDist = d;
          bestWall = w;
          projX = px;
          projY = py;
        }
      }
      if (!bestWall) return;
      const isVertical = Math.abs(bestWall.x2 - bestWall.x1) < Math.abs(bestWall.y2 - bestWall.y1);
      const opW = activeTool === 'door' ? 0.95 : 1.6;
      const newOp: OpeningData = {
        id: `op-cad-${Date.now()}`,
        type: activeTool,
        x: Number((isVertical ? projX : Math.max(0.2, projX - opW / 2)).toFixed(2)),
        y: Number((isVertical ? Math.max(0.2, projY - opW / 2) : projY).toFixed(2)),
        width: opW,
        rotation: isVertical ? 90 : 0,
        label: activeTool === 'door' ? 'باب مضاف' : 'نافذة مضافة',
        floor: activeFloor,
      };
      commitPlan({ ...plan, openings: [...plan.openings, newOp] });
      onSelectEntity?.({ kind: 'opening', id: newOp.id });
      return;
    }

    if (activeTool === 'furniture') {
      if (!onUpdatePlan) return;
      const cat = getCatalogItem(activeFurnitureType);
      const newFurnRaw: FurnitureData = {
        id: `furn-cad-${Date.now()}`,
        type: cat.type,
        label: pickText(language, cat.labelAr, cat.labelFr, cat.labelEn),
        x: Number((mx - cat.defaultWidth / 2).toFixed(2)),
        y: Number((my - cat.defaultDepth / 2).toFixed(2)),
        width: cat.defaultWidth,
        depth: cat.defaultDepth,
        height: cat.defaultHeight,
        color: cat.defaultColor,
        scale: 1,
        rotation: 0,
        floor: activeFloor,
      };
      const clamped = clampFurnitureToRoom(newFurnRaw, plan.rooms, L, W, true);
      commitPlan({
        ...plan,
        params: { ...plan.params, showFurniture: true },
        furniture: [...plan.furniture, clamped],
      });
      onSelectEntity?.({ kind: 'furniture', id: clamped.id });
      return;
    }

    const hit = hitTestEntity(mx, my);

    if (activeTool === 'delete') {
      if (!onUpdatePlan || !hit) return;
      if (hit.kind === 'furniture') {
        commitPlan({ ...plan, furniture: plan.furniture.filter((f) => f.id !== hit.id) });
      } else if (hit.kind === 'opening') {
        commitPlan({ ...plan, openings: plan.openings.filter((o) => o.id !== hit.id) });
      } else if (hit.kind === 'wall') {
        const nextWalls = plan.walls.filter((w) => w.id !== hit.id);
        const nextRooms = detectClosedRoomsFromWalls(nextWalls, plan.rooms, activeFloor);
        commitPlan({ ...plan, walls: nextWalls, rooms: nextRooms });
      }
      onSelectEntity?.(null);
      return;
    }

    // Select or Move
    onSelectEntity?.(hit);
    if (hit?.kind === 'room') {
      const rm = floorRooms.find((r) => r.id === hit.id) || null;
      setSelectedRoomLocal(rm);
      setSelectedColLocal(null);
      if (activeTool === 'move' && rm) {
        setDragState({ kind: 'room', id: rm.id, grabOffsetX: mx - rm.x, grabOffsetY: my - rm.y });
      }
    } else if (hit?.kind === 'column') {
      setSelectedColLocal(floorColumns.find((c) => c.id === hit.id) || null);
      setSelectedRoomLocal(null);
    } else if (hit?.kind === 'furniture' && activeTool === 'move') {
      const fn = floorFurniture.find((f) => f.id === hit.id);
      if (fn) {
        setDragState({ kind: 'furniture', id: fn.id, grabOffsetX: mx - fn.x, grabOffsetY: my - fn.y });
      }
    } else if (hit?.kind === 'wall' && activeTool === 'move') {
      const wl = floorWalls.find((w) => w.id === hit.id);
      if (wl) {
        const d1 = Math.hypot(mx - wl.x1, my - wl.y1);
        const d2 = Math.hypot(mx - wl.x2, my - wl.y2);
        setDragState({ kind: d1 < d2 ? 'wall_p1' : 'wall_p2', id: wl.id });
      }
    } else if (!hit) {
      setSelectedRoomLocal(null);
      setSelectedColLocal(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { mx, my } = clientToMeters(e);

    if (draftStart && (activeTool === 'wall' || activeTool === 'room')) {
      const snapped = snapPointToWalls(mx, my, floorWalls, 0.3);
      // Orthogonal snap assist when close to horizontal/vertical
      if (activeTool === 'wall') {
        if (Math.abs(snapped.x - draftStart.x) < 0.25) snapped.x = draftStart.x;
        if (Math.abs(snapped.y - draftStart.y) < 0.25) snapped.y = draftStart.y;
      }
      setDraftEnd({ x: snapped.x, y: snapped.y });
      return;
    }

    if (activeTool === 'measure' && draftStart) {
      setMeasureLine({ x1: draftStart.x, y1: draftStart.y, x2: mx, y2: my });
      return;
    }

    if (dragState && onUpdatePlan) {
      if (dragState.kind === 'furniture') {
        const target = plan.furniture.find((f) => f.id === dragState.id);
        if (!target) return;
        const moved = clampFurnitureToRoom(
          { ...target, x: mx - dragState.grabOffsetX, y: my - dragState.grabOffsetY },
          plan.rooms,
          L,
          W,
          true
        );
        commitPlan({
          ...plan,
          furniture: plan.furniture.map((f) => (f.id === moved.id ? moved : f)),
        });
      } else if (dragState.kind === 'room') {
        const rm = plan.rooms.find((r) => r.id === dragState.id);
        if (!rm) return;
        const nx = Number(Math.max(0.2, Math.min(L - rm.width - 0.2, mx - dragState.grabOffsetX)).toFixed(1));
        const ny = Number(Math.max(0.2, Math.min(W - rm.length - 0.2, my - dragState.grabOffsetY)).toFixed(1));
        const nextRooms = plan.rooms.map((r) => (r.id === rm.id ? { ...r, x: nx, y: ny } : r));
        commitPlan(updatePlanWithModifiedRooms(plan, nextRooms));
      } else if (dragState.kind === 'wall_p1' || dragState.kind === 'wall_p2') {
        const snapped = snapPointToWalls(mx, my, floorWalls.filter((w) => w.id !== dragState.id), 0.3);
        const nextWalls = plan.walls.map((w) => {
          if (w.id !== dragState.id) return w;
          return dragState.kind === 'wall_p1'
            ? { ...w, x1: snapped.x, y1: snapped.y }
            : { ...w, x2: snapped.x, y2: snapped.y };
        });
        const nextRooms = detectClosedRoomsFromWalls(nextWalls, plan.rooms, activeFloor);
        commitPlan({ ...plan, walls: nextWalls, rooms: nextRooms });
      }
    }
  };

  const handlePointerUp = () => {
    if (draftStart && draftEnd && onUpdatePlan) {
      const dist = Math.hypot(draftEnd.x - draftStart.x, draftEnd.y - draftStart.y);
      if (activeTool === 'wall' && dist >= 0.4) {
        const newWall: WallData = {
          id: `w-cad-${Date.now()}`,
          x1: draftStart.x,
          y1: draftStart.y,
          x2: draftEnd.x,
          y2: draftEnd.y,
          thickness: 0.15,
          isExterior: false,
          wallType: 'interior',
          height: 3.2,
          floor: activeFloor,
        };
        const snappedWalls = addWallWithJunctionSnapping(plan.walls, newWall);
        const detectedRooms = detectClosedRoomsFromWalls(snappedWalls, plan.rooms, activeFloor);
        commitPlan({ ...plan, walls: snappedWalls, rooms: detectedRooms });
        onSelectEntity?.({ kind: 'wall', id: newWall.id });
      } else if (activeTool === 'room') {
        const rx = Number(Math.min(draftStart.x, draftEnd.x).toFixed(1));
        const ry = Number(Math.min(draftStart.y, draftEnd.y).toFixed(1));
        const rw = Number(Math.abs(draftEnd.x - draftStart.x).toFixed(1));
        const rl = Number(Math.abs(draftEnd.y - draftStart.y).toFixed(1));
        if (rw >= 1.4 && rl >= 1.4) {
          const ts = Date.now();
          const boxWalls: WallData[] = [
            { id: `rw-${ts}-1`, x1: rx, y1: ry, x2: rx + rw, y2: ry, thickness: 0.15, isExterior: false, wallType: 'interior', floor: activeFloor },
            { id: `rw-${ts}-2`, x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rl, thickness: 0.15, isExterior: false, wallType: 'interior', floor: activeFloor },
            { id: `rw-${ts}-3`, x1: rx + rw, y1: ry + rl, x2: rx, y2: ry + rl, thickness: 0.15, isExterior: false, wallType: 'interior', floor: activeFloor },
            { id: `rw-${ts}-4`, x1: rx, y1: ry + rl, x2: rx, y2: ry, thickness: 0.15, isExterior: false, wallType: 'interior', floor: activeFloor },
          ];
          let wallsAcc = [...plan.walls];
          for (const bw of boxWalls) wallsAcc = addWallWithJunctionSnapping(wallsAcc, bw);
          const newRoom: RoomData = {
            id: `rm-cad-${ts}`,
            nameAr: 'غرفة مرسومة',
            nameEn: 'Drawn Room',
            x: rx,
            y: ry,
            width: rw,
            length: rl,
            area: Number((rw * rl).toFixed(1)),
            floor: activeFloor,
            color: '#0ea5e9',
            description: 'غرفة أضيفت بالرسم الحر على المخطط.',
            category: 'living',
          };
          commitPlan({ ...plan, walls: wallsAcc, rooms: [...plan.rooms, newRoom] });
          onSelectEntity?.({ kind: 'room', id: newRoom.id });
        }
      }
      setDraftStart(null);
      setDraftEnd(null);
    }
    setDragState(null);
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `arch-ai-blueprint-floor-${activeFloor}.png`;
    link.click();
  };

  const handleDownloadSVG = () => {
    const svg = generateBlueprintSVGString(plan, activeFloor, unit);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arch-ai-blueprint-floor-${activeFloor}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toolsList: { id: EditorTool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: pickText(language, 'تحديد', 'Sélect', 'Select'), icon: <Crosshair className="w-3.5 h-3.5" /> },
    { id: 'move', label: pickText(language, 'تحريك', 'Dépl.', 'Move'), icon: <Move className="w-3.5 h-3.5" /> },
    { id: 'wall', label: pickText(language, 'جدار', 'Mur', 'Wall'), icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'room', label: pickText(language, 'غرفة', 'Pièce', 'Room'), icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'door', label: pickText(language, 'باب', 'Porte', 'Door'), icon: <DoorOpen className="w-3.5 h-3.5" /> },
    { id: 'window', label: pickText(language, 'نافذة', 'Fenêtre', 'Window'), icon: <AppWindow className="w-3.5 h-3.5" /> },
    { id: 'furniture', label: pickText(language, 'أثاث', 'Meuble', 'Furn.'), icon: <Armchair className="w-3.5 h-3.5" /> },
    { id: 'measure', label: pickText(language, 'قياس', 'Mesure', 'Measure'), icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'delete', label: pickText(language, 'حذف', 'Suppr', 'Delete'), icon: <Trash2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
      {/* Top Bar: Floor Tabs, Tool Palette & Exports */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        {/* Floor Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {Array.from({ length: plan.params.floorsCount || 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveFloor(idx)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeFloor === idx
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {idx === 0 ? pickText(language, 'الأرضي', 'RDC', 'Ground') : `${pickText(language, 'ط', 'É', 'F')}${idx}`}
            </button>
          ))}
        </div>

        {/* Unit & View Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {onUnitChange && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onUnitChange('m')}
                className={`px-2 py-1 rounded font-bold ${unit === 'm' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
              >
                m
              </button>
              <button
                type="button"
                onClick={() => onUnitChange('cm')}
                className={`px-2 py-1 rounded font-bold ${unit === 'cm' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
              >
                cm
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
              showGrid ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pickText(language, 'الشبكة', 'Grille', 'Grid')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
              showDimensions ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pickText(language, 'الأبعاد', 'Cotes', 'Dims')}</span>
          </button>

          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button type="button" onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))} className="p-1 text-slate-400 hover:text-white">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setZoom(1)} className="px-1 font-mono text-slate-300">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} className="p-1 text-slate-400 hover:text-white">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadSVG}
            className="flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 rounded-lg font-bold"
            title="Export Vector SVG"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg font-bold"
            title="Export High-Res PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Interactive CAD Drawing Tools Row */}
      {onToolChange && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl">
          {toolsList.map((t) => {
            const active = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToolChange(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  active
                    ? t.id === 'delete'
                      ? 'bg-rose-600 text-white'
                      : 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
          {measureLine && (
            <button
              type="button"
              onClick={() => setMeasureLine(null)}
              className="mr-auto text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded-lg"
            >
              {formatDim(Math.hypot(measureLine.x2 - measureLine.x1, measureLine.y2 - measureLine.y1), unit)} ✕
            </button>
          )}
        </div>
      )}

      {/* Precision Area Bar */}
      <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 text-center">
        <div>
          <span className="text-slate-500">{pickText(language, 'مساحة الأرض:', 'Terrain:', 'Lot Area:')} </span>
          <strong className="text-white font-mono">{plan.specs.totalLandArea} m²</strong>
        </div>
        <div>
          <span className="text-slate-500">{pickText(language, 'مساحة البناء:', 'Bâti:', 'Built Area:')} </span>
          <strong className="text-cyan-400 font-mono">{builtAreaM2} m²</strong>
        </div>
        <div>
          <span className="text-slate-500">{pickText(language, 'غرف الطابق:', 'Pièces:', 'Floor Rooms:')} </span>
          <strong className="text-emerald-400 font-mono">{roomsSumFloor} m²</strong>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-1">
        <canvas
          ref={canvasRef}
          width={920}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full max-w-full h-auto cursor-crosshair rounded-lg touch-none"
        />

        {!onSelectEntity && selectedRoomLocal && (
          <div className="absolute top-3 right-3 bg-slate-900/95 border border-blue-500/50 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between text-blue-400 font-bold">
              <span>{selectedRoomLocal.nameAr}</span>
              <button onClick={() => setSelectedRoomLocal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="text-slate-300">
              {formatDim(selectedRoomLocal.width, unit)} × {formatDim(selectedRoomLocal.length, unit)} ({selectedRoomLocal.area} m²)
            </div>
          </div>
        )}

        {!onSelectEntity && selectedColLocal && (
          <div className="absolute top-3 right-3 bg-slate-900/95 border border-rose-500/50 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>{selectedColLocal.gridAxis}</span>
              <button onClick={() => setSelectedColLocal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="text-slate-300 font-mono">
              ({selectedColLocal.x}m, {selectedColLocal.y}m) — C25/30
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-500 rounded-xs inline-block" /> {pickText(language, 'جدار خارجي', 'Mur Ext.', 'Ext. Wall')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-500 rounded-xs inline-block" /> {pickText(language, 'جدار داخلي', 'Mur Int.', 'Int. Wall')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block" /> {pickText(language, 'عمود', 'Poteau', 'Column')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block" /> {pickText(language, 'باب', 'Porte', 'Door')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-400 rounded-xs inline-block" /> {pickText(language, 'نافذة', 'Fenêtre', 'Window')}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowRoomFills(!showRoomFills)}
          className="flex items-center gap-1 text-slate-400 hover:text-white"
        >
          <Layers className="w-3 h-3" />
          <span>{showRoomFills ? pickText(language, 'إخفاء تعبئة الغرف', 'Masquer fonds', 'Hide Room Fills') : pickText(language, 'إظهار تعبئة الغرف', 'Afficher fonds', 'Show Room Fills')}</span>
        </button>
      </div>
    </div>
  );
};
