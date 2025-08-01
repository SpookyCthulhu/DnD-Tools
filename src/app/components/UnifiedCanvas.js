'use client';

import { useRef, useEffect, useCallback } from 'react';

const UnifiedCanvas = ({
  backgroundImage,
  gridSize,
  showGrid,
  zoom,
  panOffset,
  tokens,
  drawings,
  visionBlocks,
  activeMode,
  onCanvasClick,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  selectedTokenId,
  currentDrawing,
  currentVisionBlock,
  selectedVisionBlocks,
  freehandVisionBlock
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const imageLoadedRef = useRef(false);
  const imageDimensionsRef = useRef({ width: 0, height: 0 });

  // Load background image at natural resolution
  useEffect(() => {
    if (!backgroundImage) {
      imageLoadedRef.current = false;
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      imageLoadedRef.current = true;
      imageDimensionsRef.current = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      redraw();
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Transform based on zoom and pan
    const canvasX = (x - canvas.width / 2 - panOffset.x) / zoom + canvas.width / 2;
    const canvasY = (y - canvas.height / 2 - panOffset.y) / zoom + canvas.height / 2;

    return { x: canvasX, y: canvasY };
  }, [zoom, panOffset]);

  // Main drawing function
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2 + panOffset.x / zoom, -height / 2 + panOffset.y / zoom);

    // Draw background image at natural size
    if (imageRef.current && imageLoadedRef.current) {
      const img = imageRef.current;
      const imgWidth = imageDimensionsRef.current.width;
      const imgHeight = imageDimensionsRef.current.height;
      
      // Center the image in the canvas
      const drawX = (width - imgWidth) / 2;
      const drawY = (height - imgHeight) / 2;

      ctx.drawImage(img, drawX, drawY, imgWidth, imgHeight);

      // Draw grid if enabled
      if (showGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = drawX; x <= drawX + imgWidth; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, drawY);
          ctx.lineTo(x, drawY + imgHeight);
          ctx.stroke();
        }

        // Horizontal lines
        for (let y = drawY; y <= drawY + imgHeight; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(drawX, y);
          ctx.lineTo(drawX + imgWidth, y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Draw vision blocks (behind tokens)
    visionBlocks.forEach(block => {
      ctx.save();
      ctx.fillStyle = block.color;
      ctx.globalAlpha = block.opacity;

      if (block.type === 'freehand' && block.points) {
        // Draw freehand vision block
        ctx.beginPath();
        ctx.moveTo(block.points[0].x, block.points[0].y);
        block.points.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = selectedVisionBlocks?.has(block.id) ? '#ff0000' : '#666666';
        ctx.lineWidth = selectedVisionBlocks?.has(block.id) ? 2 : 1;
        ctx.globalAlpha = 1;
        ctx.stroke();
      } else {
        // Draw rectangular vision block
        const x = Math.min(block.startX, block.endX);
        const y = Math.min(block.startY, block.endY);
        const width = Math.abs(block.endX - block.startX);
        const height = Math.abs(block.endY - block.startY);

        ctx.fillRect(x, y, width, height);

        // Draw selection border
        if (selectedVisionBlocks?.has(block.id)) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1;
          ctx.strokeRect(x, y, width, height);
        } else {
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 1;
          ctx.strokeRect(x, y, width, height);
        }
      }
      ctx.restore();
    });

    // Draw current vision block being placed
    if (currentVisionBlock) {
      ctx.save();
      ctx.fillStyle = currentVisionBlock.color;
      ctx.globalAlpha = currentVisionBlock.opacity * 0.5;

      if (currentVisionBlock.type === 'freehand' && currentVisionBlock.points) {
        ctx.beginPath();
        ctx.moveTo(currentVisionBlock.points[0].x, currentVisionBlock.points[0].y);
        currentVisionBlock.points.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.stroke();
      } else {
        const x = Math.min(currentVisionBlock.startX, currentVisionBlock.endX);
        const y = Math.min(currentVisionBlock.startY, currentVisionBlock.endY);
        const width = Math.abs(currentVisionBlock.endX - currentVisionBlock.startX);
        const height = Math.abs(currentVisionBlock.endY - currentVisionBlock.startY);

        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.strokeRect(x, y, width, height);
      }
      ctx.restore();
    }

    // Draw freehand vision block preview
    if (freehandVisionBlock && freehandVisionBlock.points && freehandVisionBlock.points.length > 0) {
      ctx.save();
      ctx.strokeStyle = freehandVisionBlock.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(freehandVisionBlock.points[0].x, freehandVisionBlock.points[0].y);
      freehandVisionBlock.points.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      // Draw line to start point to show where it will close
      if (freehandVisionBlock.points.length > 2) {
        ctx.lineTo(freehandVisionBlock.points[0].x, freehandVisionBlock.points[0].y);
      }
      
      ctx.stroke();
      ctx.restore();
    }

    ctx.globalAlpha = 1;

    // Draw drawings
    drawings.forEach(drawing => {
      if (drawing.points.length < 2) return;

      ctx.save();
      ctx.globalAlpha = drawing.opacity;
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
      drawing.points.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.restore();
    });

    // Draw current drawing
    if (currentDrawing && currentDrawing.points.length > 0) {
      ctx.save();
      ctx.globalAlpha = currentDrawing.opacity;
      ctx.strokeStyle = currentDrawing.color;
      ctx.lineWidth = currentDrawing.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(currentDrawing.points[0].x, currentDrawing.points[0].y);
      currentDrawing.points.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    // Draw tokens
    tokens.forEach(token => {
      ctx.save();

      // Token shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Token circle
      ctx.fillStyle = token.color;
      ctx.beginPath();
      ctx.arc(token.x, token.y, token.size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Token border
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = selectedTokenId === token.id ? '#ffff00' : '#ffffff';
      ctx.lineWidth = selectedTokenId === token.id ? 3 : 2;
      ctx.stroke();

      // Token label - scale with grid size
      const labelScale = gridSize / 40; // 40 is our base grid size
      const labelSize = Math.max(12, Math.min(24, 14 * labelScale));
      ctx.font = `bold ${labelSize}px Arial`;
      const labelWidth = ctx.measureText(token.label).width;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        token.x - labelWidth / 2 - 4,
        token.y - token.size / 2 - labelSize - 8,
        labelWidth + 8,
        labelSize + 4
      );

      // Token label text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        token.label,
        token.x,
        token.y - token.size / 2 - labelSize / 2 - 6
      );

      ctx.restore();
    });

    // Restore context state
    ctx.restore();
  }, [
    zoom,
    panOffset,
    tokens,
    drawings,
    visionBlocks,
    showGrid,
    gridSize,
    selectedTokenId,
    currentDrawing,
    currentVisionBlock,
    selectedVisionBlocks,
    freehandVisionBlock
  ]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = canvas?.parentElement;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  // Redraw when dependencies change
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle mouse events
  const handleMouseDown = (e) => {
    const coords = screenToCanvas(e.clientX, e.clientY);
    onCanvasMouseDown?.(e, coords);
  };

  const handleMouseMove = (e) => {
    const coords = screenToCanvas(e.clientX, e.clientY);
    onCanvasMouseMove?.(e, coords);
  };

  const handleMouseUp = (e) => {
    const coords = screenToCanvas(e.clientX, e.clientY);
    onCanvasMouseUp?.(e, coords);
  };

  const handleClick = (e) => {
    const coords = screenToCanvas(e.clientX, e.clientY);
    onCanvasClick?.(e, coords);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        cursor: activeMode === 'drawing' ? 'crosshair' :
                activeMode === 'vision' ? 'crosshair' :
                activeMode === 'tokens' ? 'crosshair' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    />
  );
};

export default UnifiedCanvas;