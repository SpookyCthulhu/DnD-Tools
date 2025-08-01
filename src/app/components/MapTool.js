'use client';

import { useState, useRef } from 'react';
import DrawingTool from './DrawingTool';
import usePanZoom from '../hooks/usePanZoom';
import ImageUploader from './ImageUploader';
import TokenManager from './TokenManager';
import VisionBlocker from './VisionBlocker';
import SaveLoadManager from './saveLoadManager';

const MapTool = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [draggedToken, setDraggedToken] = useState(null);
  const [gridSize, setGridSize] = useState(40);
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isVisionBlockMode, setIsVisionBlockMode] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [visionBlocks, setVisionBlocks] = useState([]);

  const mapRef = useRef(null);
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

  // Initialize TokenManager
  const tokenManager = TokenManager({ 
    gridSize, 
    isDrawingMode: isDrawingMode || isVisionBlockMode,     
    zoom, 
    panOffset,
    onTokenMouseDown: handleTokenMouseDown,
    containerRef // Pass containerRef to TokenManager
  });

  const handleImageLoaded = (dataUrl) => {
    setBackgroundImage(dataUrl);
    resetForNewImage();
  };

  // Handle token drag start
  function handleTokenMouseDown(e, tokenId) {
    if (isDrawingMode) return; // Don't allow token dragging in drawing mode
    
    e.preventDefault();
    e.stopPropagation();
    const token = tokenManager.tokens.find(t => t.id === tokenId);
    const rect = mapRef.current.getBoundingClientRect();
    
    setDraggedToken({
      id: tokenId,
      offsetX: e.clientX - rect.left - token.x,
      offsetY: e.clientY - rect.top - token.y
    });
  }

  // Handle mouse move for dragging and panning
  const handleMouseMove = (e) => {
    if (isDrawingMode || isVisionBlockMode) return; // Don't handle mouse move for panning/dragging in drawing mode

    if (draggedToken) {
      // Token dragging - free movement, no grid snapping
      const rect = mapRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - draggedToken.offsetX;
      const newY = e.clientY - rect.top - draggedToken.offsetY;

      tokenManager.updateTokenPosition(draggedToken.id, newX, newY);
    } else {
      // Handle panning through the hook
      handlePanMove(e);
    }
  };

  // Handle mouse down for panning
  const handleMouseDown = (e) => {
    handlePanStart(e, draggedToken, isDrawingMode || isVisionBlockMode);
  };

  // Handle mouse up to stop dragging/panning
  const handleMouseUp = () => {
    if (isDrawingMode || isVisionBlockMode) return; // Don't handle mouse up for panning/dragging in drawing mode
    
    setDraggedToken(null);
    handlePanEnd();
  };

  // Handle wheel events for zooming
  const handleWheelEvent = (e) => {
    handleZoom(e, isDrawingMode || isVisionBlockMode);
  };

  // Generate grid pattern
  const generateGridPattern = () => {
    if (!showGrid) return '';
    
    return `
      linear-gradient(to right, rgba(128,128,128,0.5) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(128,128,128,0.5) 1px, transparent 1px)
    `;
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Fixed Controls */}
      <div className="bg-white shadow-md p-4 flex flex-wrap items-center gap-4 flex-shrink-0 sticky top-0 z-10">
        <h1 className="text-xl font-bold">D&D Map Tool</h1>

        <SaveLoadManager
          tokens={tokenManager.tokens}
          setTokens={tokenManager.setTokens}
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
            disabled={isDrawingMode}
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
            disabled={isDrawingMode}
          />
          <span className="text-sm w-12">{zoom.toFixed(1)}x</span>
        </div>

        <button
          onClick={resetView}
          disabled={isDrawingMode}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Reset View
        </button>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            disabled={isDrawingMode}
          />
          <span className="text-sm">Show Grid</span>
        </label>

        {/* Drawing mode toggle */}
        <button
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          disabled={!backgroundImage}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            isDrawingMode 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isDrawingMode ? 'Drawing Mode ON' : 'Drawing Mode'}
        </button>

        {/* Token creation controls */}
        {tokenManager.renderTokenCreationControls()}

        {/* Clear all tokens button */}
        {tokenManager.renderClearAllButton()}

        <button
          onClick={() => setIsVisionBlockMode(!isVisionBlockMode)}
          disabled={!backgroundImage}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            isVisionBlockMode 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-orange-500 text-white hover:bg-orange-600'
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isVisionBlockMode ? 'Vision Blocker ON' : 'Vision Blocker'}
        </button>
      </div>

      {/* Map area */}
      <div className="flex-1 overflow-hidden p-4">
        {!backgroundImage ? (
          <ImageUploader onImageLoaded={handleImageLoaded} />
        ) : (
          <div
            ref={containerRef}
            className="h-full w-full overflow-hidden relative rounded-lg border border-gray-300 bg-gray-200"
            style={{ 
              cursor: isDrawingMode ? 'crosshair' : (isPanning ? 'grabbing' : (draggedToken ? 'crosshair' : 'grab'))
            }}
          >
            {/* Image container with grid overlay */}
            <div
              ref={mapRef}
              className="absolute inset-0"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheelEvent}
            >
              {/* Image with grid overlay */}
              <div
                className="relative max-w-full max-h-full"
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%'
                }}
              >
                {/* Grid overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: generateGridPattern(),
                      backgroundSize: `${gridSize}px ${gridSize}px`,
                      maskImage: `url(${backgroundImage})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskImage: `url(${backgroundImage})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center'
                    }}
                  />
                )}
              </div>

              {/* Render tokens */}
              {tokenManager.renderTokens()}
            </div>

            {/* Drawing Tool */}
            <DrawingTool
              zoom={zoom}
              panOffset={panOffset}
              backgroundImage={backgroundImage}
              gridSize={gridSize}
              showGrid={showGrid}
              containerRef={containerRef}
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
              drawings={drawings}
              setDrawings={setDrawings}
            />

            {/* Vision Blocker */}
            <VisionBlocker
              zoom={zoom}
              panOffset={panOffset}
              backgroundImage={backgroundImage}
              gridSize={gridSize}
              containerRef={containerRef}
              isVisionBlockMode={isVisionBlockMode}
              setIsVisionBlockMode={setIsVisionBlockMode}
              visionBlocks={visionBlocks}
              setVisionBlocks={setVisionBlocks}
            />

            {/* Control hints */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
              <div>
                {isVisionBlockMode 
                  ? 'Vision Blocker: Click and drag to create blocks | Select blocks and press Delete to remove'
                  : isDrawingMode 
                    ? 'Drawing Mode: Click and drag to draw | Use controls in top-left'
                    : 'Scroll: Zoom | Drag: Pan | Double-click token: Remove'
                }
              </div>
            </div>

            {/* Change map button */}
            <button
              onClick={() => setBackgroundImage(null)}
              className="absolute top-4 right-4 px-3 py-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-all"
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