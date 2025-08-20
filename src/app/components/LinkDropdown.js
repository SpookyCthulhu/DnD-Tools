'use client';

import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const LinkDropdown = ({ links, onNavigate, anchorElement, onClose }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Calculate position below the text
      let top = rect.bottom + scrollTop + 5;
      let left = rect.left + scrollLeft;
      
      // Check if dropdown would go off the right edge of the screen
      const dropdownWidth = 400; // max-width of dropdown
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      
      // Check if dropdown would go off the bottom of the screen
      const dropdownHeight = Math.min(links.length * 50 + 40, 300); // estimated height
      if (top + dropdownHeight > window.innerHeight + scrollTop) {
        // Position above the text instead
        top = rect.top + scrollTop - dropdownHeight - 5;
      }
      
      setPosition({ top, left });
    }
  }, [anchorElement, links]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside dropdown and not on the anchor element
      if (dropdownRef.current && 
          !dropdownRef.current.contains(e.target) && 
          !anchorElement.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add slight delay to prevent immediate closing when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [anchorElement, onClose]);

  // Render the dropdown using a portal to ensure it appears above other elements
  return ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] min-w-[200px] max-w-[400px] max-h-[300px] overflow-y-auto"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        animation: 'dropdown-appear 0.2s ease-out'
      }}
    >
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-600 px-2 py-1 border-b mb-1">
          Linked Destinations ({links.length})
        </div>
        {links.map((link, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(link);
              onClose();
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2 transition-colors"
          >
            {/* Type Icon */}
            {link.type === 'chapter' && (
              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
            {link.type === 'section' && (
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            )}
            {link.type === 'page' && (
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {link.type === 'text' && (
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{link.title}</div>
              <div className="text-xs text-gray-500 truncate">
                {link.path.slice(0, -1).join(' › ')}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default LinkDropdown;