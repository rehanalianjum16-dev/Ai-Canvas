import { create } from 'zustand';
import type { fabric } from 'fabric';

export type ToolType = 'select' | 'hand' | 'text' | 'rect' | 'circle' | 'triangle' | 'line' | 'arrow' | 'draw' | 'sticky' | 'image' | 'code';

export interface Project {
  id: string;
  name: string;
  data: string; // JSON string of canvas
  updatedAt: number;
}

export interface ChatSource {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'error';
  content: string;
  sources?: ChatSource[];
  searchMode?: 'live' | 'demo';
}

interface CanvasState {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas | null) => void;

  strokeColor: string;
  setStrokeColor: (color: string) => void;
  
  fillColor: string;
  setFillColor: (color: string) => void;
  
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  history: string[];
  historyIndex: number;
  saveHistory: (canvas: fabric.Canvas) => void;
  undo: (canvas: fabric.Canvas) => void;
  redo: (canvas: fabric.Canvas) => void;

  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id'> & { id?: string }) => void;
  clearMessages: () => void;
  updateMessage: (id: string, content: string, details?: Pick<ChatMessage, 'sources' | 'searchMode'>) => void;
  
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;

  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (isOpen: boolean) => void;
  
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (isOpen: boolean) => void;

  showGrid: boolean;
  setShowGrid: (show: boolean) => void;

  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;

  // Project Management
  projects: Project[];
  currentProjectId: string | null;
  projectName: string;
  saveStatus: 'Saving...' | 'Saved' | 'Error' | '';
  setProjectName: (name: string) => void;
  loadProjects: () => void;
  saveProject: () => void;
  createNewProject: () => void;
  openProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  isLeftPanelOpen: false,
  setIsLeftPanelOpen: (isOpen) => set({ isLeftPanelOpen: isOpen }),
  
  isRightPanelOpen: false,
  setIsRightPanelOpen: (isOpen) => set({ isRightPanelOpen: isOpen }),
  
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  showGrid: true,
  setShowGrid: (show) => set({ showGrid: show }),

  snapToGrid: false,
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),

  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  strokeColor: '#000000',
  setStrokeColor: (color) => set({ strokeColor: color }),
  
  fillColor: 'transparent',
  setFillColor: (color) => set({ fillColor: color }),
  
  strokeWidth: 2,
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),

  history: [],
  historyIndex: -1,
  
  saveHistory: (canvas) => {
    const { history, historyIndex, saveProject } = get();
    const json = JSON.stringify(canvas.toJSON());
    
    if (history.length > 0 && history[historyIndex] === json) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    
    if (newHistory.length > 50) newHistory.shift();
    
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
    
    // Auto-save when history changes
    saveProject();
  },
  
  undo: (canvas) => {
    const { history, historyIndex, saveProject } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({ historyIndex: newIndex });
      canvas.loadFromJSON(history[newIndex], () => {
        canvas.renderAll();
        saveProject();
      });
    }
  },
  
  redo: (canvas) => {
    const { history, historyIndex, saveProject } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex });
      canvas.loadFromJSON(history[newIndex], () => {
        canvas.renderAll();
        saveProject();
      });
    }
  },

  messages: [
    { id: '1', role: 'ai', content: 'Hello! I am your AI Canvas Assistant. You can ask me to "add a blue rectangle", "create a flowchart", or help you arrange elements.' }
  ],
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, { ...msg, id: msg.id || Date.now().toString() }] 
  })),
  clearMessages: () => set({ messages: [] }),
  updateMessage: (id, content, details) => set((state) => ({
    messages: state.messages.map(m => m.id === id ? { ...m, content, ...details } : m)
  })),

  // Project Management logic
  projects: [],
  currentProjectId: null,
  projectName: 'Untitled Canvas',
  saveStatus: '',

  setProjectName: (name) => {
    set({ projectName: name });
    get().saveProject();
  },

  loadProjects: () => {
    try {
      const stored = localStorage.getItem('ai-canvas-projects');
      if (stored) {
        const projects = JSON.parse(stored);
        set({ projects });
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  },

  saveProject: () => {
    const { canvas, currentProjectId, projectName, projects } = get();
    if (!canvas) return;

    set({ saveStatus: 'Saving...' });

    try {
      const data = JSON.stringify(canvas.toJSON());
      let id = currentProjectId;
      let newProjects = [...projects];

      if (!id) {
        id = Date.now().toString();
        newProjects.push({ id, name: projectName, data, updatedAt: Date.now() });
      } else {
        const idx = newProjects.findIndex(p => p.id === id);
        if (idx >= 0) {
          newProjects[idx] = { ...newProjects[idx], name: projectName, data, updatedAt: Date.now() };
        } else {
          newProjects.push({ id, name: projectName, data, updatedAt: Date.now() });
        }
      }

      localStorage.setItem('ai-canvas-projects', JSON.stringify(newProjects));
      set({ projects: newProjects, currentProjectId: id, saveStatus: 'Saved' });
      
      setTimeout(() => {
        if (get().saveStatus === 'Saved') set({ saveStatus: '' });
      }, 2000);
    } catch (e) {
      console.error('Save failed', e);
      set({ saveStatus: 'Error' });
    }
  },

  createNewProject: () => {
    const { canvas } = get();
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#f8fafc';
      canvas.renderAll();
    }
    set({ 
      currentProjectId: null, 
      projectName: 'Untitled Canvas', 
      history: [], 
      historyIndex: -1,
      messages: [{ id: '1', role: 'ai', content: 'Started a new canvas!' }]
    });
    get().saveProject();
  },

  openProject: (id) => {
    const { projects, canvas } = get();
    const proj = projects.find(p => p.id === id);
    if (proj && canvas) {
      canvas.loadFromJSON(proj.data, () => {
        canvas.renderAll();
        set({ 
          currentProjectId: id, 
          projectName: proj.name,
          history: [proj.data],
          historyIndex: 0,
          messages: [{ id: '1', role: 'ai', content: `Opened project: ${proj.name}` }]
        });
      });
    }
  },

  deleteProject: (id) => {
    const { projects, currentProjectId } = get();
    const newProjects = projects.filter(p => p.id !== id);
    localStorage.setItem('ai-canvas-projects', JSON.stringify(newProjects));
    set({ projects: newProjects });
    
    if (currentProjectId === id) {
      get().createNewProject();
    }
  },

  duplicateProject: (id) => {
    const { projects } = get();
    const proj = projects.find(p => p.id === id);
    if (proj) {
      const newId = Date.now().toString();
      const newProjects = [...projects, { ...proj, id: newId, name: `${proj.name} (Copy)`, updatedAt: Date.now() }];
      localStorage.setItem('ai-canvas-projects', JSON.stringify(newProjects));
      set({ projects: newProjects });
    }
  }
}));
