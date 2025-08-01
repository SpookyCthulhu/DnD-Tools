'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import usePanZoom from '../hooks/usePanZoom';
import ImageUploader from './ImageUploader';
import SaveLoadManager from './saveLoadManager';
import UnifiedCanvas from './UnifiedCanvas';

const MapTool = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [gridSize, setGridSize] = useState(40);
  const [showGrid, setShowGrid] = useState(true);
  const [activeMode, setActiveMode] = useState(null); // 'drawing', 'tokens', 'vision', or null
  
  // Canvas data
  const [tokens, setTokens] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [visionBlocks, setVisionBlocks] = useState([]);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI state
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [draggedToken, setDraggedToken] = useState(null);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [currentVisionBlock, setCurrentVisionBlock] = useState(null);
  const [selectedVisionBlocks, setSelectedVisionBlocks] = useState(new Set());
  const [isPlacingVisionBlock, setIsPlacingVisionBlock] = useState(false);
  
  // Token creation state
  const [newTokenColor, setNewTokenColor] = useState('#ff0000');
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [newTokenSize, setNewTokenSize] = useState('normal');
  
  // Drawing state
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(0.5);
  
  // Vision block state
  const [blockColor, setBlockColor] = useState('#000000');
  const [blockOpacity, setBlockOpacity] = useState(1.0); // Changed default to 100%
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [freehandMode, setFreehandMode] = useState(false);
  const [freehandVisionBlock, setFreehandVisionBlock] = useState(null);

  const containerRef = useRef(null);

  // Use the pan/zoom hook
  const {
    zoom,
    panOffset,
    isPanning,
    setZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleZoom,
    resetView,
    resetForNewImage,
    setPanOffset
  } = usePanZoom();

  // Token size multipliers
  const sizeMultipliers = {
    normal: 0.9,
    large: 1.5
  };

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const currentState = {
      tokens: [...tokens],
      drawings: [...drawings],
      visionBlocks: [...visionBlocks]
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [tokens, drawings, visionBlocks, history, historyIndex]);

  // Undo action
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      
      setTokens(prevState.tokens);
      setDrawings(prevState.drawings);
      setVisionBlocks(prevState.visionBlocks);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Redo action
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      setTokens(nextState.tokens);
      setDrawings(nextState.drawings);
      setVisionBlocks(nextState.visionBlocks);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      
      // Delete selected items
      if (activeMode === 'vision' && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        setVisionBlocks(prev => {
          const newBlocks = prev.filter(block => !selectedVisionBlocks.has(block.id));
          if (newBlocks.length !== prev.length) {
            saveToHistory();
          }
          return newBlocks;
        });
        setSelectedVisionBlocks(new Set());
      } else if (selectedTokenId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        setTokens(prev => {
          const newTokens = prev.filter(token => token.id !== selectedTokenId);
          if (newTokens.length !== prev.length) {
            saveToHistory();
          }
          return newTokens;
        });
        setSelectedTokenId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, selectedVisionBlocks, selectedTokenId, undo, redo, saveToHistory]);

  const handleImageLoaded = (dataUrl) => {
    setBackgroundImage(dataUrl);
    resetForNewImage();
    // Initialize history with empty state
    setHistory([{
      tokens: [],
      drawings: [],
      visionBlocks: []
    }]);
    setHistoryIndex(0);
  };

  // Set active mode
  const setMode = (mode) => {
    setActiveMode(activeMode === mode ? null : mode);
    setSelectedTokenId(null);
    setSelectedVisionBlocks(new Set());
    setIsPlacingVisionBlock(false);
    setFreehandVisionBlock(null);
  };

  // Snap to grid helper
  const snapToGridIfEnabled = useCallback((x, y) => {
    if (!snapToGrid || activeMode !== 'vision' || freehandMode) return { x, y };
    
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    return { x: snappedX, y: snappedY };
  }, [snapToGrid, gridSize, activeMode, freehandMode]);

  // Handle canvas click (for token placement)
  const handleCanvasClick = useCallback((e, coords) => {
    if (activeMode === 'tokens' && newTokenLabel.trim()) {
      saveToHistory();
      const newToken = {
        id: Date.now(),
        x: coords.x,
        y: coords.y,
        color: newTokenColor,
        label: newTokenLabel.trim(),
        size: gridSize * sizeMultipliers[newTokenSize],
        sizeType: newTokenSize
      };
      
      setTokens(prev => [...prev, newToken]);
    }
  }, [activeMode, newTokenLabel, newTokenColor, newTokenSize, gridSize, saveToHistory]);

  // Handle canvas mouse down
  const handleCanvasMouseDown = useCallback((e, coords) => {
    if (activeMode === 'drawing') {
      // Start drawing
      setCurrentDrawing({
        points: [coords],
        color: brushColor,
        size: brushSize,
        opacity: brushOpacity
      });
    } else if (activeMode === 'vision') {
      if (freehandMode) {
        // Start freehand vision block
        setFreehandVisionBlock({
          points: [coords],
          color: blockColor,
          opacity: blockOpacity
        });
      } else {
        // Check if starting to drag (for creating new block)
        setIsPlacingVisionBlock(true);
        
        // Check if clicking on existing block
        const clickedBlock = visionBlocks.find(block => {
          if (block.type === 'freehand' && block.points) {
            // Check if point is inside polygon
            return isPointInPolygon(coords, block.points);
          } else {
            const minX = Math.min(block.startX, block.endX);
            const maxX = Math.max(block.startX, block.endX);
            const minY = Math.min(block.startY, block.endY);
            const maxY = Math.max(block.startY, block.endY);
            return coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY;
          }
        });

        if (clickedBlock) {
          // Toggle selection
          if (e.ctrlKey || e.metaKey) {
            setSelectedVisionBlocks(prev => {
              const newSet = new Set(prev);
              if (newSet.has(clickedBlock.id)) {
                newSet.delete(clickedBlock.id);
              } else {
                newSet.add(clickedBlock.id);
              }
              return newSet;
            });
          } else {
            setSelectedVisionBlocks(new Set([clickedBlock.id]));
          }
        } else {
          // Start placing new block
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedVisionBlocks(new Set());
          }
          const snapped = snapToGridIfEnabled(coords.x, coords.y);
          setCurrentVisionBlock({
            startX: snapped.x,
            startY: snapped.y,
            endX: snapped.x,
            endY: snapped.y,
            color: blockColor,
            opacity: blockOpacity
          });
        }
      }
    } else if (!activeMode) {
      // Check if clicking on a token
      const clickedToken = tokens.find(token => {
        const dx = coords.x - token.x;
        const dy = coords.y - token.y;
        return Math.sqrt(dx * dx + dy * dy) <= token.size / 2;
      });

      if (clickedToken) {
        setSelectedTokenId(clickedToken.id);
        setDraggedToken({
          id: clickedToken.id,
          offsetX: coords.x - clickedToken.x,
          offsetY: coords.y - clickedToken.y
        });
      } else {
        setSelectedTokenId(null);
        handlePanStart(e);
      }
    }
  }, [activeMode, tokens, visionBlocks, brushColor, brushSize, brushOpacity, blockColor, blockOpacity, snapToGridIfEnabled, handlePanStart, freehandMode]);

  // Helper function to check if point is inside polygon
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Handle canvas mouse move
  const handleCanvasMouseMove = useCallback((e, coords) => {
    if (activeMode === 'drawing' && currentDrawing) {
      // Continue drawing
      setCurrentDrawing(prev => ({
        ...prev,
        points: [...prev.points, coords]
      }));
    } else if (activeMode === 'vision') {
      if (freehandMode && freehandVisionBlock) {
        // Continue freehand vision block
        setFreehandVisionBlock(prev => ({
          ...prev,
          points: [...prev.points, coords]
        }));
      } else if (currentVisionBlock && isPlacingVisionBlock) {
        // Continue placing rectangular vision block
        const snapped = snapToGridIfEnabled(coords.x, coords.y);
        setCurrentVisionBlock(prev => ({
          ...prev,
          endX: snapped.x,
          endY: snapped.y
        }));
      }
    } else if (!activeMode && draggedToken) {
      // Drag token
      setTokens(prev => prev.map(token =>
        token.id === draggedToken.id
          ? { ...token, x: coords.x - draggedToken.offsetX, y: coords.y - draggedToken.offsetY }
          : token
      ));
    } else if (!activeMode && isPanning) {
      handlePanMove(e);
    }
  }, [activeMode, currentDrawing, currentVisionBlock, draggedToken, isPanning, snapToGridIfEnabled, handlePanMove, freehandMode, freehandVisionBlock, isPlacingVisionBlock]);

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback((e, coords) => {
    if (activeMode === 'drawing' && currentDrawing) {
      // Finish drawing
      if (currentDrawing.points.length > 1) {
        saveToHistory();
        setDrawings(prev => [...prev, { ...currentDrawing, id: Date.now() }]);
      }
      setCurrentDrawing(null);
    } else if (activeMode === 'vision') {
      if (freehandMode && freehandVisionBlock) {
        // Finish freehand vision block
        if (freehandVisionBlock.points.length > 2) {
          saveToHistory();
          setVisionBlocks(prev => [...prev, {
            ...freehandVisionBlock,
            id: Date.now(),
            type: 'freehand'
          }]);
        }
        setFreehandVisionBlock(null);
      } else if (currentVisionBlock && isPlacingVisionBlock) {
        // Finish placing rectangular vision block
        const width = Math.abs(currentVisionBlock.endX - currentVisionBlock.startX);
        const height = Math.abs(currentVisionBlock.endY - currentVisionBlock.startY);
        
        // Only create block if dragged (not just clicked)
        if (width > 5 && height > 5) {
          saveToHistory();
          setVisionBlocks(prev => [...prev, { ...currentVisionBlock, id: Date.now() }]);
        }
        setCurrentVisionBlock(null);
      }
      setIsPlacingVisionBlock(false);
    } else if (!activeMode) {
      if (draggedToken) {
        saveToHistory();
      }
      setDraggedToken(null);
      handlePanEnd();
    }
  }, [activeMode, currentDrawing, currentVisionBlock, handlePanEnd, saveToHistory, freehandMode, freehandVisionBlock, isPlacingVisionBlock]);

  // Handle wheel events
  const handleWheelEvent = (e) => {
    handleZoom(e, activeMode !== null);
  };

  // Clear entire canvas
  const clearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This will remove all tokens, drawings, and vision blocks.')) {
      saveToHistory();
      setTokens([]);
      setDrawings([]);
      setVisionBlocks([]);
      setSelectedTokenId(null);
      setSelectedVisionBlocks(new Set());
    }
  };

  // Clear functions
  const clearAllDrawings = () => {
    saveToHistory();
    setDrawings([]);
  };

  const clearAllVisionBlocks = () => {
    saveToHistory();
    setVisionBlocks([]);
    setSelectedVisionBlocks(new Set());
  };

  // Undo last drawing
  const undoLastDrawing = () => {
    saveToHistory();
    setDrawings(prev => prev.slice(0, -1));
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Fixed Controls */}
      <div className="bg-white shadow-md p-4 flex flex-wrap items-center gap-4 flex-shrink-0 sticky top-0 z-10">
        <h1 className="text-xl font-bold">D&D Map Tool</h1>
        
        {/* Grid controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm">Grid Size:</label>
         <input
           type="range"
           min="10"
           max="80"
           value={gridSize}
           onChange={(e) => setGridSize(parseInt(e.target.value))}
           className="w-20"
           disabled={activeMode !== null}
         />
         <span className="text-sm w-8">{gridSize}</span>
       </div>

       {/* Zoom controls */}
       <div className="flex items-center gap-2">
         <label className="text-sm">Zoom:</label>
         <input
           type="range"
           min="0.5"
           max="6"
           step="0.1"
           value={zoom}
           onChange={(e) => setZoom(parseFloat(e.target.value))}
           className="w-20"
           disabled={activeMode !== null}
         />
         <span className="text-sm w-12">{zoom.toFixed(1)}x</span>
       </div>

       <button
         onClick={resetView}
         disabled={activeMode !== null}
         className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
       >
         Reset View
       </button>

       <label className="flex items-center gap-2">
         <input
           type="checkbox"
           checked={showGrid}
           onChange={(e) => setShowGrid(e.target.checked)}
           disabled={activeMode !== null}
         />
         <span className="text-sm">Show Grid</span>
       </label>

       {/* Mode buttons - only show when no mode is active */}
       {!activeMode && (
         <>
           <button
             onClick={() => setMode('drawing')}
             disabled={!backgroundImage}
             className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
           >
             Drawing Mode
           </button>

           <button
             onClick={() => setMode('tokens')}
             disabled={!backgroundImage}
             className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
           >
             Token Mode
           </button>

           <button
             onClick={() => setMode('vision')}
             disabled={!backgroundImage}
             className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
           >
             Vision Blocker
           </button>

           <button
             onClick={clearCanvas}
             disabled={!backgroundImage || (tokens.length === 0 && drawings.length === 0 && visionBlocks.length === 0)}
             className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
           >
             Clear Canvas
           </button>
         </>
       )}

       {/* Spacer to push remaining items to the right */}
       <div className="flex-1"></div>

       {/* Undo/Redo buttons */}
       <button
         onClick={undo}
         disabled={historyIndex <= 0}
         className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
         title="Undo (Ctrl+Z)"
       >
         ↶ Undo
       </button>
       
       <button
         onClick={redo}
         disabled={historyIndex >= history.length - 1}
         className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
         title="Redo (Ctrl+Y)"
       >
         ↷ Redo
       </button>

       {/* Save/Load on far right */}
       <SaveLoadManager
         tokens={tokens}
         setTokens={setTokens}
         drawings={drawings}
         setDrawings={setDrawings}
         visionBlocks={visionBlocks}
         setVisionBlocks={setVisionBlocks}
         backgroundImage={backgroundImage}
         gridSize={gridSize}
         zoom={zoom}
         panOffset={panOffset}
         setGridSize={setGridSize}
         setZoom={setZoom}
         setPanOffset={setPanOffset}
       />
     </div>

     {/* Map area */}
     <div className="flex-1 overflow-hidden p-4">
       {!backgroundImage ? (
         <ImageUploader onImageLoaded={handleImageLoaded} />
       ) : (
         <div
           ref={containerRef}
           className="h-full w-full overflow-hidden relative rounded-lg border border-gray-300 bg-gray-200"
           onWheel={handleWheelEvent}
         >
           <UnifiedCanvas
             backgroundImage={backgroundImage}
             gridSize={gridSize}
             showGrid={showGrid}
             zoom={zoom}
             panOffset={panOffset}
             tokens={tokens}
             drawings={drawings}
             visionBlocks={visionBlocks}
             activeMode={activeMode}
             onCanvasClick={handleCanvasClick}
             onCanvasMouseDown={handleCanvasMouseDown}
             onCanvasMouseMove={handleCanvasMouseMove}
             onCanvasMouseUp={handleCanvasMouseUp}
             selectedTokenId={selectedTokenId}
             currentDrawing={currentDrawing}
             currentVisionBlock={currentVisionBlock}
             selectedVisionBlocks={selectedVisionBlocks}
             freehandVisionBlock={freehandVisionBlock}
           />

           {/* Mode UI Windows */}
           {/* Drawing Mode UI */}
           {activeMode === 'drawing' && (
             <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-20">
               <div className="flex flex-col gap-3 min-w-48">
                 <h3 className="font-semibold text-sm">Drawing Tools</h3>
                 
                 <div className="flex items-center gap-2">
                   <label className="text-xs font-medium">Color:</label>
                   <input
                     type="color"
                     value={brushColor}
                     onChange={(e) => setBrushColor(e.target.value)}
                     className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                   />
                 </div>

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

                 <div className="flex gap-2">
                   <button
                     onClick={undoLastDrawing}
                     disabled={drawings.length === 0}
                     className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                   >
                     Undo Last
                   </button>
                   <button
                     onClick={clearAllDrawings}
                     className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                   >
                     Clear All
                   </button>
                 </div>

                 <button
                   onClick={() => setMode(null)}
                   className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                 >
                   Exit Drawing
                 </button>
               </div>
             </div>
           )}

           {/* Token Mode UI */}
           {activeMode === 'tokens' && (
             <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-20">
               <div className="flex flex-col gap-3 min-w-48">
                 <h3 className="font-semibold text-sm">Token Manager</h3>
                 
                 <div className="flex flex-col gap-1">
                   <label className="text-xs font-medium">Token Label:</label>
                   <input
                     type="text"
                     placeholder="Enter token name"
                     value={newTokenLabel}
                     onChange={(e) => setNewTokenLabel(e.target.value)}
                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                     maxLength="20"
                     autoFocus
                   />
                   {!newTokenLabel.trim() && (
                     <span className="text-xs text-red-500">Enter a label to place tokens</span>
                   )}
                 </div>

                 <div className="flex items-center gap-2">
                   <label className="text-xs font-medium">Color:</label>
                   <input
                     type="color"
                     value={newTokenColor}
                     onChange={(e) => setNewTokenColor(e.target.value)}
                     className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                   />
                   <span className="text-xs text-gray-600 flex-1">
                     Click map to place token
                   </span>
                 </div>

                 <div className="flex items-center gap-2">
                   <label className="text-xs font-medium">Size:</label>
                   <select
                     value={newTokenSize}
                     onChange={(e) => setNewTokenSize(e.target.value)}
                     className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                   >
                     <option value="normal">Normal</option>
                     <option value="large">Large</option>
                   </select>
                 </div>

                 <div className="text-xs text-gray-600">
                   {tokens.length} token{tokens.length !== 1 ? 's' : ''} on map
                 </div>

                 <div className="text-xs text-gray-600 border-t pt-2">
                   <div>• Click anywhere to place</div>
                   <div>• Drag tokens to move</div>
                   <div>• Select and press Delete</div>
                 </div>

                 <button
                   onClick={() => setMode(null)}
                   className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                 >
                   Exit Token Mode
                 </button>
               </div>
             </div>
           )}

           {/* Vision Blocker Mode UI */}
           {activeMode === 'vision' && (
             <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-20">
               <div className="flex flex-col gap-3 min-w-48">
                 <h3 className="font-semibold text-sm">Vision Blocker</h3>
                 
                 <label className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     checked={freehandMode}
                     onChange={(e) => setFreehandMode(e.target.checked)}
                   />
                   <span className="text-xs font-medium">Freehand Mode</span>
                 </label>

                 <div className="flex items-center gap-2">
                   <label className="text-xs font-medium">Color:</label>
                   <input
                     type="color"
                     value={blockColor}
                     onChange={(e) => setBlockColor(e.target.value)}
                     className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                   />
                 </div>

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

                 {!freehandMode && (
                   <label className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       checked={snapToGrid}
                       onChange={(e) => setSnapToGrid(e.target.checked)}
                     />
                     <span className="text-xs">Snap to Grid</span>
                   </label>
                 )}

                 {selectedVisionBlocks.size > 0 && (
                   <div className="text-xs text-gray-600">
                     {selectedVisionBlocks.size} block(s) selected
                   </div>
                 )}

                 <div className="flex gap-2">
                   <button
                     onClick={() => {
                       saveToHistory();
                       setVisionBlocks(prev => prev.filter(block => !selectedVisionBlocks.has(block.id)));
                       setSelectedVisionBlocks(new Set());
                     }}
                     disabled={selectedVisionBlocks.size === 0}
                     className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                   >
                     Delete Selected
                   </button>
                   <button
                     onClick={clearAllVisionBlocks}
                     className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                   >
                     Clear All
                   </button>
                 </div>

                 <div className="text-xs text-gray-600 border-t pt-2">
                   {freehandMode ? (
                     <div>Draw freehand shapes</div>
                   ) : (
                     <>
                       <div>Click & drag: Create block</div>
                       <div>Click: Select block</div>
                     </>
                   )}
                   <div>Del: Delete selected</div>
                   <div>Ctrl+Click: Multi-select</div>
                 </div>

                 <button
                   onClick={() => setMode(null)}
                   className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                 >
                   Exit Vision Blocker
                 </button>
               </div>
             </div>
           )}

           {/* Control hints */}
           <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
             <div>
               {activeMode === 'vision' 
                 ? freehandMode 
                   ? 'Vision Blocker: Draw freehand shapes | Shape auto-closes when you release'
                   : 'Vision Blocker: Click and drag to create blocks | Click to select'
                 : activeMode === 'drawing' 
                   ? 'Drawing Mode: Click and drag to draw'
                   : activeMode === 'tokens'
                     ? 'Token Mode: Click to place token | Select and press Delete to remove'
                     : 'Scroll: Zoom | Drag: Pan | Ctrl+Z: Undo | Ctrl+Y: Redo'
               }
             </div>
           </div>

           {/* Change map button */}
           <button
             onClick={() => {
               if (window.confirm('Are you sure you want to change the map? This will clear all tokens, drawings, and vision blocks.')) {
                 setBackgroundImage(null);
                 setTokens([]);
                 setDrawings([]);
                 setVisionBlocks([]);
                 setHistory([]);
                 setHistoryIndex(-1);
               }
             }}
             className="absolute top-4 left-4 px-3 py-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-all"
           >
             Change Map
           </button>
         </div>
       )}
     </div>
   </div>
 );
};

export default MapTool;