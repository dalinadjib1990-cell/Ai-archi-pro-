import React, { useRef } from 'react';
import { FolderOpen, Plus, Copy, Trash2, Download, Upload, X, Check } from 'lucide-react';
import { AppLanguage, ArchProjectRecord } from '../types';
import { exportProjectJSON, parseImportedProjectJSON } from '../utils/projectStorage';
import { pickText } from '../utils/i18n';

interface ProjectsModalProps {
  projects: ArchProjectRecord[];
  activeProjectId: string;
  onSelectProject: (proj: ArchProjectRecord) => void;
  onCreateNewProject: () => void;
  onDuplicateProject: (proj: ArchProjectRecord) => void;
  onDeleteProject: (id: string) => void;
  onImportProject: (proj: ArchProjectRecord) => void;
  onClose: () => void;
  language: AppLanguage;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDuplicateProject,
  onDeleteProject,
  onImportProject,
  onClose,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseImportedProjectJSON(text);
    if (parsed) {
      onImportProject(parsed);
      onClose();
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {pickText(language, 'إدارة المشاريع المحفوظة (Projects)', 'Gestionnaire de Projets', 'Projects Manager')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="p-3 border-b border-slate-800 flex flex-wrap items-center gap-2 bg-slate-900">
          <button
            type="button"
            onClick={() => {
              onCreateNewProject();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{pickText(language, 'مشروع جديد', 'Nouveau Projet', 'New Project')}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pickText(language, 'استيراد ملف .archai.json', 'Importer .archai.json', 'Import .archai.json')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.archai.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Projects List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                  isActive
                    ? 'bg-cyan-950/50 border-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    <span className="font-bold text-xs text-white truncate">{p.info.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{p.plan.params.length}×{p.plan.params.width}m</span>
                    <span>•</span>
                    <span>{p.plan.params.floorsCount}F</span>
                    <span>•</span>
                    <span>{p.plan.params.style}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{new Date(p.info.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(p);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-bold"
                    >
                      {pickText(language, 'فتح', 'Ouvrir', 'Open')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => exportProjectJSON(p)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-300"
                    title="Export .archai.json"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateProject(p)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 bg-rose-950/60 hover:bg-rose-900 rounded-lg text-rose-300"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
