'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

const MapTool = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [tokens, setTokens] = useState([]);
  const [draggedToken, setDraggedToken] = useState(null);
  const [gridSize, setGridSize] = useState(40);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Handle image upload
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target.result);
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = e.target.result;
        
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

  // Add new token
  const addToken = (color) => {
    const newToken = {
      id: Date.now(),
      x: 100,
      y: 100,
      color: color,
      size: gridSize * 0.9 // Fixed size relative to grid, not zoom
    };
    setTokens([...tokens, newToken]);
  };

  // Update token sizes when grid size changes (but not zoom)
  useEffect(() => {
    setTokens(prevTokens => prevTokens.map(token => ({
      ...token,
      size: gridSize * 0.9
    })));
  }, [gridSize]);

  // Handle token drag start
  const handleTokenMouseDown = (e, tokenId) => {
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
    if (draggedToken) return; // Don't pan while dragging token
    
    e.preventDefault();
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  // Handle mouse move for dragging and panning
  const handleMouseMove = (e) => {
    if (draggedToken) {
      // Token dragging
      const rect = mapRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - draggedToken.offsetX;
      const newY = e.clientY - rect.top - draggedToken.offsetY;

      // Snap to grid (using base grid size, not zoomed)
      const snappedX = Math.round(newX / gridSize) * gridSize;
      const snappedY = Math.round(newY / gridSize) * gridSize;

      setTokens(tokens.map(token => 
        token.id === draggedToken.id 
          ? { ...token, x: snappedX, y: snappedY }
          : token
      ));
    } else if (isPanning) {
      // Map panning - fixed calculation
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  // Handle mouse up to stop dragging/panning
  const handleMouseUp = () => {
    setDraggedToken(null);
    setIsPanning(false);
  };

  // Handle zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    setZoom(newZoom);
  };

  // Remove token
  const removeToken = (tokenId) => {
    setTokens(tokens.filter(token => token.id !== tokenId));
  };

  // Calculate the actual displayed image size for grid boundaries
  const getDisplayedImageSize = () => {
    if (!imageDimensions.width || !imageDimensions.height) return { width: 0, height: 0 };
    
    const containerElement = containerRef.current;
    if (!containerElement) return { width: 0, height: 0 };
    
    const containerWidth = containerElement.clientWidth;
    const containerHeight = containerElement.clientHeight;
    
    const imageAspectRatio = imageDimensions.width / imageDimensions.height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let displayWidth, displayHeight;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container ratio
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
    } else {
      // Image is taller or same ratio as container
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
    }
    
    return { width: displayWidth, height: displayHeight };
  };

  // Generate grid pattern - fixed to base grid size
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

  const displayedImageSize = getDisplayedImageSize();

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col select-none">
      {/* Controls */}
      <div className="bg-white shadow-md p-4 flex flex-wrap items-center gap-4 flex-shrink-0">
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
          />
          <span className="text-sm w-12">{zoom.toFixed(1)}x</span>
        </div>

        <button
          onClick={resetView}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Reset View
        </button>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          <span className="text-sm">Show Grid</span>
        </label>

        {/* Token controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Add Token:</span>
          {['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black'].map(color => (
            <button
              key={color}
              onClick={() => addToken(color)}
              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
              style={{ backgroundColor: color }}
              title={`Add ${color} token`}
            />
          ))}
        </div>

        <button
          onClick={() => setTokens([])}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Clear All Tokens
        </button>
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
            className="h-full w-full overflow-hidden relative rounded-lg border border-gray-300"
            style={{ cursor: isPanning ? 'grabbing' : (draggedToken ? 'crosshair' : 'grab') }}
          >
            <div
              ref={mapRef}
              className="absolute inset-0 overflow-hidden"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                width: '100%',
                height: '100%'
              }}
              onMouseDown={handlePanStart}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Grid overlay - only covers the actual image area */}
              {showGrid && displayedImageSize.width > 0 && displayedImageSize.height > 0 && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    backgroundImage: generateGridPattern(),
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    width: `${displayedImageSize.width}px`,
                    height: `${displayedImageSize.height}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}

              {/* Tokens */}
              {tokens.map(token => (
                <div
                  key={token.id}
                  className="absolute cursor-move border-2 border-white shadow-lg hover:shadow-xl transition-shadow rounded-full flex items-center justify-center text-white font-bold text-xs select-none"
                  style={{
                    left: token.x,
                    top: token.y,
                    width: token.size,
                    height: token.size,
                    backgroundColor: token.color,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${Math.max(8, token.size * 0.3)}px`
                  }}
                  onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    removeToken(token.id);
                  }}
                  title="Drag to move, double-click to remove"
                >
                  {token.color.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            {/* Control hints */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded pointer-events-none">
              <div>Scroll: Zoom | Drag: Pan | Double-click token: Remove</div>
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