'use client';

import { useState, useCallback } from 'react';

const usePanZoom = (initialZoom = 1, initialPanOffset = { x: 0, y: 0 }) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState(initialPanOffset);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle pan start
  const handlePanStart = useCallback((e, draggedToken, isDrawingMode) => {
    if (draggedToken || isDrawingMode) return false; // Don't pan while dragging token or drawing
    
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
    return true;
  }, [panOffset]);

  // Handle mouse move for panning
  const handlePanMove = useCallback((e) => {
    if (!isPanning) return false;
    
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
    return true;
  }, [isPanning, panStart]);

  // Handle mouse up to stop panning
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle zoom
  const handleZoom = useCallback((e, isDrawingMode) => {
    if (isDrawingMode) return false; // Don't zoom in drawing mode
    
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    setZoom(newZoom);
    return true;
  }, [zoom]);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setPanOffset(initialPanOffset);
  }, [initialZoom, initialPanOffset]);

  // Manual zoom setter
  const setZoomValue = useCallback((newZoom) => {
    setZoom(Math.max(0.5, Math.min(3, newZoom)));
  }, []);

  // Reset to new image
  const resetForNewImage = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  return {
    zoom,
    panOffset,
    isPanning,
    setZoom: setZoomValue,
    setPanOffset,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleZoom,
    resetView,
    resetForNewImage
  };
};

export default usePanZoom;