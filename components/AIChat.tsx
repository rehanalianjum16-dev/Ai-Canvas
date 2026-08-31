"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import type { ChatSource } from '../store/useCanvasStore';
import { Send, Mic, Sparkles, User as UserIcon, StopCircle, RefreshCw, AlertCircle, Globe, ExternalLink, Loader2, FileText, Upload, Trash2 } from 'lucide-react';
import type { fabric } from 'fabric';
import { localizeChatResponse, mockDocumentAnalysis } from '../lib/mockServices';

export default function AIChat() {
  const { messages, addMessage, clearMessages, updateMessage, isLeftPanelOpen, isGenerating, setIsGenerating, canvas, saveHistory, isRightPanelOpen } = useCanvasStore();
  
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatMode, setChatMode] = useState<'standard' | 'web' | 'document'>('standard');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationIdRef = useRef(0);
  
  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  // Init speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };
        
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setChatMode('document');
      addMessage({ role: 'user', content: `Uploaded document: ${file.name}` });
      setIsGenerating(true);
      
      const messageId = Date.now().toString();
      addMessage({ id: messageId, role: 'ai', content: 'Analyzing document...' });
      
      try {
        const analysis = await mockDocumentAnalysis(file);
        updateMessage(messageId, analysis);
      } catch (err) {
        updateMessage(messageId, "Failed to analyze document.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const fetchServerChat = async (message: string, mode: 'standard' | 'web' | 'document') => {
    const result = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode }),
    });

    if (!result.ok) {
      const errorData = await result.json().catch(() => ({}));
      throw new Error(errorData?.error || 'AI service unavailable.');
    }

    const data = await result.json();
    return {
      response: data.response || 'I am ready to help with your canvas.',
      sources: Array.isArray(data.sources) ? data.sources : [],
      searchMode: data.mode === 'live' ? 'live' : 'demo',
    };
  };

  const fetchWebSearchResults = async (query: string) => {
    const result = await fetch('/api/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!result.ok) {
      const errorData = await result.json().catch(() => ({}));
      throw new Error(errorData?.error || 'Web search service unavailable.');
    }

    const data = await result.json();
    const sources = Array.isArray(data.results)
      ? data.results.map((item: any) => ({
          title: item.title || 'Search result',
          url: item.url || '#',
          snippet: item.snippet || '',
          source: item.source || 'Web',
        }))
      : [];

    return {
      response: data.answer || 'Here are the latest web results.',
      sources,
      searchMode: data.mode === 'live' ? 'live' : 'demo',
    };
  };

  const processAICommand = async (userMessage: string) => {
    const msg = userMessage.toLowerCase()
      .replace(/\b(bana do|bna do|bana dein|bna dein|add kro|add kar do|kardo|karo|kry|bana|bna)\b/g, ' add ')
      .replace(/\b(daen|dayen|right side)\b/g, ' right ')
      .replace(/\b(hata do|delete kro|remove kro)\b/g, ' delete ')
      .replace(/\b(neela|nila)\b/g, ' blue ')
      .replace(/\s+/g, ' ')
      .trim();
    await new Promise(resolve => setTimeout(resolve, 500));

    if (chatMode === 'web') {
      const searchData = await fetchWebSearchResults(msg);

      let action = (fabricAPI: typeof fabric) => {};
      if (canvas && (msg.includes('canvas') || msg.includes('note') || msg.includes('table') || msg.includes('diagram') || msg.includes('mind map'))) {
        action = (fabricAPI: typeof fabric) => {
          const centerX = canvas.getWidth() / 2;
          const centerY = canvas.getHeight() / 2;
          const makeLabel = (value: string, maxLength = 28) => value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

          if (msg.includes('mind map')) {
            const main = createNodeGroup(fabricAPI, makeLabel(userMessage, 24), centerX - 60, centerY - 25);
            canvas.add(main);
            searchData.sources.slice(0, 5).forEach((source: ChatSource, index: number) => {
              const left = centerX - 260 + (index % 3) * 180;
              const top = centerY - 140 + Math.floor(index / 3) * 180;
              canvas.add(createNodeGroup(fabricAPI, makeLabel(source.title), left, top));
              drawConnection(fabricAPI, canvas, centerX, centerY, left + 60, top + 25);
            });
          }
        };
      }

      return {
        response: searchData.response,
        action,
        sources: searchData.sources,
        searchMode: searchData.searchMode,
      };
    }

    if (!canvas) {
      return { response: "I couldn't connect to the canvas.", action: null, sources: [] };
    }

    let response = "I'm sorry, I didn't understand that command. Try asking me to add shapes, generate code, or create a diagram.";
    let action = (fabricAPI: typeof fabric) => {};

    if (msg.includes("flowchart") && msg.includes("ecommerce")) {
      response = "I've created a basic e-commerce flowchart for you.";
      action = (fabricAPI: typeof fabric) => {
        const items = ["Home", "Product Listing", "Product Detail", "Cart", "Checkout"];
        items.forEach((item, i) => {
          const group = createNodeGroup(fabricAPI, item, 100 + i * 180, 150);
          canvas.add(group);
          if (i > 0) drawConnection(fabricAPI, canvas, 100 + (i - 1) * 180 + 120, 150 + 25, 100 + i * 180, 150 + 25);
        });
      };
    }
    else if (msg.includes("code") || msg.includes("generate code")) {
      response = "I generated a React component code block for you.";
      action = (fabricAPI: typeof fabric) => {
        const text = new fabricAPI.IText('function HelloWorld() {\n  return <div>Hello World!</div>;\n}', {
          left: canvas.getWidth()/2 - 150, top: canvas.getHeight()/2 - 50,
          fontFamily: 'monospace', fill: '#e2e8f0', backgroundColor: '#1e293b',
          fontSize: 14, padding: 16
        });
        canvas.add(text);
        canvas.setActiveObject(text);
      };
    }
    else if (msg.includes("er diagram") || msg.includes("school")) {
       response = "I've created a School Management ER diagram.";
       action = (fabricAPI: typeof fabric) => {
         const cx = canvas.getWidth()/2;
         const cy = canvas.getHeight()/2;
         const s = createNodeGroup(fabricAPI, "Student", cx - 200, cy - 100);
         const c = createNodeGroup(fabricAPI, "Course", cx + 100, cy - 100);
         const e = createNodeGroup(fabricAPI, "Enrollment", cx - 50, cy + 100);
         canvas.add(s, c, e);
         drawConnection(fabricAPI, canvas, cx - 140, cy - 75, cx - 20, cy + 100);
         drawConnection(fabricAPI, canvas, cx + 160, cy - 75, cx + 20, cy + 100);
       };
    }
    else if (msg.includes("rectangle named") || msg.includes("box named") || (msg.includes("add") && msg.includes("rectangle"))) {
      const nameMatch = msg.match(/named\s+([\w\s]+)/);
      const name = nameMatch ? nameMatch[1].trim() : "New Box";
      response = `Added a rectangle named "${name}".`;
      action = (fabricAPI: typeof fabric) => {
        const group = createNodeGroup(fabricAPI, name, canvas.getWidth()/2 - 60, canvas.getHeight()/2 - 25);
        canvas.add(group);
        canvas.setActiveObject(group);
      };
    }
    else if (msg.includes("circle") || msg.includes("oval")) {
      response = "Added a circle to the canvas.";
      action = (fabricAPI: typeof fabric) => {
        const circle = new fabricAPI.Circle({
          radius: 45,
          left: canvas.getWidth() / 2 - 45,
          top: canvas.getHeight() / 2 - 45,
          fill: '#dbeafe',
          stroke: '#2563eb',
          strokeWidth: 2,
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
      };
    }
    else if (msg.includes("triangle")) {
      response = "Added a triangle to the canvas.";
      action = (fabricAPI: typeof fabric) => {
        const triangle = new fabricAPI.Triangle({
          width: 90,
          height: 90,
          left: canvas.getWidth() / 2 - 45,
          top: canvas.getHeight() / 2 - 45,
          fill: '#dcfce7',
          stroke: '#16a34a',
          strokeWidth: 2,
        });
        canvas.add(triangle);
        canvas.setActiveObject(triangle);
      };
    }
    else if (msg.includes("connect")) {
      response = "Connected the selected objects.";
      action = (fabricAPI: typeof fabric) => {
         const activeObjects = canvas.getActiveObjects();
         if (activeObjects.length === 2) {
           const [obj1, obj2] = activeObjects;
           drawConnection(fabricAPI, canvas, obj1.left! + obj1.width!/2, obj1.top! + obj1.height!/2, obj2.left! + obj2.width!/2, obj2.top! + obj2.height!/2);
         } else {
           throw new Error("Please select exactly two objects.");
         }
      };
    }
    else if (msg.includes("move") && msg.includes("right")) {
      response = "Moved the object to the right.";
      action = () => {
        const obj = canvas.getActiveObject();
        if (obj) {
          obj.set({ left: (obj.left || 0) + 50 });
          obj.setCoords();
        } else {
          throw new Error("No object selected.");
        }
      };
    }
    else if (msg.includes("change") && msg.includes("blue")) {
      response = "Changed the selected object's color to blue.";
      action = () => {
        const obj = canvas.getActiveObject();
        if (obj) {
          if (obj.type === 'group') {
            const rect = (obj as fabric.Group).getObjects()[0];
            rect.set('fill', '#3b82f6');
          } else {
            obj.set('fill', '#3b82f6');
          }
        } else {
           throw new Error("No object selected.");
        }
      };
    }
    else if (msg.includes("delete") || msg.includes("remove")) {
      response = "Deleted the selected object.";
      action = () => {
        const objs = canvas.getActiveObjects();
        if (objs.length) {
          canvas.discardActiveObject();
          objs.forEach(o => canvas.remove(o));
        } else {
          throw new Error("Please select an object to delete.");
        }
      };
    }
    else if (msg.includes("mind map")) {
      response = "Created a mind map on the canvas.";
      action = (fabricAPI: typeof fabric) => {
        const cx = canvas.getWidth()/2;
        const cy = canvas.getHeight()/2;
        const main = createNodeGroup(fabricAPI, "Core Topic", cx - 60, cy - 25);
        const child1 = createNodeGroup(fabricAPI, "Idea 1", cx - 200, cy - 120);
        const child2 = createNodeGroup(fabricAPI, "Idea 2", cx + 80, cy - 120);
        
        canvas.add(main, child1, child2);
        drawConnection(fabricAPI, canvas, cx, cy, cx - 140, cy - 95);
        drawConnection(fabricAPI, canvas, cx, cy, cx + 140, cy - 95);
      };
    }

    if (response.includes("I didn't understand that command")) {
      const serverResponse = await fetchServerChat(userMessage, 'standard');
      response = serverResponse.response;
      return {
        response,
        action: null,
        sources: serverResponse.sources,
        searchMode: serverResponse.searchMode,
      };
    }

    return { response, action, sources: [] };
  };

  const handleSend = async (e?: React.FormEvent, retryMsg?: string) => {
    e?.preventDefault();
    const query = retryMsg || input;
    if (!query.trim() || isGenerating) return;

    if (!retryMsg) {
      addMessage({ role: 'user', content: query });
      setInput('');
    }
    const generationId = ++generationIdRef.current;
    setIsGenerating(true);

    const messageId = Date.now().toString();
    addMessage({ id: messageId, role: 'ai', content: '' });

    try {
      const { response, action, sources, searchMode } = await processAICommand(query);

      const localizedResponse = localizeChatResponse(query, response);
      const words = localizedResponse.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        if (generationId !== generationIdRef.current) return;
        currentText += words[i] + ' ';
        updateMessage(messageId, currentText);
        await new Promise(r => setTimeout(r, 30));
      }

      updateMessage(messageId, localizedResponse, { sources, searchMode });

      if (generationId !== generationIdRef.current) return;

      if (action) {
        try {
          const { fabric } = await import('fabric');
          action(fabric);
          canvas?.renderAll();
          saveHistory(canvas!);
        } catch (err: any) {
           addMessage({ role: 'error', content: `Error: ${err.message}` });
        }
      }
    } catch (error) {
       updateMessage(messageId, "Network or API failure. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const stopGeneration = () => {
    generationIdRef.current += 1;
    setIsGenerating(false);
  };

  const handleClearChat = () => {
    generationIdRef.current += 1;
    setIsGenerating(false);
    clearMessages();
  };

  const createNodeGroup = (fabricAPI: typeof fabric, text: string, left: number, top: number) => {
    const rect = new fabricAPI.Rect({
      width: 130, height: 50, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, rx: 8, ry: 8
    });
    const itext = new fabricAPI.IText(text, {
      fontSize: 14, fontFamily: 'sans-serif', left: 65, top: 25, originX: 'center', originY: 'center', fill: '#1e293b'
    });
    return new fabricAPI.Group([rect, itext], { left, top, hasControls: true });
  };

  const drawConnection = (fabricAPI: typeof fabric, canvas: fabric.Canvas, x1: number, y1: number, x2: number, y2: number) => {
    const line = new fabricAPI.Line([x1, y1, x2, y2], { stroke: '#94a3b8', strokeWidth: 2, selectable: false });
    canvas.add(line);
    canvas.sendToBack(line);
  };

  return (
    <div className={`w-80 bg-white border-l border-slate-200 h-full flex flex-col shadow-sm absolute right-0 md:relative z-20 transition-transform duration-300 ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
      
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">AI Canvas Assistant</h2>
            <p className="text-[11px] text-slate-500">Turn ideas into canvas objects</p>
          </div>
          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0 || isGenerating}
            title="Clear chat"
            aria-label="Clear chat"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
          <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          {isGenerating ? 'Working on your canvas...' : 'Ready to create'}
        </div>
        <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button 
            onClick={() => setChatMode('standard')} 
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${chatMode === 'standard' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Canvas AI
          </button>
          <button 
            onClick={() => setChatMode('web')} 
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${chatMode === 'web' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Web Search
          </button>
          <button 
            onClick={() => { fileInputRef.current?.click() }}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors flex justify-center items-center gap-1 ${chatMode === 'document' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             <Upload size={12}/> File
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && !isGenerating && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Try a prompt</p>
            <div className="grid gap-2">
              {['Create a flowchart for an ecommerce checkout', 'Add a blue rectangle named Hero', 'Create a mind map about my project'].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 
              msg.role === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white'
            }`}>
              {msg.role === 'user' ? <UserIcon size={12} /> : 
               msg.role === 'error' ? <AlertCircle size={12} /> : <Sparkles size={12} />}
            </div>
            <div className={`px-3 py-2 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : msg.role === 'error' ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-slate-100 text-slate-700 rounded-tl-none'
            }`}>
              {msg.content || (msg.role === 'ai' && <span className="animate-pulse">...</span>)}

              {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-2 space-y-2">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <Globe size={11} /> Sources
                  </div>
                  {msg.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-1.5 text-xs text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      <ExternalLink size={11} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}
              
              {msg.role === 'error' && (
                <button 
                  onClick={() => {
                    const messageIndex = messages.findIndex((message) => message.id === msg.id);
                    const previousMessage = messages[messageIndex - 1];
                    if (previousMessage?.role === 'user') handleSend(undefined, previousMessage.content);
                  }}
                  className="mt-2 text-xs flex items-center gap-1 font-medium bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                >
                  <RefreshCw size={10} /> Retry
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="relative flex flex-col gap-2">
          {chatMode === 'document' && uploadedFile && (
             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <FileText size={14} className="text-blue-500" />
                <span className="truncate flex-1">{uploadedFile.name}</span>
                <button type="button" aria-label="Remove uploaded file" onClick={() => { setUploadedFile(null); setChatMode('standard'); }} className="text-slate-400 hover:text-red-500">x</button>
             </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={chatMode === 'web' ? "Search the web..." : chatMode === 'document' ? "Ask about document..." : "Ask AI to draw or edit..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-4 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow text-slate-700"
              disabled={isGenerating}
            />
            <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
              <button 
                type="button" 
                onClick={toggleListen}
                  title={isListening ? 'Stop listening' : 'Use voice input'}
                  aria-label={isListening ? 'Stop listening' : 'Use voice input'}
                className={`p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
              >
                <Mic size={16} />
              </button>
              {isGenerating ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  title="Stop generating"
                  aria-label="Stop generating"
                  className="p-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-full transition-colors"
                >
                  <StopCircle size={16} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={!input.trim() && !isListening} 
                  className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
