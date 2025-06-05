'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import DrawingTool from './DrawingTool';

const MapTool = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [draggedToken, setDraggedToken] = useState(null);
  const [gridSize, setGridSize] = useState(40);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showTokenCreator, setShowTokenCreator] = useState(false);
  const [newTokenColor, setNewTokenColor] = useState('#ff0000');
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Handle image upload
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target.result);
        // Reset pan and zoom when new image is loaded
        setPanOffset({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false
  });

  // Create new token
  const createToken = () => {
    if (!newTokenLabel.trim()) {
      alert('Please enter a label for the token');
      return;
    }

    const newToken = {
      id: Date.now(),
      x: 200,
      y: 200,
      color: newTokenColor,
      label: newTokenLabel.trim(),
      size: gridSize * 0.9
    };
    setTokens([...tokens, newToken]);
    
    // Reset form
    setNewTokenLabel('');
    setShowTokenCreator(false);
  };

  // Update token sizes when grid size changes
  useEffect(() => {
    setTokens(prevTokens => prevTokens.map(token => ({
      ...token,
      size: gridSize * 0.9
    })));
  }, [gridSize]);

  // Handle token drag start
  const handleTokenMouseDown = (e, tokenId) => {
    if (isDrawingMode) return; // Don't allow token dragging in drawing mode
    
    e.preventDefault();
    e.stopPropagation();
    const token = tokens.find(t => t.id === tokenId);
    const rect = mapRef.current.getBoundingClientRect();
    
    setDraggedToken({
      id: tokenId,
      offsetX: e.clientX - rect.left - token.x,
      offsetY: e.clientY - rect.top - token.y
    });
  };

  // Handle pan start
  const handlePanStart = (e) => {
    if (draggedToken || isDrawingMode) return; // Don't pan while dragging token or drawing
    
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  // Handle mouse move for dragging and panning
  const handleMouseMove = (e) => {
    if (isDrawingMode) return; // Don't handle mouse move for panning/dragging in drawing mode

    if (draggedToken) {
      // Token dragging - free movement, no grid snapping
      const rect = mapRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - draggedToken.offsetX;
      const newY = e.clientY - rect.top - draggedToken.offsetY;

      setTokens(tokens.map(token => 
        token.id === draggedToken.id 
          ? { ...token, x: newX, y: newY }
          : token
      ));
    } else if (isPanning) {
      // Map panning
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  // Handle mouse up to stop dragging/panning
  const handleMouseUp = () => {
    if (isDrawingMode) return; // Don't handle mouse up for panning/dragging in drawing mode
    
    setDraggedToken(null);
    setIsPanning(false);
  };

  // Handle zoom
  const handleWheel = (e) => {
    if (isDrawingMode) return; // Don't zoom in drawing mode
    
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    setZoom(newZoom);
  };

  // Remove token
  const removeToken = (tokenId) => {
    setTokens(tokens.filter(token => token.id !== tokenId));
  };

  // Generate grid pattern
  const generateGridPattern = () => {
    if (!showGrid) return '';
    
    return `
      linear-gradient(to right, rgba(128,128,128,0.5) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(128,128,128,0.5) 1px, transparent 1px)
    `;
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Fixed Controls - no scroll behavior */}
      <div className="bg-white shadow-md p-4 flex flex-wrap items-center gap-4 flex-shrink-0 sticky top-0 z-10">
        <h1 className="text-xl font-bold">D&D Map Tool</h1>
        
        {/* Grid controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm">Grid Size:</label>
          <input
            type="range"
            min="20"
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
            max="3"
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

        {/* Token creation */}
        {!isDrawingMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTokenCreator(!showTokenCreator)}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              {showTokenCreator ? 'Cancel' : 'Create Token'}
            </button>
            
            {showTokenCreator && (
              <>
                <input
                  type="color"
                  value={newTokenColor}
                  onChange={(e) => setNewTokenColor(e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  title="Choose token color"
                />
                <input
                  type="text"
                  placeholder="Token label"
                  value={newTokenLabel}
                  onChange={(e) => setNewTokenLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createToken()}
                  className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
                  maxLength="10"
                />
                <button
                  onClick={createToken}
                  className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Add
                </button>
              </>
            )}
          </div>
        )}

        {!isDrawingMode && (
          <button
            onClick={() => setTokens([])}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear All Tokens
          </button>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 overflow-hidden p-4">
        {!backgroundImage ? (
          <div 
            {...getRootProps()} 
            className={`h-full flex items-center justify-center border-2 border-dashed cursor-pointer transition-colors rounded-lg ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <p className="text-xl text-gray-600 mb-2">
                {isDragActive ? 'Drop your map image here' : 'Drop a map image here or click to select'}
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, GIF, BMP, WebP
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="h-full w-full overflow-hidden relative rounded-lg border border-gray-300 bg-gray-200"
            style={{ 
              cursor: isDrawingMode ? 'crosshair' : (isPanning ? 'grabbing' : (draggedToken ? 'crosshair' : 'grab'))
            }}
          >
            {/* Image container with grid overlay constrained to image bounds */}
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
              onMouseDown={handlePanStart}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Image with grid overlay - grid only appears over the image */}
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
                {/* Grid overlay - constrained to image dimensions */}
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

              {/* Tokens */}
              {tokens.map(token => (
                <div key={token.id} className="absolute">
                  {/* Token label */}
                  <div
                    className="absolute text-xs font-bold text-white bg-black bg-opacity-70 px-1 rounded pointer-events-none select-none"
                    style={{
                      left: token.x,
                      top: token.y - token.size/2 - 16,
                      transform: 'translateX(-50%)',
                      fontSize: `${Math.max(8, token.size * 0.25)}px`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {token.label}
                  </div>
                  
                  {/* Token circle */}
                  <div
                    className={`absolute border-2 border-white shadow-lg hover:shadow-xl transition-shadow rounded-full flex items-center justify-center text-white font-bold text-xs select-none ${
                      isDrawingMode ? 'pointer-events-none' : 'cursor-move'
                    }`}
                    style={{
                      left: token.x,
                      top: token.y,
                      width: token.size,
                      height: token.size,
                      backgroundColor: token.color,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${Math.max(6, token.size * 0.2)}px`
                    }}
                    onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
                    onDoubleClick={(e) => {
                      if (isDrawingMode) return;
                      e.stopPropagation();
                      removeToken(token.id);
                    }}
                    title={isDrawingMode ? token.label : `${token.label} - Drag to move, double-click to remove`}
                  >
                    {token.label.charAt(0).toUpperCase()}
                  </div>
                </div>
              ))}
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
            />

            {/* Control hints */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
              <div>
                {isDrawingMode 
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