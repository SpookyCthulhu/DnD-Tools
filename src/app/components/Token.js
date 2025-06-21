'use client';

const Token = ({ 
  token, 
  isDrawingMode, 
  onMouseDown, 
  onRemove 
}) => {
  const handleMouseDown = (e) => {
    onMouseDown(e, token.id);
  };

  const handleDoubleClick = (e) => {
    if (isDrawingMode) return;
    e.stopPropagation();
    onRemove(token.id);
  };

  return (
    <div className="absolute">
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
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title={isDrawingMode ? token.label : `${token.label} - Drag to move, double-click to remove`}
      >
        {token.label.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};

export default Token;