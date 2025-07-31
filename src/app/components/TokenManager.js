'use client';

import { useState, useEffect } from 'react';
import Token from './Token';

const TokenManager = ({ 
  gridSize, 
  isDrawingMode, 
  zoom, 
  panOffset, 
  onTokenMouseDown 
}) => {
  const [tokens, setTokens] = useState([]);
  const [showTokenCreator, setShowTokenCreator] = useState(false);
  const [newTokenColor, setNewTokenColor] = useState('#ff0000');
  const [newTokenLabel, setNewTokenLabel] = useState('');

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