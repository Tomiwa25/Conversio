'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { WhiteboardPointer, WhiteboardSyncPayload } from '@conversio/shared';
import {
  Pen,
  Highlighter,
  Square,
  Circle,
  Eraser,
  RotateCcw,
  Download,
  Trash2,
  MousePointer,
} from 'lucide-react';

type Tool = 'pen' | 'highlighter' | 'rectangle' | 'ellipse' | 'eraser';

export const Whiteboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { manager, state } = useWebRTC();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<any>(null);

  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [remotePointers, setRemotePointers] = useState<Map<string, WhiteboardPointer>>(new Map());

  // Memory protection: history depth limit (max 15 snapshots)
  const MAX_HISTORY = 15;
  const historyRef = useRef<string[]>([]);
  const isRemoteLoadingRef = useRef<boolean>(false);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Broadcast Canvas State via Fabric.js built-in toJSON()
   */
  const broadcastSnapshot = useCallback(() => {
    if (!fabricCanvasRef.current || isRemoteLoadingRef.current) return;

    // Built-in Fabric.js JSON export
    const json = fabricCanvasRef.current.toJSON();

    // Memory optimization: Cap local undo stack to prevent memory leaks
    const jsonString = JSON.stringify(json);
    if (historyRef.current.length >= MAX_HISTORY) {
      historyRef.current.shift(); // Evict oldest
    }
    historyRef.current.push(jsonString);

    // Send over Reliable SCTP DataChannel
    manager.sendWhiteboardSnapshot({
      roomId: state.roomId || '',
      snapshot: json,
      timestamp: Date.now(),
    });
  }, [manager, state.roomId]);

  /**
   * Initialize Fabric.js Canvas
   */
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    let canvas: any = null;

    const initFabric = async () => {
      // Dynamic import to avoid SSR 'window is not defined'
      const fabricModule = await import('fabric');
      const fabric = (fabricModule as any).fabric || fabricModule;

      if (!canvasRef.current || fabricCanvasRef.current) return;

      const container = containerRef.current;
      const width = container ? container.clientWidth : 1000;
      const height = container ? container.clientHeight - 80 : 600;

      // Create Fabric Canvas with memory-conscious settings
      canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width,
        height,
        backgroundColor: '#0f172a', // Dark canvas
        selection: false,
        renderOnAddRemove: true,
      });

      // Memory optimization: Disable unnecessary caching on frequent drawing strokes
      if (fabric.Object) {
        fabric.Object.prototype.objectCaching = false;
      }

      fabricCanvasRef.current = canvas;

      // Configure default pen brush
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;

      // Listen for drawing changes (path:created, object:modified)
      const onCanvasChange = () => {
        if (isRemoteLoadingRef.current) return;

        // Debounce export to save CPU and DataChannel bandwidth
        if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = setTimeout(() => {
          broadcastSnapshot();
        }, 120);
      };

      canvas.on('path:created', onCanvasChange);
      canvas.on('object:modified', onCanvasChange);

      // Listen for mouse movement to send lightweight live pointer updates
      canvas.on('mouse:move', (opt: any) => {
        if (!opt.pointer || !state.currentUser) return;
        manager.sendPointerMove({
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          color: strokeColor,
          position: { x: opt.pointer.x, y: opt.pointer.y },
          isDrawing: canvas.isDrawingMode && Boolean(opt.e.buttons === 1),
          timestamp: Date.now(),
        });
      });
    };

    initFabric();

    return () => {
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isOpen]);

  /**
   * Listen for remote Fabric.js JSON snapshots via DataChannel
   */
  useEffect(() => {
    const unsubWhiteboard = manager.onWhiteboard((payload: WhiteboardSyncPayload) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !payload.snapshot) return;

      if (payload.clear) {
        canvas.clear();
        canvas.backgroundColor = '#0f172a';
        canvas.renderAll();
        return;
      }

      // Memory safeguard: Flag to avoid recursive broadcast loop
      isRemoteLoadingRef.current = true;

      // Built-in Fabric.js JSON import function: loadFromJSON
      canvas.loadFromJSON(payload.snapshot, () => {
        canvas.renderAll();
        isRemoteLoadingRef.current = false;
      });
    });

    const unsubPointer = manager.onPointer((pointer: WhiteboardPointer) => {
      setRemotePointers((prev) => {
        const next = new Map(prev);
        next.set(pointer.userId, pointer);
        return next;
      });
    });

    return () => {
      unsubWhiteboard();
      unsubPointer();
    };
  }, [manager]);

  /**
   * Update active tool settings
   */
  const handleToolChange = async (tool: Tool) => {
    setActiveTool(tool);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const fabricModule = await import('fabric');
    const fabric = (fabricModule as any).fabric || fabricModule;

    if (tool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    } else if (tool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'rgba(250, 204, 21, 0.35)'; // Semitransparent yellow
      canvas.freeDrawingBrush.width = 18;
    } else if (tool === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#0f172a'; // Match dark background
      canvas.freeDrawingBrush.width = 24;
    } else {
      canvas.isDrawingMode = false;
    }
  };

  /**
   * Add Shapes (Rectangle / Ellipse)
   */
  const addShape = async (type: 'rectangle' | 'ellipse') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const fabricModule = await import('fabric');
    const fabric = (fabricModule as any).fabric || fabricModule;

    let shape;
    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: 200,
        top: 150,
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        width: 160,
        height: 100,
        cornerColor: '#38bdf8',
        cornerSize: 8,
      });
    } else {
      shape = new fabric.Ellipse({
        left: 200,
        top: 150,
        rx: 80,
        ry: 50,
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        cornerColor: '#38bdf8',
        cornerSize: 8,
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    broadcastSnapshot();
  };

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#0f172a';
    canvas.renderAll();

    manager.sendWhiteboardSnapshot({
      roomId: state.roomId || '',
      clear: true,
      timestamp: Date.now(),
    });
  };

  const handleDownload = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 0.95 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `conversio-whiteboard-${Date.now()}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40 flex flex-col bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in"
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 mb-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-white mr-2">Whiteboard</span>

          {/* Tools */}
          <button
            onClick={() => handleToolChange('pen')}
            className={`p-2 rounded-lg text-sm flex items-center transition ${
              activeTool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
            title="Pen"
          >
            <Pen className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToolChange('highlighter')}
            className={`p-2 rounded-lg text-sm flex items-center transition ${
              activeTool === 'highlighter' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            onClick={() => addShape('rectangle')}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-700 transition"
            title="Add Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => addShape('ellipse')}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-700 transition"
            title="Add Ellipse"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToolChange('eraser')}
            className={`p-2 rounded-lg text-sm flex items-center transition ${
              activeTool === 'eraser' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-700 mx-2" />

          {/* Color Presets */}
          <div className="flex items-center space-x-1.5">
            {['#ffffff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setStrokeColor(c);
                  if (fabricCanvasRef.current?.freeDrawingBrush) {
                    fabricCanvasRef.current.freeDrawingBrush.color = c;
                  }
                }}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  strokeColor === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-6 w-px bg-slate-700 mx-2" />

          {/* Stroke Width Slider */}
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <span>Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => {
                const w = parseInt(e.target.value, 10);
                setStrokeWidth(w);
                if (fabricCanvasRef.current?.freeDrawingBrush) {
                  fabricCanvasRef.current.freeDrawingBrush.width = w;
                }
              }}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 transition flex items-center space-x-1 text-xs"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-700 transition flex items-center space-x-1 text-xs"
            title="Export PNG"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
        <canvas ref={canvasRef} className="block shadow-inner" />

        {/* Live Remote Peer Cursors Overlay */}
        {Array.from(remotePointers.values()).map((pointer) => {
          if (pointer.userId === state.currentUser?.id) return null;
          return (
            <div
              key={pointer.userId}
              className="absolute pointer-events-none transition-all duration-75 flex items-center space-x-1"
              style={{
                left: `${pointer.position.x}px`,
                top: `${pointer.position.y}px`,
                transform: 'translate(0, 0)',
              }}
            >
              <MousePointer
                className="w-4 h-4"
                style={{ color: pointer.color || '#38bdf8', fill: pointer.color || '#38bdf8' }}
              />
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow"
                style={{ backgroundColor: pointer.color || '#38bdf8' }}
              >
                {pointer.userName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

