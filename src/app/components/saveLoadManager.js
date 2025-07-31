// src/app/components/SaveLoadManager.js
'use client';

import { useRef } from 'react';

const SaveLoadManager = ({ 
  tokens, 
  setTokens, 
  drawings, 
  setDrawings, 
  visionBlocks, 
  setVisionBlocks,
  backgroundImage,
  gridSize,
  zoom,
  panOffset,
  setGridSize,
  setZoom,
  setPanOffset
}) => {
  const fileInputRef = useRef(null);

  // Create save data object
  const createSaveData = () => {
    return {
      version: "1.0",
      timestamp: new Date().toISOString(),
      backgroundImage: backgroundImage,
      settings: {
        gridSize: gridSize,
        zoom: zoom,
        panOffset: panOffset
      },
      tokens: tokens,
      drawings: drawings,
      visionBlocks: visionBlocks
    };
  };

  // Save current state
  const saveState = () => {
    try {
      const saveData = createSaveData();
      const jsonString = JSON.stringify(saveData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `dnd-map-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      console.log('Map state saved successfully');
    } catch (error) {
      console.error('Error saving map state:', error);
      alert('Error saving map state. Please try again.');
    }
  };

  // Load state from file
  const loadState = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const saveData = JSON.parse(e.target.result);
        
        // Validate save data
        if (!saveData.version) {
          throw new Error('Invalid save file format');
        }

        // Restore settings
        if (saveData.settings) {
          if (saveData.settings.gridSize) setGridSize(saveData.settings.gridSize);
          if (saveData.settings.zoom) setZoom(saveData.settings.zoom);
          if (saveData.settings.panOffset) setPanOffset(saveData.settings.panOffset);
        }

        // Restore tokens
        if (saveData.tokens && Array.isArray(saveData.tokens)) {
          setTokens(saveData.tokens);
        }

        // Restore drawings
        if (saveData.drawings && Array.isArray(saveData.drawings)) {
          setDrawings(saveData.drawings);
        }

        // Restore vision blocks
        if (saveData.visionBlocks && Array.isArray(saveData.visionBlocks)) {
          setVisionBlocks(saveData.visionBlocks);
        }

        console.log('Map state loaded successfully');
        alert(`Map state loaded successfully!\nUpload an image to view.\nSaved: ${new Date(saveData.timestamp).toLocaleString()}`);
        
      } catch (error) {
        console.error('Error loading map state:', error);
        alert('Error loading map state. Please check the file format.');
      }
    };

    reader.readAsText(file);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      loadState(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Trigger file input
  const triggerLoad = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={saveState}
        disabled={!backgroundImage}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        title="Save current map state"
      >
        Save Map
      </button>
      
      <button
        onClick={triggerLoad}
        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        title="Load saved map state"
      >
        Load Map
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default SaveLoadManager;