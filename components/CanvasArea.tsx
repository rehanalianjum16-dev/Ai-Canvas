"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { fabric } from 'fabric';

export default function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    setCanvas, activeTool, strokeColor, fillColor, strokeWidth,
    messages, saveHistory, setZoom, zoom
  } = useCanvasStore();
  
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const isDrawingShape = useRef(false);
  const currentShape = useRef<fabric.Object | null>(null);
  const startPoint = useRef<{x: number, y: number} | null>(null);

  // Initialize Fabric.js
  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current || !containerRef.current) return;
    
    import('fabric').then(({ fabric }) => {
      const container = containerRef.current;
      if (!container) return;
      
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: '#f8fafc',
        selection: true,
        preserveObjectStacking: true,
      });

      setFabricCanvas(canvas);
      setCanvas(canvas);

      // Restore latest project or save initial state
      const store = useCanvasStore.getState();
      store.loadProjects();
      const projects = useCanvasStore.getState().projects;
      if (projects.length > 0) {
        const latest = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        store.openProject(latest.id);
      } else {
        saveHistory(canvas);
      }

      const handleResize = () => {
        if (container) {
          canvas.setWidth(container.clientWidth);
          canvas.setHeight(container.clientHeight);
          canvas.renderAll();
        }
      };
      window.addEventListener('resize', handleResize);

      // Keyboard events (Delete, Copy, Paste, Group)
      let clipboard: fabric.Object | null = null;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        // ensure we aren't in a text box
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        
        const activeObject = canvas.getActiveObject();
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length) {
            canvas.discardActiveObject();
            activeObjects.forEach(obj => canvas.remove(obj));
            saveHistory(canvas);
          }
        }
        
        // Copy
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && activeObject) {
          activeObject.clone((cloned: fabric.Object) => {
            clipboard = cloned;
          });
        }
        
        // Paste
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
          clipboard.clone((clonedObj: any) => {
            canvas.discardActiveObject();
            clonedObj.set({
              left: clonedObj.left + 20,
              top: clonedObj.top + 20,
              evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
              clonedObj.canvas = canvas;
              clonedObj.forEachObject((obj: any) => canvas.add(obj));
              clonedObj.setCoords();
            } else {
              canvas.add(clonedObj);
            }
            clipboard!.top! += 20;
            clipboard!.left! += 20;
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();
            saveHistory(canvas);
          });
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // Zooming and Panning
      canvas.on('mouse:wheel', function(opt) {
        const evt = opt.e;
        if (evt.ctrlKey || evt.metaKey) { // Zoom
          let zoomLevel = canvas.getZoom();
          zoomLevel *= 0.999 ** evt.deltaY;
          if (zoomLevel > 20) zoomLevel = 20;
          if (zoomLevel < 0.01) zoomLevel = 0.01;
          canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoomLevel);
          setZoom(zoomLevel);
        } else { // Pan
          const vpt = canvas.viewportTransform;
          if (vpt) {
            vpt[4] -= evt.deltaX;
            vpt[5] -= evt.deltaY;
            canvas.requestRenderAll();
          }
        }
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      // Save history after any modification
      canvas.on('object:modified', () => saveHistory(canvas));
      canvas.on('object:added', () => {
        if (!isDrawingShape.current) saveHistory(canvas);
      });
      canvas.on('object:removed', () => saveHistory(canvas));
      
      // Snap to Grid
      canvas.on('object:moving', (options) => {
        if (useCanvasStore.getState().snapToGrid && options.target) {
          options.target.set({
            left: Math.round(options.target.left! / 20) * 20,
            top: Math.round(options.target.top! / 20) * 20
          });
        }
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        canvas.dispose();
      };
    });
  }, [setCanvas, saveHistory, setZoom]);

  // Handle active tool changes & shape creation logic
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Reset states
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = activeTool === 'select';
    fabricCanvas.defaultCursor = 'default';

    if (activeTool === 'draw') {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = strokeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
      return;
    }

    if (activeTool === 'hand') {
      fabricCanvas.defaultCursor = 'grab';
    } else if (activeTool === 'text' || activeTool === 'code') {
      fabricCanvas.defaultCursor = 'text';
    } else if (activeTool !== 'select') {
      fabricCanvas.defaultCursor = 'crosshair';
    }

    const onMouseDown = (o: fabric.IEvent) => {
      if (activeTool === 'select') return;
      if (activeTool === 'hand') {
        fabricCanvas.defaultCursor = 'grabbing';
        isDrawingShape.current = true;
        return;
      }
      if (activeTool === 'image') return; // Image handled via button

      const pointer = fabricCanvas.getPointer(o.e);
      startPoint.current = { x: pointer.x, y: pointer.y };

      if (activeTool === 'text') {
        const text = new fabric.IText('Text', {
          left: pointer.x, top: pointer.y,
          fontFamily: 'sans-serif', fill: strokeColor,
          fontSize: 24 * strokeWidth
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        saveHistory(fabricCanvas);
        // useCanvasStore.getState().setActiveTool('select');
        return;
      }

      if (activeTool === 'sticky') {
        const group = new fabric.Group([
          new fabric.Rect({
            width: 150, height: 150, fill: fillColor === 'transparent' ? '#fef08a' : fillColor, rx: 5, ry: 5,
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 5, offsetY: 2 })
          }),
          new fabric.IText('Note', {
            left: 10, top: 10, fontSize: 16, fontFamily: 'sans-serif', fill: strokeColor
          })
        ], { left: pointer.x, top: pointer.y });
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
        saveHistory(fabricCanvas);
        return;
      }

      if (activeTool === 'code') {
        const text = new fabric.IText('// Code block\nconst x = 1;', {
          left: pointer.x, top: pointer.y,
          fontFamily: 'monospace', fill: '#e2e8f0', backgroundColor: '#1e293b',
          fontSize: 16, padding: 10
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        saveHistory(fabricCanvas);
        return;
      }

      // Drawing shapes (Rect, Circle, Triangle, Line, Arrow)
      isDrawingShape.current = true;
      let shape: fabric.Object | null = null;
      
      const fill = fillColor;
      const stroke = strokeColor;
      
      if (activeTool === 'rect') {
        shape = new fabric.Rect({ left: pointer.x, top: pointer.y, width: 0, height: 0, fill, stroke, strokeWidth });
      } else if (activeTool === 'circle') {
        shape = new fabric.Circle({ left: pointer.x, top: pointer.y, radius: 0, fill, stroke, strokeWidth });
      } else if (activeTool === 'triangle') {
        shape = new fabric.Triangle({ left: pointer.x, top: pointer.y, width: 0, height: 0, fill, stroke, strokeWidth });
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], { stroke, strokeWidth, fill });
      }

      if (shape) {
        currentShape.current = shape;
        fabricCanvas.add(shape);
      }
    };

    const onMouseMove = (o: fabric.IEvent) => {
      if (!isDrawingShape.current) return;
      const pointer = fabricCanvas.getPointer(o.e);

      if (activeTool === 'hand') {
        const e = o.e as MouseEvent;
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.movementX;
          vpt[5] += e.movementY;
          fabricCanvas.requestRenderAll();
        }
        return;
      }

      if (!startPoint.current || !currentShape.current) return;
      const start = startPoint.current;
      const shape = currentShape.current;

      if (activeTool === 'rect' || activeTool === 'triangle') {
        shape.set({ width: Math.abs(pointer.x - start.x), height: Math.abs(pointer.y - start.y) });
        if (pointer.x < start.x) shape.set({ left: pointer.x });
        if (pointer.y < start.y) shape.set({ top: pointer.y });
      } else if (activeTool === 'circle') {
        const radius = Math.abs(pointer.x - start.x) / 2;
        (shape as fabric.Circle).set({ radius });
        if (pointer.x < start.x) shape.set({ left: pointer.x });
        if (pointer.y < start.y) shape.set({ top: pointer.y });
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        (shape as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
      }
      fabricCanvas.renderAll();
    };

    const onMouseUp = () => {
      if (activeTool === 'hand') {
        fabricCanvas.defaultCursor = 'grab';
      }
      if (isDrawingShape.current && currentShape.current) {
        
        // Add arrow head if it's an arrow
        if (activeTool === 'arrow' && startPoint.current) {
          const line = currentShape.current as fabric.Line;
          const headLength = 15;
          const dx = (line.x2 || 0) - (line.x1 || 0);
          const dy = (line.y2 || 0) - (line.y1 || 0);
          const angle = Math.atan2(dy, dx);
          
          const arrowHead = new fabric.Triangle({
            width: headLength, height: headLength, fill: strokeColor,
            left: line.x2, top: line.y2, originX: 'center', originY: 'center',
            angle: (angle * 180 / Math.PI) + 90
          });
          
          const group = new fabric.Group([line, arrowHead]);
          fabricCanvas.remove(line);
          fabricCanvas.add(group);
          fabricCanvas.setActiveObject(group);
        } else {
           fabricCanvas.setActiveObject(currentShape.current);
        }
        
        saveHistory(fabricCanvas);
      }
      isDrawingShape.current = false;
      currentShape.current = null;
      startPoint.current = null;
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', onMouseDown);
      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas.off('mouse:up', onMouseUp);
    };
  }, [activeTool, fabricCanvas, strokeColor, fillColor, strokeWidth, saveHistory]);

  const handleZoom = (delta: number) => {
    if (!fabricCanvas) return;
    let newZoom = fabricCanvas.getZoom() * delta;
    if (newZoom > 20) newZoom = 20;
    if (newZoom < 0.01) newZoom = 0.01;
    fabricCanvas.zoomToPoint({ x: fabricCanvas.getWidth() / 2, y: fabricCanvas.getHeight() / 2 }, newZoom);
    setZoom(newZoom);
  };

  const { showGrid } = useCanvasStore();

  return (
    <div ref={containerRef} className={`flex-1 h-full relative overflow-hidden bg-slate-50 ${showGrid ? 'pattern-dots' : ''}`}>
      {showGrid && (
        <style dangerouslySetInnerHTML={{__html: `
          .pattern-dots {
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}} />
      )}
      <canvas ref={canvasRef} />
      
      {/* Zoom Controls & Minimap Placeholder */}
      <div className="absolute bottom-4 left-4 bg-white shadow-md rounded-lg border border-slate-200 p-2 z-10 w-32 h-24 hidden md:block">
         <div className="w-full h-full bg-slate-50 rounded border border-slate-200 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-blue-400 bg-blue-400/10 rounded-sm"></div>
            <span className="absolute bottom-1 right-1 text-[8px] font-bold text-slate-400">MINIMAP</span>
         </div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white shadow-md rounded-lg border border-slate-200 p-1 flex items-center gap-1 z-10">
        <button onClick={() => handleZoom(0.8)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-lg font-medium transition-colors">-</button>
        <span className="text-xs font-semibold text-slate-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => handleZoom(1.2)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-lg font-medium transition-colors">+</button>
      </div>
    </div>
  );
}
