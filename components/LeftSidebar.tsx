"use client";

import React, { useState } from 'react';
import { FolderOpen, FileText, LayoutTemplate, Settings, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';

export default function LeftSidebar() {
  const { isLeftPanelOpen, setIsLeftPanelOpen, projects, openProject, createNewProject, currentProjectId } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<'projects' | 'files' | 'templates' | 'settings'>('projects');

  const tabs = [
    { id: 'projects', icon: FolderOpen, label: 'Projects' },
    { id: 'files', icon: FileText, label: 'Files' },
    { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div 
      className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 ${
        isLeftPanelOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-3">
        {isLeftPanelOpen && <span className="font-semibold text-slate-700 text-sm pl-2">Workspace</span>}
        <button 
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={`p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors ${!isLeftPanelOpen && 'mx-auto'}`}
        >
          {isLeftPanelOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Vertical Tab Bar */}
        <div className="w-16 border-r border-slate-100 flex flex-col items-center py-4 gap-4 bg-slate-50 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (!isLeftPanelOpen) setIsLeftPanelOpen(true);
              }}
              className={`p-2.5 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
              title={tab.label}
            >
              <tab.icon size={20} />
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className={`flex-1 flex flex-col min-w-[200px] bg-white transition-opacity duration-300 ${isLeftPanelOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 capitalize">{activeTab}</h3>
            {activeTab === 'projects' && (
              <button onClick={createNewProject} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                <Plus size={16} />
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {activeTab === 'projects' && (
              <>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 flex items-center gap-2">
                  <Clock size={12} /> Recent
                </div>
                {projects.slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentProjectId === p.id 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(p.updatedAt).toLocaleDateString()}</div>
                  </button>
                ))}
                {projects.length === 0 && (
                  <div className="text-sm text-slate-400 px-2 py-4 text-center">No projects found.</div>
                )}
              </>
            )}

            {activeTab === 'files' && (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-lg m-2">
                <FileText className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-sm text-slate-500 font-medium">No files uploaded</p>
                <p className="text-xs text-slate-400 mt-1">Upload files in the AI Chat panel</p>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-2">
                {['Flowchart', 'Mind Map', 'ER Diagram', 'Wireframe'].map(t => (
                  <button key={t} className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="px-2 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Theme</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm text-slate-700">
                    <option>System (Light)</option>
                    <option>Dark Mode</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Canvas Engine</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm text-slate-700">
                    <option>Fabric.js (Pro)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
