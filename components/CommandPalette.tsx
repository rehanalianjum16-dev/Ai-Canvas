"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Globe, Upload, Settings, FileImage, FileText, Database } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { createNewProject, setIsLeftPanelOpen, setIsRightPanelOpen } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    { id: 'new', label: 'New Canvas', icon: Plus, action: () => { createNewProject(); setIsOpen(false); } },
    { id: 'search', label: 'Search Web', icon: Globe, action: () => { setIsRightPanelOpen(true); setIsOpen(false); } },
    { id: 'upload', label: 'Upload File', icon: Upload, action: () => { setIsRightPanelOpen(true); setIsOpen(false); } },
    { id: 'export-png', label: 'Export PNG', icon: FileImage, action: () => { setIsOpen(false); /* Handled in TopNav */ } },
    { id: 'export-pdf', label: 'Export PDF', icon: FileText, action: () => { setIsOpen(false); } },
    { id: 'diagram', label: 'Generate Diagram', icon: Database, action: () => { setIsRightPanelOpen(true); setIsOpen(false); } },
    { id: 'settings', label: 'Open Settings', icon: Settings, action: () => { setIsLeftPanelOpen(true); setIsOpen(false); } },
  ];

  const filteredCommands = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-32" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search size={20} className="text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
            placeholder="Search commands..."
          />
          <div className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">ESC</div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <cmd.icon size={16} />
                  </div>
                  <span className="text-slate-700 font-medium text-sm group-hover:text-slate-900">{cmd.label}</span>
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5">↑↓</kbd> to navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5">Enter</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}
