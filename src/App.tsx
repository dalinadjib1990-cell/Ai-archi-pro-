import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Layers,
  Calculator,
  Image,
  Sparkles,
  AlertCircle,
  Check,
  RotateCw,
  Sliders,
  Shuffle,
  Columns2,
  ScanSearch,
  Bot,
  PenTool,
  Move,
  Crosshair,
  DoorOpen,
  AppWindow,
  Armchair,
  Ruler,
  ChevronUp,
  ChevronDown,
  Save,
} from 'lucide-react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { Blueprint2DCanvas } from './components/Blueprint2DCanvas';
import { House3DViewer } from './components/House3DViewer';
import { StructuralReport } from './components/StructuralReport';
import { FacadeGallery } from './components/FacadeGallery';
import { PrintReportModal } from './components/PrintReportModal';
import { RoomEditor } from './components/RoomEditor';
import { PropertiesInspector } from './components/PropertiesInspector';
import { LayersAndSitePanel } from './components/LayersAndSitePanel';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { DesignAnalyzerPanel } from './components/DesignAnalyzerPanel';
import { ProjectsModal } from './components/ProjectsModal';
import {
  AIAssistantCommandEntry,
  AppLanguage,
  ArchProjectRecord,
  Currency,
  DEFAULT_LAYERS,
  EditorTool,
  FurnitureCatalogType,
  GeneratedHousePlan,
  HouseInputParams,
  LayerVisibilityMap,
  MeasurementUnit,
  SelectedEntity,
  SiteSettings,
  WorkspaceViewMode,
} from './types';
import { DEFAULT_HOUSE_PLAN } from './data/presetTemplates';
import {
  generateMultipleProceduralOptions,
  generateProceduralPlan,
} from './utils/proceduralGenerator';
import { DEFAULT_COST_RATES_DZD } from './utils/costEstimator';
import { smartFurnishPlan } from './utils/cadGeometry';
import {
  createDefaultSiteSettings,
  createProjectRecord,
  deleteProjectRecord,
  getActiveProjectId,
  loadAllProjects,
  upsertProjectRecord,
} from './utils/projectStorage';
import { pickText } from './utils/i18n';

