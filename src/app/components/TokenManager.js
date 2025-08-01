'use client';

import { useState, useEffect, useRef } from 'react';
import Token from './Token';

const TokenManager = ({ 
  gridSize, 
  isDrawingMode, 
  zoom, 
  panOffset, 
  onTokenMouseDown,
  containerRef
}) => {
  const [tokens, setTokens] = useState([]);
  const [showTokenCreator, setShowTokenCreator] = useState(false);
  const [newTokenColor, setNewTokenColor] = useState('#ff0000');
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [newTokenSize, setNewTokenSize] = useState('normal');
  const [tokenQuantity, setTokenQuantity] = useState(1);
  const labelInputRef = useRef(null);

  // Token size multipliers
  const sizeMultipliers = {
    tiny: 0.5,
    normal: 0.9,
    large: 1.5
  };

  // Get screen center position in map coordinates
  const getScreenCenter = () => {
    if (!containerRef.current) return { x: 200, y: 200 };
    
    const container = containerRef.current;
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    
    // Convert screen coordinates to map coordinates
    const mapX = (centerX - panOffset.x) / zoom;
    const mapY = (centerY - panOffset.y) / zoom;
    
    return { x: mapX, y: mapY };
  };

  // Auto-focus text input when creator opens
  useEffect(() => {
    if (showTokenCreator && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [showTokenCreator]);

  // Create new token(s)
  const createToken = () => {
    if (!newTokenLabel.trim()) {
      alert('Please enter a label for the token');
      return;
    }

    const centerPos = getScreenCenter();
    const baseSize = gridSize * sizeMultipliers[newTokenSize];
    const newTokens = [];

    for (let i = 0; i < tokenQuantity; i++) {
      // Spread tokens slightly if creating multiple
      const offsetX = tokenQuantity > 1 ? (i - (tokenQuantity - 1) / 2) * (baseSize + 5) : 0;
      const offsetY = tokenQuantity > 1 ? Math.floor(i / 5) * (baseSize + 5) : 0;

      const newToken = {
        id: Date.now() + i, // Ensure unique IDs
        x: centerPos.x + offsetX,
        y: centerPos.y + offsetY,
        color: newTokenColor,
        label: tokenQuantity > 1 ? `${newTokenLabel.trim()} ${i + 1}` : newTokenLabel.trim(),
        size: baseSize,
        sizeType: newTokenSize
      };
      newTokens.push(newToken);
    }
    
    setTokens(prev => [...prev, ...newTokens]);
    
    // Reset form
    setNewTokenLabel('');
    setTokenQuantity(1);
    setShowTokenCreator(false);
  };

  // Update token sizes when grid size changes
  useEffect(() => {
    setTokens(prevTokens => prevTokens.map(token => ({
      ...token,
      size: gridSize * sizeMultipliers[token.sizeType || 'normal']
    })));
  }, [gridSize]);

  // Update token position
  const updateTokenPosition = (tokenId, newX, newY) => {
    setTokens(tokens.map(token => 
      token.id === tokenId 
        ? { ...token, x: newX, y: newY }
        : token
    ));
  };

  // Remove token
  const removeToken = (tokenId) => {
    setTokens(tokens.filter(token => token.id !== tokenId));
  };

  // Clear all tokens
  const clearAllTokens = () => {
    setTokens([]);
  };

  // Handle Enter key in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      createToken();
    }
  };

  // Render token creation controls
  const renderTokenCreationControls = () => {
    if (isDrawingMode) return null;

    return (
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
              ref={labelInputRef}
              type="text"
              placeholder="Token label"
              value={newTokenLabel}
              onChange={(e) => setNewTokenLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
              maxLength="10"
            />
            <select
              value={newTokenSize}
              onChange={(e) => setNewTokenSize(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              title="Token size"
            >
              <option value="tiny">Tiny</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
            <div className="flex items-center gap-1">
              <label className="text-xs">Qty:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={tokenQuantity}
                onChange={(e) => setTokenQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="px-1 py-1 border border-gray-300 rounded text-sm w-12"
                title="Number of tokens to create (1-10)"
              />
            </div>
            <button
              onClick={createToken}
              className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Add
            </button>
          </>
        )}
      </div>
    );
  };

  // Render clear all button
  const renderClearAllButton = () => {
    if (isDrawingMode) return null;

    return (
      <button
        onClick={clearAllTokens}
        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
      >
        Clear All Tokens
      </button>
    );
  };

  // Render all tokens
  const renderTokens = () => {
    return tokens.map(token => (
      <Token
        key={token.id}
        token={token}
        isDrawingMode={isDrawingMode}
        onMouseDown={onTokenMouseDown}
        onRemove={removeToken}
        onPositionUpdate={updateTokenPosition}
      />
    ));
  };

  // Expose methods and state that parent component needs
  return {
    // State
    tokens,
    
    // Methods
    updateTokenPosition,
    setTokens,
    
    // Render methods
    renderTokenCreationControls,
    renderClearAllButton,
    renderTokens
  };
};

export default TokenManager;