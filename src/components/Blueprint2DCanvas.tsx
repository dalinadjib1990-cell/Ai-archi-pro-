import React, { useRef, useEffect, useState } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Eye,
  EyeOff,
  Grid,
  Box,
  Compass,
  Info
} from 'lucide-react';
import { GeneratedHousePlan, RoomData, ColumnData } from '../types';

interface Blueprint2DCanvasProps {
  plan: GeneratedHousePlan;
}

export const Blueprint2DCanvas: React.FC<Blueprint2DCanvasProps> = ({ plan }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Floor Selection (0 = Ground, 1 = First, 2 = Second)
  const [activeFloor, setActiveFloor] = useState<number>(0);

  // Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);

  // Layer Toggles
  const [showColumns, setShowColumns] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showFurniture, setShowFurniture] = useState<boolean>(true);
  const [showRoomFills, setShowRoomFills] = useState<boolean>(true);

  // Clicked Room / Column Selection for detail popover
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnData | null>(null);

  const L = plan.params.length || 15;
  const W = plan.params.width || 10;

  // Filter items by active floor
  const floorRooms = plan.rooms.filter((r) => r.floor === activeFloor);
  const floorColumns = plan.columns; // columns span floors
  const floorWalls = plan.walls.filter((w) => w.floor === activeFloor);
  const floorOpenings = plan.openings.filter((o) => o.floor === activeFloor);
  const floorFurniture = plan.furniture.filter((f) => f.floor === activeFloor);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas internal width & height
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear background (Dark CAD Blueprint theme)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Scaling factors to map meters to pixels
    const margin = 70;
    const availW = canvasWidth - margin * 2;
    const availH = canvasHeight - margin * 2;
    const scale = Math.min(availW / L, availH / W) * zoom;

    const offsetX = (canvasWidth - L * scale) / 2;
    const offsetY = (canvasHeight - W * scale) / 2;

    const toPxX = (mX: number) => offsetX + mX * scale;
    const toPxY = (mY: number) => offsetY + mY * scale;

    // 1. Draw Grid Lines & Axes Labels
    if (showGrid) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      // Vertical grid lines (every 1 meter)
      for (let x = 0; x <= L; x += 1) {
        const px = toPxX(x);
        ctx.beginPath();
        ctx.moveTo(px, offsetY - 20);
        ctx.lineTo(px, offsetY + W * scale + 20);
        ctx.stroke();

        // Label meters
        if (x % 2 === 0 || x === L) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${x}م`, px, offsetY - 25);
        }
      }

      // Horizontal grid lines (every 1 meter)
      for (let y = 0; y <= W; y += 1) {
        const py = toPxY(y);
        ctx.beginPath();
        ctx.moveTo(offsetX - 20, py);
        ctx.lineTo(offsetX + L * scale + 20, py);
        ctx.stroke();

        if (y % 2 === 0 || y === W) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${y}م`, offsetX - 25, py + 3);
        }
      }
    }

    // 2. Draw Lot Boundary & Open vs Closed Facade Indicators
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

    drawBoundaryEdge(bx0, by1, bx1, by1, openDirs.includes('front'), openDirs.includes('front') ? 'واجهة أمامية مفتوحة (الشارع)' : 'واجهة أمامية مغلقة', (bx0 + bx1) / 2, by1 + 18);
    drawBoundaryEdge(bx0, by0, bx1, by0, openDirs.includes('back'), openDirs.includes('back') ? 'واجهة خلفية مفتوحة' : 'جدار جار خلفي (أصم)', (bx0 + bx1) / 2, by0 - 10);
    drawBoundaryEdge(bx0, by0, bx0, by1, openDirs.includes('left'), openDirs.includes('left') ? 'يسار مفتوح' : 'جار يسار', bx0 - 32, (by0 + by1) / 2);
    drawBoundaryEdge(bx1, by0, bx1, by1, openDirs.includes('right'), openDirs.includes('right') ? 'يمين مفتوح' : 'جار يمين', bx1 + 32, (by0 + by1) / 2);

    // 3. Draw Rooms with Fills & Labels
    floorRooms.forEach((r) => {
      const rx = toPxX(r.x);
      const ry = toPxY(r.y);
      const rw = r.width * scale;
      const rh = r.length * scale;

      // Room Fill
      if (showRoomFills) {
        ctx.fillStyle = r.color + '25'; // 15% opacity hex
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Room Border
      const isSelected = selectedRoom?.id === r.id;
      ctx.strokeStyle = isSelected ? '#38bdf8' : r.color + 'aa';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeRect(rx, ry, rw, rh);

      // Room Text Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const centerX = rx + rw / 2;
      const centerY = ry + rh / 2;

      ctx.fillText(r.nameAr, centerX, centerY - 8);

      // Area tag
      if (showDimensions) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${r.width}م × ${r.length}م (${r.area} م²)`, centerX, centerY + 8);
      }
    });

    // 4. Draw Walls (Exterior & Interior)
    floorWalls.forEach((w) => {
      const x1 = toPxX(w.x1);
      const y1 = toPxY(w.y1);
      const x2 = toPxX(w.x2);
      const y2 = toPxY(w.y2);

      ctx.strokeStyle = w.isExterior ? '#0284c7' : '#475569';
      ctx.lineWidth = Math.max(2, w.thickness * scale);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // 5. Draw Furniture
    if (showFurniture) {
      floorFurniture.forEach((f) => {
        const fx = toPxX(f.x);
        const fy = toPxY(f.y);
        const fw = f.width * scale;
        const fh = f.depth * scale;

        ctx.fillStyle = '#33415555';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.fillRect(fx, fy, fw, fh);
        ctx.strokeRect(fx, fy, fw, fh);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.label, fx + fw / 2, fy + fh / 2 + 2);
      });
    }

    // 6. Draw Openings (Doors & Windows) respecting rotation (0/180 horizontal, 90/270 vertical)
    floorOpenings.forEach((op) => {
      const ox = toPxX(op.x);
      const oy = toPxY(op.y);
      const ow = op.width * scale;
      const isVertical = op.rotation === 90 || op.rotation === 270;

      if (op.type === 'door') {
        if (isVertical) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ox - 4, oy, 8, ow);

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(op.rotation === 270 ? ox - ow : ox + ow, oy);
          ctx.stroke();

          ctx.strokeStyle = '#f59e0b88';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (op.rotation === 270) {
            ctx.arc(ox, oy, ow, Math.PI / 2, Math.PI);
          } else {
            ctx.arc(ox, oy, ow, 0, Math.PI / 2);
          }
          ctx.stroke();
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ox, oy - 4, ow, 8);

          const swingUp = op.y > W / 2;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox, swingUp ? oy - ow : oy + ow);
          ctx.stroke();

          ctx.strokeStyle = '#f59e0b88';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (swingUp) {
            ctx.arc(ox, oy, ow, -Math.PI / 2, 0);
          } else {
            ctx.arc(ox, oy, ow, 0, Math.PI / 2);
          }
          ctx.stroke();
        }
      } else if (op.type === 'window') {
        if (isVertical) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ox - 4, oy, 8, ow);

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(ox - 3, oy, 6, ow);
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox, oy + ow);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ox, oy - 4, ow, 8);

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(ox, oy - 3, ow, 6);
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + ow, oy);
          ctx.stroke();
        }
      }
    });

    // 7. Draw Structural Columns (الأعمدة الخرسانية)
    if (showColumns) {
      floorColumns.forEach((col) => {
        const cx = toPxX(col.x);
        const cy = toPxY(col.y);
        const cw = (col.sizeX || 0.25) * scale;
        const ch = (col.sizeY || 0.5) * scale;

        const isColSelected = selectedColumn?.id === col.id;

        // Solid Concrete Column Post
        ctx.fillStyle = isColSelected ? '#ef4444' : '#f43f5e';
        ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - cw / 2, cy - ch / 2, cw, ch);

        // Column Axis Label Tag
        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(col.gridAxis, cx, cy - ch / 2 - 4);
      });
    }

    // 8. Scale Ruler Bar (Bottom Left)
    const rulerMeters = 5;
    const rulerPx = rulerMeters * scale;
    const rx = 30;
    const ry = canvasHeight - 25;

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
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`مقياس الرسم: ${rulerMeters} أمتار`, rx, ry - 8);

    // North Arrow Indicator
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('⬆ الشمال (North)', canvasWidth - 25, 30);
  }, [
    plan,
    activeFloor,
    zoom,
    showColumns,
    showGrid,
    showDimensions,
    showFurniture,
    showRoomFills,
    selectedRoom,
    selectedColumn,
  ]);

  // Handle Canvas Click to select room or column
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert pixels to meters
    const margin = 70;
    const availW = canvas.width - margin * 2;
    const availH = canvas.height - margin * 2;
    const scale = Math.min(availW / L, availH / W) * zoom;
    const offsetX = (canvas.width - L * scale) / 2;
    const offsetY = (canvas.height - W * scale) / 2;

    const clickMeterX = (clickX - offsetX) / scale;
    const clickMeterY = (clickY - offsetY) / scale;

    // Check column click
    const clickedCol = floorColumns.find((c) => {
      return Math.abs(c.x - clickMeterX) < 0.8 && Math.abs(c.y - clickMeterY) < 0.8;
    });

    if (clickedCol) {
      setSelectedColumn(clickedCol);
      setSelectedRoom(null);
      return;
    }

    // Check room click
    const clickedRm = floorRooms.find((r) => {
      return (
        clickMeterX >= r.x &&
        clickMeterX <= r.x + r.width &&
        clickMeterY >= r.y &&
        clickMeterY <= r.y + r.length
      );
    });

    if (clickedRm) {
      setSelectedRoom(clickedRm);
      setSelectedColumn(null);
    } else {
      setSelectedRoom(null);
      setSelectedColumn(null);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `blueprint-2d-${plan.params.style}-floor-${activeFloor}.png`;
    link.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Top Bar: Floor Tabs & Layer Control Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Floor Selection Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
          {Array.from({ length: plan.params.floorsCount || 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFloor(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFloor === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {idx === 0 ? 'الطابق الأرضي' : idx === 1 ? 'الطابق الأول' : `الطابق ${idx + 1}`}
            </button>
          ))}
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setShowColumns(!showColumns)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              showColumns ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>الأعمدة ({plan.columns.length})</span>
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              showGrid ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>الشبكة</span>
          </button>

          <button
            onClick={() => setShowFurniture(!showFurniture)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              showFurniture ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>الأثاث</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.15))} className="p-1 hover:text-white text-slate-400">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom(1)} className="px-1 text-[11px] font-mono text-slate-300">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} className="p-1 hover:text-white text-slate-400">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 rounded-lg"
            title="تحميل صورة المخطط ثنائي الأبعاد"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير PNG</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onClick={handleCanvasClick}
          className="w-full max-w-full h-auto cursor-crosshair rounded-lg"
        />

        {/* Selected Room / Column Detail Popover */}
        {selectedRoom && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-blue-500/50 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1.5 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-blue-400 font-bold border-b border-slate-800 pb-1">
              <span>{selectedRoom.nameAr}</span>
              <button onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="text-slate-300">
              المقاس: <strong>{selectedRoom.width} × {selectedRoom.length} متر</strong>
            </div>
            <div className="text-slate-300">
              المساحة: <strong className="text-cyan-400">{selectedRoom.area} م²</strong>
            </div>
            <div className="text-slate-400 text-[11px] leading-relaxed pt-1">
              {selectedRoom.description}
            </div>
          </div>
        )}

        {selectedColumn && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-rose-500/50 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-1.5 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-rose-400 font-bold border-b border-slate-800 pb-1">
              <span>عمود خرساني {selectedColumn.gridAxis}</span>
              <button onClick={() => setSelectedColumn(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="text-slate-300">
              الموقع (X, Y): <strong>{selectedColumn.x}م , {selectedColumn.y}م</strong>
            </div>
            <div className="text-slate-300">
              المقطع العرضي: <strong>20 × 50 سم (C25/30)</strong>
            </div>
            <div className="text-slate-400 text-[11px]">
              امتداد العمود: {selectedColumn.floorSpan}
            </div>
          </div>
        )}
      </div>

      {/* Blueprint Legend / Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-blue-600 rounded-xs inline-block" />
            <span>جدار خارجي (25سم)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-600 rounded-xs inline-block" />
            <span>جدار داخلي (15سم)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-500 rounded-xs inline-block" />
            <span>عمود خرساني مسلّح</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-500 rounded-xs inline-block" />
            <span>فتحة باب</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          انقر على أي غرفة أو عمود للاطلاع على الأبعاد والمواصفات
        </div>
      </div>
    </div>
  );
};
