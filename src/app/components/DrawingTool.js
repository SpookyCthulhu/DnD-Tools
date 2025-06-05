'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const DrawingTool = ({ 
  zoom, 
  panOffset, 
  backgroundImage, 
  gridSize, 
  showGrid, 
  containerRef,
  isDrawingMode,
  setIsDrawingMode 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(0.5);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Redraw all paths
    redrawCanvas();
  }, [zoom, panOffset, backgroundImage]);

  // Redraw all paths on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    paths.forEach(path => {
      if (path.points.length < 2) return;

      context.globalAlpha = path.opacity;
      context.strokeStyle = path.color;
      context.lineWidth = path.size;
      context.beginPath();

      const firstPoint = path.points[0];
      const transformedStart = transformPoint(firstPoint.x, firstPoint.y);
      context.moveTo(transformedStart.x, transformedStart.y);

      path.points.forEach((point, index) => {
        if (index === 0) return;
        const transformed = transformPoint(point.x, point.y);
        context.lineTo(transformed.x, transformed.y);
      });

      context.stroke();
    });

    context.globalAlpha = 1;
  }, [paths, zoom, panOffset]);

  // Transform point based on current zoom and pan
  const transformPoint = (x, y) => {
    return {
      x: (x * zoom) + panOffset.x,
      y: (y * zoom) + panOffset.y
    };
  };

  // Inverse transform point (from screen coordinates to map coordinates)
  const inverseTransformPoint = (x, y) => {
    return {
      x: (x - panOffset.x) / zoom,
      y: (y - panOffset.y) / zoom
    };
  };

  // Start drawing
  const startDrawing = (e) => {
    if (!isDrawingMode) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to map coordinates
    const mapPoint = inverseTransformPoint(x, y);

    setIsDrawing(true);
    setCurrentPath([mapPoint]);
  };

  // Continue drawing
  const draw = (e) => {
    if (!isDrawing || !isDrawingMode) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to map coordinates
    const mapPoint = inverseTransformPoint(x, y);

    setCurrentPath(prev => [...prev, mapPoint]);

    // Draw current stroke
    const context = contextRef.current;
    if (currentPath.length > 0) {
      context.globalAlpha = brushOpacity;
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize * zoom;
      context.beginPath();

      const lastPoint = currentPath[currentPath.length - 1];
      const transformedLast = transformPoint(lastPoint.x, lastPoint.y);
      const transformedCurrent = transformPoint(mapPoint.x, mapPoint.y);

      context.moveTo(transformedLast.x, transformedLast.y);
      context.lineTo(transformedCurrent.x, transformedCurrent.y);
      context.stroke();
      context.globalAlpha = 1;
    }
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      const newPath = {
        id: Date.now(),
        points: currentPath,
        color: brushColor,
        size: brushSize,
        opacity: brushOpacity
      };
      setPaths(prev => [...prev, newPath]);
    }
    
    setCurrentPath([]);
  };

  // Clear all drawings
  const clearDrawings = () => {
    setPaths([]);
    const context = contextRef.current;
    const canvas = canvasRef.current;
    if (context && canvas) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Undo last drawing
  const undoLast = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  // Redraw when paths change
  useEffect(() => {
    redrawCanvas();
  }, [paths, redrawCanvas]);

  return (
    <>
      {/* Drawing Canvas */}
      {backgroundImage && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            pointerEvents: isDrawingMode ? 'auto' : 'none',
            cursor: isDrawingMode ? 'crosshair' : 'default',
            zIndex: 10
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      )}

      {/* Drawing Controls */}
      {isDrawingMode && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-20">
          <div className="flex flex-col gap-3 min-w-48">
            <h3 className="font-semibold text-sm">Drawing Tools</h3>
            
            {/* Color picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Color:</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Brush size */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Size:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-6">{brushSize}</span>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Opacity:</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8">{Math.round(brushOpacity * 100)}%</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={undoLast}
                disabled={paths.length === 0}
                className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Undo
              </button>
              <button
                onClick={clearDrawings}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Clear All
              </button>
            </div>

            <button
              onClick={() => setIsDrawingMode(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              Exit Drawing
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DrawingTool;