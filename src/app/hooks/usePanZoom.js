'use client';

import { useState, useCallback } from 'react';

const usePanZoom = (initialZoom = 1, initialPanOffset = { x: 0, y: 0 }) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState(initialPanOffset);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle pan start
  const handlePanStart = useCallback((e) => {
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  }, [panOffset]);

  // Handle mouse move for panning
  const handlePanMove = useCallback((e) => {
    if (!isPanning) return;
    
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  }, [isPanning, panStart]);

  // Handle mouse up to stop panning
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle zoom with mouse position
  const handleZoom = useCallback((e, disabled) => {
    if (disabled) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(6, zoom * delta));
    
    // Zoom towards mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const zoomRatio = newZoom / zoom;
    
    setPanOffset({
      x: x + (panOffset.x - x) * zoomRatio,
      y: y + (panOffset.y - y) * zoomRatio
    });
    
    setZoom(newZoom);
  }, [zoom, panOffset]);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setPanOffset(initialPanOffset);
  }, [initialZoom, initialPanOffset]);

  // Reset for new image
  const resetForNewImage = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  return {
    zoom,
    panOffset,
    isPanning,
    setZoom,
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