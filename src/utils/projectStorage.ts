import {
  ArchProjectRecord,
  DEFAULT_LAYERS,
  GeneratedHousePlan,
  SiteSettings,
} from '../types';
import { DEFAULT_COST_RATES_DZD } from './costEstimator';

const STORAGE_KEY = 'archai_pro_projects_v2';
const ACTIVE_ID_KEY = 'archai_pro_active_project_v2';

export function createDefaultSiteSettings(plan?: GeneratedHousePlan): SiteSettings {
  return {
    buildingOffsetX: plan?.params?.siteSettings?.buildingOffsetX ?? 0,
    buildingOffsetY: plan?.params?.siteSettings?.buildingOffsetY ?? 0,
    hasFence: plan?.params?.showFence ?? true,
    hasGate: true,
    hasDriveway: Boolean(plan?.params?.hasGarage ?? true),
    hasParking: Boolean(plan?.params?.hasGarage ?? true),
    hasPool: Boolean(plan?.params?.showGardenDecor && plan?.params?.hasGarden),
    hasPatio: Boolean(plan?.params?.hasGarden ?? true),
    hasGardenLights: true,
  };
}

export function createProjectRecord(
  name: string,
  plan: GeneratedHousePlan,
  partial?: Partial<ArchProjectRecord>
): ArchProjectRecord {
  const now = new Date().toISOString();
  return {
    id: partial?.id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    info: {
      name: name.trim() || 'مشروع فيلا عصرية',
      createdAt: partial?.info?.createdAt || now,
      updatedAt: now,
      version: '2.0.0',
      author: 'ARCH-AI PRO Studio',
    },
    site: partial?.site || createDefaultSiteSettings(plan),
    plan,
    layers: partial?.layers || { ...DEFAULT_LAYERS },
    costRatesDZD: partial?.costRatesDZD || { ...DEFAULT_COST_RATES_DZD },
    camera: partial?.camera || {
      preset: 'iso',
      explodedAmount: 0,
      selectedFloor3D: 'all',
      viewMode: 'realistic',
    },
    settings: partial?.settings || {
      language: 'ar',
      currency: 'DZD',
      unit: 'm',
    },
    assistantLog: partial?.assistantLog || [],
  };
}

export function loadAllProjects(): ArchProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && p.id && p.plan && p.info);
  } catch {
    return [];
  }
}

export function saveAllProjects(projects: ArchProjectRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 25)));
  } catch (e) {
    console.warn('Could not save projects to localStorage:', e);
  }
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_ID_KEY, id);
  } catch {
    // ignore storage quota failures
  }
}

export function upsertProjectRecord(project: ArchProjectRecord): ArchProjectRecord[] {
  const updated: ArchProjectRecord = {
    ...project,
    info: {
      ...project.info,
      updatedAt: new Date().toISOString(),
    },
  };
  const list = loadAllProjects();
  const idx = list.findIndex((p) => p.id === updated.id);
  const next = idx >= 0 ? list.map((p, i) => (i === idx ? updated : p)) : [updated, ...list];
  saveAllProjects(next);
  setActiveProjectId(updated.id);
  return next;
}

export function deleteProjectRecord(id: string): ArchProjectRecord[] {
  const list = loadAllProjects().filter((p) => p.id !== id);
  saveAllProjects(list);
  return list;
}

export function exportProjectJSON(project: ArchProjectRecord): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = project.info.name.replace(/[^\w\u0600-\u06FF-]+/g, '_');
  a.download = `${safeName || 'arch-ai-project'}.archai.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportedProjectJSON(jsonStr: string): ArchProjectRecord | null {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || !data.plan || !Array.isArray(data.plan.rooms) || !Array.isArray(data.plan.walls)) {
      return null;
    }
    return createProjectRecord(
      data.info?.name || 'مشروع مستورد',
      data.plan,
      {
        ...data,
        id: `proj-imp-${Date.now()}`,
      }
    );
  } catch {
    return null;
  }
}
