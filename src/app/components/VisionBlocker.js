'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const VisionBlocker = ({ 
  zoom, 
  panOffset, 
  backgroundImage, 
  gridSize, 
  containerRef,
  isVisionBlockMode,
  setIsVisionBlockMode,
  visionBlocks,
  setVisionBlocks
}) => {
  const [isPlacing, setIsPlacing] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());
  const [currentBlock, setCurrentBlock] = useState(null);
  const [blockOpacity, setBlockOpacity] = useState(0.8);
  const [blockColor, setBlockColor] = useState('#000000');
  const [snapToGrid, setSnapToGrid] = useState(true);
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
    contextRef.current = context;

    // Redraw all visionBlocks
    redrawCanvas();
  }, [zoom, panOffset, backgroundImage]);

  // Redraw all blocks on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply the same transform as the map
    context.save();
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    context.translate(centerX, centerY);
    context.scale(zoom, zoom);
    context.translate(-centerX + panOffset.x / zoom, -centerY + panOffset.y / zoom);

    // Draw all blocks
    visionBlocks.forEach(block => {
      drawBlock(context, block);
    });

    // Draw current block being placed
    if (currentBlock) {
      drawBlock(context, currentBlock, true);
    }

    context.restore();
  }, [visionBlocks, currentBlock, zoom, panOffset]);

  // Draw a single block
  const drawBlock = (context, block, isPreview = false) => {
    const x = Math.min(block.startX, block.endX);
    const y = Math.min(block.startY, block.endY);
    const width = Math.abs(block.endX - block.startX);
    const height = Math.abs(block.endY - block.startY);

    // Fill
    context.globalAlpha = isPreview ? blockOpacity * 0.5 : block.opacity;
    context.fillStyle = block.color;
    context.fillRect(x, y, width, height);

    // Border
    context.globalAlpha = 1;
    context.strokeStyle = selectedBlocks.has(block.id) ? '#ff0000' : '#666666';
    context.lineWidth = selectedBlocks.has(block.id) ? 2 : 1;
    context.strokeRect(x, y, width, height);

    // Selection handles for selected blocks
    if (selectedBlocks.has(block.id) && !isPreview) {
      drawSelectionHandles(context, x, y, width, height);
    }
  };

  // Draw selection handles
  const drawSelectionHandles = (context, x, y, width, height) => {
    const handleSize = 6;
    context.fillStyle = '#ff0000';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;

    // Corner handles
    const handles = [
      { x: x - handleSize/2, y: y - handleSize/2 },
      { x: x + width - handleSize/2, y: y - handleSize/2 },
      { x: x - handleSize/2, y: y + height - handleSize/2 },
      { x: x + width - handleSize/2, y: y + height - handleSize/2 }
    ];

    handles.forEach(handle => {
      context.fillRect(handle.x, handle.y, handleSize, handleSize);
      context.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Transform point from screen to map coordinates
  const screenToMapCoordinates = (screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Reverse the transformation
    const x = (screenX - centerX - panOffset.x) / zoom + centerX;
    const y = (screenY - centerY - panOffset.y) / zoom + centerY;

    return { x, y };
  };

  // Snap to grid if enabled
  const snapToGridIfEnabled = (x, y) => {
    if (!snapToGrid) return { x, y };
    
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    return { x: snappedX, y: snappedY };
  };

  // Start placing block
  const startPlacing = (e) => {
    if (!isVisionBlockMode) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert to map coordinates
    const mapPoint = screenToMapCoordinates(screenX, screenY);
    const snappedPoint = snapToGridIfEnabled(mapPoint.x, mapPoint.y);

    // Check if clicking on existing block for selection
    const clickedBlock = findBlockAtPoint(mapPoint.x, mapPoint.y);
    if (clickedBlock) {
      handleBlockSelection(clickedBlock, e.ctrlKey || e.metaKey);
      return;
    }

    // Clear selection if clicking on empty space
    if (!e.ctrlKey && !e.metaKey) {
      setSelectedBlocks(new Set());
    }

    setIsPlacing(true);
    setCurrentBlock({
      id: Date.now(),
      startX: snappedPoint.x,
      startY: snappedPoint.y,
      endX: snappedPoint.x,
      endY: snappedPoint.y,
      color: blockColor,
      opacity: blockOpacity
    });
  };

  // Continue placing block
  const continuePlacing = (e) => {
    if (!isPlacing || !isVisionBlockMode || !currentBlock) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert to map coordinates
    const mapPoint = screenToMapCoordinates(screenX, screenY);
    const snappedPoint = snapToGridIfEnabled(mapPoint.x, mapPoint.y);

    setCurrentBlock(prev => ({
      ...prev,
      endX: snappedPoint.x,
      endY: snappedPoint.y
    }));
  };

  // Stop placing block
  const stopPlacing = () => {
    if (!isPlacing || !currentBlock) return;

    setIsPlacing(false);
    
    // Only add block if it has some size
    const width = Math.abs(currentBlock.endX - currentBlock.startX);
    const height = Math.abs(currentBlock.endY - currentBlock.startY);
    
    if (width > 5 && height > 5) {
      setVisionBlocks(prev => [...prev, currentBlock]);
    }
    
    setCurrentBlock(null);
  };

  // Find block at point
  const findBlockAtPoint = (x, y) => {
    // Check in reverse order to get topmost block
    for (let i = visionBlocks.length - 1; i >= 0; i--) {
      const block = visionBlocks[i];
      const minX = Math.min(block.startX, block.endX);
      const maxX = Math.max(block.startX, block.endX);
      const minY = Math.min(block.startY, block.endY);
      const maxY = Math.max(block.startY, block.endY);

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return block;
      }
    }
    return null;
  };

  // Handle block selection
  const handleBlockSelection = (block, addToSelection) => {
    setSelectedBlocks(prev => {
      const newSelection = new Set(prev);
      
      if (addToSelection) {
        if (newSelection.has(block.id)) {
          newSelection.delete(block.id);
        } else {
          newSelection.add(block.id);
        }
      } else {
        newSelection.clear();
        newSelection.add(block.id);
      }
      
      return newSelection;
    });
  };

  // Delete selected blocks
  const deleteSelectedBlocks = useCallback(() => {
    if (selectedBlocks.size === 0) return;
    
    setVisionBlocks(prev => prev.filter(block => !selectedBlocks.has(block.id)));
    setSelectedBlocks(new Set());
  }, [selectedBlocks]);

  // Clear all blocks
  const clearAllBlocks = () => {
    setVisionBlocks([]);
    setSelectedBlocks(new Set());
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisionBlockMode) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedBlocks();
      } else if (e.key === 'Escape') {
        setSelectedBlocks(new Set());
        setCurrentBlock(null);
        setIsPlacing(false);
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedBlocks(new Set(visionBlocks.map(block => block.id)));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisionBlockMode, deleteSelectedBlocks, visionBlocks]);

  // Redraw when blocks or selection changes
  useEffect(() => {
    redrawCanvas();
  }, [visionBlocks, selectedBlocks, redrawCanvas]);

  return (
    <>
      {/* Vision Blocker Canvas */}
      {backgroundImage && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            pointerEvents: isVisionBlockMode ? 'auto' : 'none',
            cursor: isVisionBlockMode ? 'crosshair' : 'default',
            zIndex: 15
          }}
          onMouseDown={startPlacing}
          onMouseMove={continuePlacing}
          onMouseUp={stopPlacing}
          onMouseLeave={stopPlacing}
        />
      )}

      {/* Vision Blocker Controls */}
      {isVisionBlockMode && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-20">
          <div className="flex flex-col gap-3 min-w-48">
            <h3 className="font-semibold text-sm">Vision Blocker</h3>
            
            {/* Color picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Color:</label>
              <input
                type="color"
                value={blockColor}
                onChange={(e) => setBlockColor(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Opacity:</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={blockOpacity}
                onChange={(e) => setBlockOpacity(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8">{Math.round(blockOpacity * 100)}%</span>
            </div>

            {/* Snap to grid */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              <span className="text-xs">Snap to Grid</span>
            </label>

            {/* Selection info */}
            {selectedBlocks.size > 0 && (
              <div className="text-xs text-gray-600">
                {selectedBlocks.size} block(s) selected
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={deleteSelectedBlocks}
                disabled={selectedBlocks.size === 0}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Delete Selected
              </button>
              <button
                onClick={clearAllBlocks}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Clear All
              </button>
            </div>

            {/* Keyboard shortcuts */}
            <div className="text-xs text-gray-600 border-t pt-2">
              <div>Del: Delete selected</div>
              <div>Ctrl+A: Select all</div>
              <div>Ctrl+Click: Multi-select</div>
              <div>Esc: Clear selection</div>
            </div>

            <button
              onClick={() => setIsVisionBlockMode(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              Exit Vision Blocker
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VisionBlocker;