export default function App() {
  // Initialize active project from localStorage cleanly
  const initialProject = useMemo<ArchProjectRecord>(() => {
    const savedList = loadAllProjects();
    const activeId = getActiveProjectId();
    const found = savedList.find((p) => p.id === activeId) || savedList[0];
    if (found) return found;
    const starterPlans = generateMultipleProceduralOptions(DEFAULT_HOUSE_PLAN.params);
    return createProjectRecord('فيلا عصرية — مشروع 01', starterPlans[0]);
  }, []);

  const [projects, setProjects] = useState<ArchProjectRecord[]>(() => {
    const list = loadAllProjects();
    return list.length > 0 ? list : [initialProject];
  });
  const [activeProjectId, setActiveProjectId] = useState<string>(initialProject.id);
  const [projectName, setProjectName] = useState<string>(initialProject.info.name);
  const [projectCreatedAt, setProjectCreatedAt] = useState<string>(initialProject.info.createdAt);

  const [params, setParams] = useState<HouseInputParams>(() => ({
    ...initialProject.plan.params,
  }));
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedHousePlan[]>(() => {
    const opts = generateMultipleProceduralOptions(initialProject.plan.params);
    opts[0] = initialProject.plan;
    return opts;
  });
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);

  // Undo & Redo history stacks for live editing
  const [undoStack, setUndoStack] = useState<GeneratedHousePlan[]>([]);
  const [redoStack, setRedoStack] = useState<GeneratedHousePlan[]>([]);

  // Workspace Settings
  const [language, setLanguage] = useState<AppLanguage>(initialProject.settings?.language || 'ar');
  const [currency, setCurrency] = useState<Currency>(initialProject.settings?.currency || 'DZD');
  const [unit, setUnit] = useState<MeasurementUnit>(initialProject.settings?.unit || 'm');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceViewMode>('3d');
  const [bottomPanel, setBottomPanel] = useState<
    'none' | 'rooms' | 'specs' | 'facades' | 'layers' | 'analyze' | 'ai'
  >('rooms');

  // Interactive CAD & 3D States
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [activeFloor2D, setActiveFloor2D] = useState<number>(0);
  const [activeFurnitureType, setActiveFurnitureType] = useState<FurnitureCatalogType>('sofa');
  const [layers, setLayers] = useState<LayerVisibilityMap>(() => ({
    ...DEFAULT_LAYERS,
    ...(initialProject.layers || {}),
  }));
  const [explodedAmount, setExplodedAmount] = useState<number>(
    initialProject.camera?.explodedAmount ?? 0
  );
  const [viewMode3D, setViewMode3D] = useState<'realistic' | 'structural' | 'night'>(
    initialProject.camera?.viewMode || 'realistic'
  );
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() =>
    initialProject.site || createDefaultSiteSettings(initialProject.plan)
  );
  const [costRatesDZD, setCostRatesDZD] = useState<
    Record<string, { material: number; labor: number }>
  >(() => ({
    ...DEFAULT_COST_RATES_DZD,
    ...(initialProject.costRatesDZD || {}),
  }));
  const [assistantLog, setAssistantLog] = useState<AIAssistantCommandEntry[]>(
    initialProject.assistantLog || []
  );

  // Modals & UI flags
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showProjectsModal, setShowProjectsModal] = useState<boolean>(false);
  const [showDock, setShowDock] = useState<boolean>(true);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiSuccessBadge, setAiSuccessBadge] = useState<string | null>(null);
  const [alternativeVariantCounter, setAlternativeVariantCounter] = useState<number>(1);

  const currentPlan =
    generatedPlans[selectedOptionIndex] || generatedPlans[0] || DEFAULT_HOUSE_PLAN;

  // Keep <html dir & lang> synced for Arabic RTL vs French/English LTR
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Autosave active project record cleanly whenever key state updates
  useEffect(() => {
    const rec = createProjectRecord(projectName, currentPlan, {
      id: activeProjectId,
      info: {
        name: projectName,
        createdAt: projectCreatedAt,
        updatedAt: new Date().toISOString(),
        version: '2.0.0',
        author: 'ARCH-AI PRO Studio',
      },
      site: siteSettings,
      layers,
      costRatesDZD,
      camera: {
        preset: 'iso',
        explodedAmount,
        selectedFloor3D: 'all',
        viewMode: viewMode3D,
      },
      settings: { language, currency, unit },
      assistantLog,
    });
    const nextList = upsertProjectRecord(rec);
    setProjects(nextList);
  }, [
    activeProjectId,
    projectName,
    projectCreatedAt,
    currentPlan,
    siteSettings,
    layers,
    costRatesDZD,
    explodedAmount,
    viewMode3D,
    language,
    currency,
    unit,
    assistantLog,
  ]);

  // Commit edited plan with Undo/Redo support
  const applyPlanUpdateWithUndo = (nextPlan: GeneratedHousePlan, badgeMsg?: string) => {
    setUndoStack((prev) => [...prev.slice(-24), currentPlan]);
    setRedoStack([]);
    setGeneratedPlans((prev) => {
      const copy = [...prev];
      copy[selectedOptionIndex] = nextPlan;
      return copy;
    });
    setParams(nextPlan.params);
    if (nextPlan.params.siteSettings) {
      setSiteSettings(nextPlan.params.siteSettings);
    }
    if (badgeMsg) setAiSuccessBadge(badgeMsg);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevPlan = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, currentPlan]);
    setGeneratedPlans((prev) => {
      const copy = [...prev];
      copy[selectedOptionIndex] = prevPlan;
      return copy;
    });
    setParams(prevPlan.params);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextPlan = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((s) => [...s, currentPlan]);
    setGeneratedPlans((prev) => {
      const copy = [...prev];
      copy[selectedOptionIndex] = nextPlan;
      return copy;
    });
    setParams(nextPlan.params);
  };

  const handleManualSave = () => {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  // Detect unapplied parameter edits
  const hasUnappliedInputChanges = useMemo(() => {
    if (!currentPlan?.params) return false;
    const curDirs = (currentPlan.params.openFacadeDirections || []).join(',');
    const nextDirs = (params.openFacadeDirections || []).join(',');
    return (
      params.length !== currentPlan.params.length ||
      params.width !== currentPlan.params.width ||
      params.bedroomsCount !== currentPlan.params.bedroomsCount ||
      params.bathroomsCount !== currentPlan.params.bathroomsCount ||
      params.floorsCount !== currentPlan.params.floorsCount ||
      params.facadesCount !== currentPlan.params.facadesCount ||
      nextDirs !== curDirs ||
      params.hasMajlis !== currentPlan.params.hasMajlis ||
      params.hasGarage !== currentPlan.params.hasGarage ||
      params.hasGarden !== currentPlan.params.hasGarden ||
      params.hasBalcony !== currentPlan.params.hasBalcony ||
      params.hasStairs !== currentPlan.params.hasStairs ||
      params.hasCourtyard !== currentPlan.params.hasCourtyard ||
      params.roofType !== currentPlan.params.roofType ||
      params.targetBuiltArea !== currentPlan.params.targetBuiltArea ||
      params.style !== currentPlan.params.style ||
      params.lotShape !== currentPlan.params.lotShape ||
      params.facadeWallColor !== currentPlan.params.facadeWallColor
    );
  }, [params, currentPlan]);

  // AI Generation (preserves 3-option generation + Gemini 4 Hydrogen)
  const handleGenerate = async (overrideParams?: HouseInputParams) => {
    const activeParams = { ...(overrideParams || params), siteSettings };
    setIsGenerating(true);
    setErrorMsg(null);
    setAiSuccessBadge(null);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeParams),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && data.plans && data.plans.length > 0) {
        setUndoStack((prev) => [...prev.slice(-24), currentPlan]);
        setRedoStack([]);
        setGeneratedPlans(data.plans);
        setSelectedOptionIndex(0);
        setAiSuccessBadge(
          data.source === 'gemini'
            ? pickText(
                language,
                `تم التوليد بنجاح عبر (${data.modelUsed || 'Gemini 4 Hydrogen'})`,
                `Généré par IA (${data.modelUsed || 'Gemini 4 Hydrogen'})`,
                `Generated via AI (${data.modelUsed || 'Gemini 4 Hydrogen'})`
              )
            : pickText(
                language,
                'تم إنشاء 3 نماذج معمارية مخصصة لمدخلاتك وواجهاتك',
                '3 plans générés selon vos paramètres',
                'Generated 3 custom architectural plans matching your specs'
              )
        );
      } else {
        throw new Error('Empty plans');
      }
    } catch {
      const fallbackPlans = generateMultipleProceduralOptions(activeParams);
      setUndoStack((prev) => [...prev.slice(-24), currentPlan]);
      setGeneratedPlans(fallbackPlans);
      setSelectedOptionIndex(0);
      setAiSuccessBadge(
        pickText(
          language,
          'تم إنشاء 3 نماذج معمارية مخصصة لمدخلاتك بدقة',
          '3 variantes paramétriques générées',
          'Generated 3 parametric floor plan variations'
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAlternative = () => {
    const nextVariant = (alternativeVariantCounter + 1) % 5;
    setAlternativeVariantCounter(nextVariant);
    const newAlt = generateProceduralPlan({ ...params, siteSettings }, nextVariant);
    applyPlanUpdateWithUndo(newAlt, newAlt.optionTitle);
  };

  const handleReset = () => {
    const freshParams = { ...DEFAULT_HOUSE_PLAN.params };
    setParams(freshParams);
    setSiteSettings(createDefaultSiteSettings(DEFAULT_HOUSE_PLAN));
    const defaultOptions = generateMultipleProceduralOptions(freshParams);
    setGeneratedPlans(defaultOptions);
    setSelectedOptionIndex(0);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedEntity(null);
    setErrorMsg(null);
    setAiSuccessBadge(null);
  };

  // Multi-project Handlers
  const loadProjectIntoState = (proj: ArchProjectRecord) => {
    setActiveProjectId(proj.id);
    setProjectName(proj.info.name);
    setProjectCreatedAt(proj.info.createdAt);
    setParams({ ...proj.plan.params });
    const opts = generateMultipleProceduralOptions(proj.plan.params);
    opts[0] = proj.plan;
    setGeneratedPlans(opts);
    setSelectedOptionIndex(0);
    setSiteSettings(proj.site || createDefaultSiteSettings(proj.plan));
    setLayers({ ...DEFAULT_LAYERS, ...(proj.layers || {}) });
    setCostRatesDZD({ ...DEFAULT_COST_RATES_DZD, ...(proj.costRatesDZD || {}) });
    setAssistantLog(proj.assistantLog || []);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedEntity(null);
  };

  const handleCreateNewProject = () => {
    const fresh = generateMultipleProceduralOptions(DEFAULT_HOUSE_PLAN.params)[0];
    const np = createProjectRecord(`مشروع ${projects.length + 1}`, fresh);
    setProjects((prev) => [np, ...prev]);
    loadProjectIntoState(np);
  };

  const handleDuplicateProject = (proj: ArchProjectRecord) => {
    const dup = createProjectRecord(`${proj.info.name} (نسخة)`, proj.plan, {
      ...proj,
      id: `proj-dup-${Date.now()}`,
      info: {
        ...proj.info,
        name: `${proj.info.name} (نسخة)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    const next = upsertProjectRecord(dup);
    setProjects(next);
    loadProjectIntoState(dup);
  };

  const handleDeleteProject = (id: string) => {
    const remaining = deleteProjectRecord(id);
    setProjects(remaining);
    if (id === activeProjectId && remaining[0]) {
      loadProjectIntoState(remaining[0]);
    }
  };

  const selectedRoomIdFor3D =
    selectedEntity?.kind === 'room' ? selectedEntity.id : null;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#020617] text-slate-100 font-sans antialiased flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))] pointer-events-none" />

      {/* Unified Top Studio Bar */}
      <Header
        projectName={projectName}
        onChangeProjectName={setProjectName}
        onSaveProject={handleManualSave}
        justSaved={justSaved}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onOpenProjects={() => setShowProjectsModal(true)}
        language={language}
        onChangeLanguage={setLanguage}
        unit={unit}
        onChangeUnit={setUnit}
        currency={currency}
        setCurrency={setCurrency}
        onPrint={() => setShowPrintModal(true)}
        onReset={handleReset}
        isGenerating={isGenerating}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto px-2.5 py-4 sm:p-5 space-y-5 relative z-10 min-w-0 pb-24">
        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-3 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full min-w-0">
          {/* Left Column: Inputs & Natural Language Generator */}
          <div className="lg:col-span-4 xl:col-span-4 min-w-0 w-full space-y-4">
            <InputForm
              params={params}
              setParams={setParams}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              unit={unit}
              language={language}
            />
          </div>

          {/* Right Column: Interactive CAD + 3D Studio */}
          <div className="lg:col-span-8 xl:col-span-8 min-w-0 w-full space-y-4">
            {aiSuccessBadge && (
              <div className="bg-gradient-to-r from-cyan-950/85 via-slate-900/90 to-blue-950/85 border border-cyan-500/45 rounded-2xl p-3 text-xs text-cyan-200 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">{aiSuccessBadge}</span>
                    <span className="text-[11px] text-cyan-300/80">
                      {currentPlan.params.length}×{currentPlan.params.width}m | {currentPlan.params.bedroomsCount} Beds | {currentPlan.params.floorsCount}F | {currentPlan.params.style}
                    </span>
                  </div>
                </div>
                <button onClick={() => setAiSuccessBadge(null)} className="text-slate-400 hover:text-white px-2">✕</button>
              </div>
            )}

            {hasUnappliedInputChanges && (
              <div className="bg-amber-950/60 border border-amber-500/45 rounded-2xl p-3 text-xs text-amber-200 flex items-center justify-between gap-3">
                <span>
                  {pickText(language, 'تم تعديل المدخلات — اضغط لتوليد النماذج الجديدة', 'Paramètres modifiés — régénérez les plans', 'Inputs changed — regenerate architectural plans')}
                </span>
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{pickText(language, 'تحديث النماذج', 'Régénérer', 'Regenerate')}</span>
                </button>
              </div>
            )}

            {/* 3-Option Architectural Selector + Alternative Layout */}
            <div className="bg-slate-900/80 border border-cyan-500/35 rounded-2xl p-3.5 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <h3 className="text-xs font-bold text-white">
                    {pickText(language, `خيارات التوليد (${generatedPlans.length} نماذج)`, `Options IA (${generatedPlans.length})`, `AI Plan Options (${generatedPlans.length})`)}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleGenerateAlternative}
                    disabled={isGenerating}
                    className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>{pickText(language, 'توليد تصميم آخر', 'Autre variante', 'Alternative Layout')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={isGenerating}
                    className="px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{pickText(language, 'توليد أفكار جديدة', 'Nouvelles idées', 'New AI Options')}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {generatedPlans.map((planOption, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  return (
                    <button
                      key={planOption.id || idx}
                      type="button"
                      onClick={() => setSelectedOptionIndex(idx)}
                      className={`p-2.5 rounded-xl border text-right transition-all relative ${
                        isSelected
                          ? 'bg-cyan-950/75 border-cyan-400 text-white ring-1 ring-cyan-400/50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 left-2 bg-cyan-500 text-slate-950 p-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                      <div className="text-[10px] font-bold text-cyan-400">0{idx + 1}</div>
                      <div className="font-bold text-xs text-white line-clamp-1">{planOption.optionTitle || `Option ${idx + 1}`}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{planOption.rooms.length} Rooms</span>
                        <span>{planOption.columns.length} Cols</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Viewport Mode Switcher: 3D | 2D | Split */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/75 border border-slate-800 rounded-2xl p-1.5">
              <div className="flex items-center gap-1 flex-1 min-w-[240px]">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('3d')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    workspaceMode === '3d' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>{pickText(language, 'نموذج 3D', 'Vue 3D', '3D View')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('2d')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    workspaceMode === '2d' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{pickText(language, 'محرر المخطط 2D', 'Plan 2D CAD', '2D CAD Plan')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('split')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    workspaceMode === 'split' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns2 className="w-4 h-4" />
                  <span>{pickText(language, 'عرض مزدوج Split', 'Vue Partagée', 'Split View')}</span>
                </button>
              </div>
            </div>

            {/* Active Workspace Canvas(es) */}
            <div className={workspaceMode === 'split' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 items-start' : 'space-y-4'}>
              {(workspaceMode === '3d' || workspaceMode === 'split') && (
                <House3DViewer
                  plan={currentPlan}
                  layers={layers}
                  explodedAmount={explodedAmount}
                  onExplodedChange={setExplodedAmount}
                  viewModeExternal={viewMode3D}
                  onViewModeChange={setViewMode3D}
                  language={language}
                  selectedRoomId={selectedRoomIdFor3D}
                />
              )}

              {(workspaceMode === '2d' || workspaceMode === 'split') && (
                <Blueprint2DCanvas
                  plan={currentPlan}
                  activeTool={activeTool}
                  onToolChange={setActiveTool}
                  unit={unit}
                  onUnitChange={setUnit}
                  selectedEntity={selectedEntity}
                  onSelectEntity={setSelectedEntity}
                  onUpdatePlan={(up) => applyPlanUpdateWithUndo(up)}
                  layers={layers}
                  activeFurnitureType={activeFurnitureType}
                  activeFloorExternal={activeFloor2D}
                  onFloorChange={setActiveFloor2D}
                  language={language}
                />
              )}
            </div>

            {/* Live Properties Inspector (Always synced when editing 2D/Split or Rooms) */}
            {(workspaceMode === '2d' || workspaceMode === 'split' || selectedEntity) && (
              <PropertiesInspector
                plan={currentPlan}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                onUpdatePlan={(up) => applyPlanUpdateWithUndo(up)}
                activeFloor={activeFloor2D}
                activeFurnitureType={activeFurnitureType}
                onChangeActiveFurnitureType={setActiveFurnitureType}
                unit={unit}
                language={language}
              />
            )}

            {/* Engineering Studio Modules Tabs */}
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap items-center gap-1.5">
              {[
                { id: 'rooms' as const, icon: <Sliders className="w-3.5 h-3.5" />, ar: 'الغرف والأثاث', fr: 'Pièces & Mobilier', en: 'Rooms & Furniture' },
                { id: 'layers' as const, icon: <Layers className="w-3.5 h-3.5" />, ar: 'الطبقات والموقع (13)', fr: 'Calques & Site', en: 'Layers & Site' },
                { id: 'specs' as const, icon: <Calculator className="w-3.5 h-3.5" />, ar: 'التكلفة (12 مرحلة) والكميات', fr: 'Devis & Structure', en: '12-Stage Cost & Qty' },
                { id: 'facades' as const, icon: <Image className="w-3.5 h-3.5" />, ar: 'الواجهات والرفع', fr: 'Façades & Élévations', en: 'Facades & Elevations' },
                { id: 'analyze' as const, icon: <ScanSearch className="w-3.5 h-3.5" />, ar: 'فحص التصميم', fr: 'Audit Design', en: 'Analyze Design' },
                { id: 'ai' as const, icon: <Bot className="w-3.5 h-3.5" />, ar: 'مساعد الذكاء', fr: 'Assistant IA', en: 'AI Assistant' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBottomPanel(t.id)}
                  className={`flex-1 min-w-[115px] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    bottomPanel === t.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {t.icon}
                  <span>{pickText(language, t.ar, t.fr, t.en)}</span>
                </button>
              ))}
            </div>

            {bottomPanel === 'rooms' && (
              <RoomEditor
                plan={currentPlan}
                onUpdatePlan={(up) => applyPlanUpdateWithUndo(up, pickText(language, 'تم تحديث الغرف والأثاث!', 'Mis à jour !', 'Updated rooms & 3D!'))}
                onResetLayout={() => {
                  const fresh = generateProceduralPlan({ ...params, siteSettings }, selectedOptionIndex);
                  applyPlanUpdateWithUndo(fresh);
                }}
                unit={unit}
                language={language}
              />
            )}

            {bottomPanel === 'layers' && (
              <LayersAndSitePanel
                plan={currentPlan}
                layers={layers}
                onChangeLayers={setLayers}
                explodedAmount={explodedAmount}
                onChangeExploded={setExplodedAmount}
                viewMode={viewMode3D}
                onChangeViewMode={setViewMode3D}
                siteSettings={siteSettings}
                onUpdateSiteAndPlan={(nextSite, nextPlan) => {
                  setSiteSettings(nextSite);
                  applyPlanUpdateWithUndo(nextPlan);
                }}
                unit={unit}
                language={language}
              />
            )}

            {bottomPanel === 'specs' && (
              <StructuralReport
                plan={currentPlan}
                currency={currency}
                customRatesDZD={costRatesDZD}
                onChangeCustomRatesDZD={setCostRatesDZD}
                language={language}
              />
            )}

            {bottomPanel === 'facades' && (
              <FacadeGallery
                plan={currentPlan}
                onUpdatePlan={(up) => applyPlanUpdateWithUndo(up)}
                language={language}
              />
            )}

            {bottomPanel === 'analyze' && (
              <DesignAnalyzerPanel
                plan={currentPlan}
                onSelectTarget={(entity, fl) => {
                  setSelectedEntity(entity);
                  if (typeof fl === 'number') setActiveFloor2D(fl);
                  setWorkspaceMode('2d');
                }}
                language={language}
              />
            )}

            {bottomPanel === 'ai' && (
              <AIAssistantPanel
                plan={currentPlan}
                log={assistantLog}
                onApplyPlanEdit={(up, entry) => {
                  setAssistantLog((prev) => [entry, ...prev].slice(0, 30));
                  if (entry.applied) {
                    applyPlanUpdateWithUndo(up, entry.explanation);
                  }
                }}
                onUndo={handleUndo}
                canUndo={undoStack.length > 0}
                language={language}
              />
            )}
          </div>
        </div>
      </main>

      {/* Collapsible Mobile/Desktop Bottom Quick Design Dock */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] print:hidden">
        <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl px-2 py-1.5 flex items-center gap-1 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setShowDock(!showDock)}
            className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 text-[11px] font-bold flex items-center gap-1"
            title="Toggle Quick Dock"
          >
            {showDock ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{pickText(language, 'أدوات الرسم', 'Outils', 'Tools')}</span>
          </button>

          {showDock && (
            <>
              {(
                [
                  { tool: 'select' as EditorTool, icon: <Crosshair className="w-3.5 h-3.5" />, label: pickText(language, 'تحديد', 'Sel', 'Select') },
                  { tool: 'move' as EditorTool, icon: <Move className="w-3.5 h-3.5" />, label: pickText(language, 'تحريك', 'Dép', 'Move') },
                  { tool: 'wall' as EditorTool, icon: <PenTool className="w-3.5 h-3.5" />, label: pickText(language, 'جدار', 'Mur', 'Wall') },
                  { tool: 'door' as EditorTool, icon: <DoorOpen className="w-3.5 h-3.5" />, label: pickText(language, 'باب', 'Prt', 'Door') },
                  { tool: 'window' as EditorTool, icon: <AppWindow className="w-3.5 h-3.5" />, label: pickText(language, 'نافذة', 'Fen', 'Win') },
                  { tool: 'furniture' as EditorTool, icon: <Armchair className="w-3.5 h-3.5" />, label: pickText(language, 'أثاث', 'Mob', 'Furn') },
                  { tool: 'measure' as EditorTool, icon: <Ruler className="w-3.5 h-3.5" />, label: pickText(language, 'قياس', 'Mes', 'Meas') },
                ] as const
              ).map((item) => (
                <button
                  key={item.tool}
                  type="button"
                  onClick={() => {
                    setActiveTool(item.tool);
                    if (workspaceMode === '3d') setWorkspaceMode('split');
                  }}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                    activeTool === item.tool && workspaceMode !== '3d'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => applyPlanUpdateWithUndo(smartFurnishPlan(currentPlan), pickText(language, 'تم التأثيث الذكي!', 'Meublé par IA !', 'Smart Furnished!'))}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{pickText(language, 'تأثيث ذكي', 'Meubler IA', 'Furnish')}</span>
              </button>

              <button
                type="button"
                onClick={() => setBottomPanel('analyze')}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-bold flex items-center gap-1"
              >
                <ScanSearch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{pickText(language, 'فحص', 'Audit', 'Analyze')}</span>
              </button>

              <button
                type="button"
                onClick={() => setBottomPanel('ai')}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-bold flex items-center gap-1"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{pickText(language, 'مساعد', 'IA', 'AI')}</span>
              </button>

              <button
                type="button"
                onClick={handleManualSave}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1"
                title="Save"
              >
                <Save className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Print & Export Blueprint Modal */}
      {showPrintModal && (
        <PrintReportModal
          plan={currentPlan}
          currency={currency}
          projectName={projectName}
          unit={unit}
          language={language}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Multi-Project Manager Modal */}
      {showProjectsModal && (
        <ProjectsModal
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={loadProjectIntoState}
          onCreateNewProject={handleCreateNewProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onImportProject={(imp) => {
            const next = upsertProjectRecord(imp);
            setProjects(next);
            loadProjectIntoState(imp);
          }}
          onClose={() => setShowProjectsModal(false)}
          language={language}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500 mt-auto bg-[#020617]/90 relative z-10 w-full print:hidden">
        <div className="max-w-[1680px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-slate-400 font-medium">
            ARCH-AI PRO — AI Architecture Studio & 3D CAD Blueprint Generator
          </div>
          <div className="text-cyan-400/80">
            WebGL 3D CAD • 12-Stage DZD Estimator • Closed-Loop Plan Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
