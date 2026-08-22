"use client";

import React, { useState, useEffect } from 'react';
import { Menu, Save, Download, Settings, User, Plus, Sparkles, Wrench, FolderOpen, Share2, MoreVertical, Copy, Trash2, Check, FileImage, FileText, LogOut, Shield } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';
import { useAuthStore } from '../store/useAuthStore';
import Link from 'next/link';

export default function TopNav() {
  const { 
    isLeftPanelOpen, setIsLeftPanelOpen, 
    isRightPanelOpen, setIsRightPanelOpen,
    projectName, setProjectName,
    saveStatus, saveProject, createNewProject,
    projects, loadProjects, openProject, deleteProject, duplicateProject,
    canvas
  } = useCanvasStore();

  const { currentUser, logout } = useAuthStore();

  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleExportPNG = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const link = document.createElement('a');
    link.download = `${projectName || 'canvas'}.png`;
    link.href = dataUrl;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportPDF = async () => {
    if (!canvas) return;
    try {
      const { jsPDF } = await import('jspdf');
      const dataUrl = canvas.toDataURL({ format: 'jpeg', multiplier: 2 });
      
      const pdf = new jsPDF({
        orientation: canvas.getWidth() > canvas.getHeight() ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.getWidth(), canvas.getHeight()]
      });
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, canvas.getWidth(), canvas.getHeight());
      pdf.save(`${projectName || 'canvas'}.pdf`);
    } catch (e) {
      console.error("Failed to export PDF", e);
      alert("PDF export failed. Please ensure jspdf is installed.");
    }
    setIsExportOpen(false);
  };

  const handleShare = () => {
    // Mock share link
    navigator.clipboard.writeText(window.location.href + "?project=" + (Date.now().toString()));
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProject(id);
    }
  };

  return (
    <>
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30 relative">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors md:hidden"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="font-semibold text-slate-800 text-lg tracking-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors w-32 md:w-48 px-1"
            />
          </div>
          
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          
          <div className="hidden sm:flex items-center gap-1 relative">
            <button 
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <FolderOpen size={16} />
              Projects
            </button>
            <button 
              onClick={createNewProject}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Plus size={16} />
              New
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Download size={16} />
                Export
              </button>
              
              {isExportOpen && (
                <div className="absolute top-full mt-1 left-0 w-36 bg-white border border-slate-200 shadow-lg rounded-lg py-1 z-50">
                  <button onClick={handleExportPNG} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                    <FileImage size={14} /> PNG
                  </button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                    <FileText size={14} /> PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full mr-2 hidden sm:inline-block transition-colors ${
              saveStatus === 'Saving...' ? 'bg-amber-100 text-amber-700' :
              saveStatus === 'Error' ? 'bg-red-100 text-red-700' :
              'bg-green-100 text-green-700'
            }`}>
              {saveStatus}
            </span>
          )}
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
          >
            {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
            <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>
          
          <button 
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors md:hidden"
          >
            <Wrench size={20} className="text-slate-600" />
          </button>
          
          <div className="relative">
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-2 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold overflow-hidden">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                </div>
                
                {currentUser?.role === 'admin' && (
                  <Link href="/admin" className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Shield size={14} className="text-blue-600" /> Admin Dashboard
                  </Link>
                )}
                
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Settings size={14} /> Profile Settings
                </button>
                
                <button onClick={() => logout()} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 mt-1 border-t border-slate-100 pt-2">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Modal Overlay */}
      {isProjectsOpen && (
        <div className="absolute inset-0 bg-slate-900/20 z-40 flex items-start justify-center pt-16" onClick={() => setIsProjectsOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-semibold text-slate-800">My Projects</h2>
              <button onClick={() => setIsProjectsOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {projects.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No saved projects yet.</div>
              ) : (
                projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors">
                    <button 
                      onClick={() => { openProject(p.id); setIsProjectsOpen(false); }}
                      className="flex-1 text-left"
                    >
                      <h3 className="font-medium text-slate-800 text-sm">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Last updated: {new Date(p.updatedAt).toLocaleString()}</p>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-white shadow-sm border border-slate-100" title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <button onClick={(e) => handleDelete(p.id, e)} className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-white shadow-sm border border-slate-100" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
