"use client";

import React, { useRef } from 'react';
import { useCanvasStore, ToolType } from '../store/useCanvasStore';
import type { fabric } from 'fabric';
import { 
  MousePointer2, Hand, Type, Square, Circle, Triangle, 
  Minus, ArrowRight, Pen, StickyNote, Image as ImageIcon, Code,
  Undo2, Redo2
} from 'lucide-react';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'hand', icon: Hand, label: 'Pan' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'draw', icon: Pen, label: 'Draw' },
  { id: 'sticky', icon: StickyNote, label: 'Sticky Note' },
  { id: 'image', icon: ImageIcon, label: 'Image' },
  { id: 'code', icon: Code, label: 'Code Block' },
] as const;

const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', 'transparent'];

export default function PropertiesPanel() {
  const { 
    activeTool, setActiveTool, 
    strokeColor, setStrokeColor, 
    fillColor, setFillColor,
    strokeWidth, setStrokeWidth,
    canvas, undo, redo, historyIndex, history, saveHistory,
    isRightPanelOpen
  } = useCanvasStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (toolId: ToolType) => {
    if (toolId === 'image') {
      fileInputRef.current?.click();
      return; // Keep current tool
    }
    setActiveTool(toolId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      import('fabric').then(({ fabric }) => {
        fabric.Image.fromURL(data, (img) => {
          // scale down if too large
          if (img.width! > 500) img.scaleToWidth(500);
          
          img.set({
            left: canvas.getWidth() / 2 - (img.getScaledWidth() / 2),
            top: canvas.getHeight() / 2 - (img.getScaledHeight() / 2),
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          saveHistory(canvas);
        });
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const handleDelete = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach(obj => canvas.remove(obj));
      saveHistory(canvas);
    }
  };

  const handleBringForward = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      canvas.bringForward(activeObj);
      canvas.renderAll();
      saveHistory(canvas);
    }
  };

  const handleSendBack = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      canvas.sendBackwards(activeObj);
      canvas.renderAll();
      saveHistory(canvas);
    }
  };

  return (
    <div className={`w-64 bg-white border-l border-slate-200 h-full flex flex-col shadow-sm absolute right-0 md:relative z-20 transition-transform duration-300 ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
      
      {/* Undo/Redo Header */}
      <div className="p-3 border-b border-slate-100 flex justify-between bg-slate-50 items-center">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Canvas</h3>
        <div className="flex gap-1">
          <button 
            onClick={() => canvas && undo(canvas)}
            disabled={historyIndex <= 0}
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button 
            onClick={() => canvas && redo(canvas)}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tools</h3>
        <div className="grid grid-cols-4 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id as ToolType)}
                title={tool.label}
                className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700 shadow-inner' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Properties</h3>
        
        {/* Stroke Color */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">Stroke Color</label>
          <div className="grid grid-cols-5 gap-2">
            {colors.map(c => (
              <button 
                key={`stroke-${c}`}
                onClick={() => setStrokeColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  strokeColor === c ? 'border-blue-500 shadow-sm' : 'border-transparent shadow-sm'
                }`}
                style={{ backgroundColor: c === 'transparent' ? '#f1f5f9' : c }}
              >
                {c === 'transparent' && <span className="text-[10px] text-slate-400">None</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Fill Color */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">Fill Color</label>
          <div className="grid grid-cols-5 gap-2">
            {colors.map(c => (
              <button 
                key={`fill-${c}`}
                onClick={() => setFillColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  fillColor === c ? 'border-blue-500 shadow-sm' : 'border-transparent shadow-sm'
                }`}
                style={{ backgroundColor: c === 'transparent' ? '#f1f5f9' : c }}
              >
                {c === 'transparent' && <span className="text-[10px] text-slate-400">None</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2 flex justify-between">
            <span>Stroke Width</span>
            <span className="text-slate-400">{strokeWidth}px</span>
          </label>
          <input 
            type="range" 
            min="1" max="20" 
            value={strokeWidth} 
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Object Actions */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">Actions</label>
          <div className="flex gap-2 mb-2">
            <button onClick={handleBringForward} className="flex-1 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">Bring Forward</button>
            <button onClick={handleSendBack} className="flex-1 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">Send Back</button>
          </div>
          <div className="flex gap-2 mb-2">
            <button onClick={() => {
              const active = canvas?.getActiveObject();
              if (active && active.type === 'activeSelection') {
                (active as fabric.ActiveSelection).toGroup();
                canvas?.requestRenderAll();
                saveHistory(canvas!);
              }
            }} className="flex-1 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">Group</button>
            <button onClick={() => {
              const active = canvas?.getActiveObject();
              if (active && active.type === 'group') {
                (active as fabric.Group).toActiveSelection();
                canvas?.requestRenderAll();
                saveHistory(canvas!);
              }
            }} className="flex-1 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">Ungroup</button>
          </div>
          <div className="flex gap-2 mb-2">
            <button onClick={() => {
              const active = canvas?.getActiveObject();
              if (active) {
                active.set({ selectable: false, evented: false });
                canvas?.discardActiveObject();
                canvas?.requestRenderAll();
              }
            }} className="flex-1 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded transition-colors">Lock</button>
          </div>
          <button onClick={handleDelete} className="w-full mt-2 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors border border-red-200">
            Delete Selected
          </button>
        </div>
        
        {/* Workspace Settings */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">Workspace</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={useCanvasStore.getState().showGrid}
                onChange={(e) => useCanvasStore.getState().setShowGrid(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Show Grid
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={useCanvasStore.getState().snapToGrid}
                onChange={(e) => useCanvasStore.getState().setSnapToGrid(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Snap to Grid
            </label>
          </div>
        </div>

        {/* AI Generation Tools */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">AI Generation Tools</label>
          <div className="space-y-1">
             {['Generate Flowchart', 'Summarize Selection', 'Generate Code'].map(t => (
               <button key={t} className="w-full text-left px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-100 transition-colors">
                 {t}
               </button>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
