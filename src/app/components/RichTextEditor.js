'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import LinkManager from './LinkManager';
import LinkDropdown from './LinkDropdown';

const RichTextEditor = ({ content, onChange, campaign, onNavigateToLink }) => {
  const editorRef = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showLinkManager, setShowLinkManager] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownLinks, setDropdownLinks] = useState([]);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current && content !== undefined) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
        attachLinkListeners();
      }
    }
  }, [content]);

   const attachLinkListeners = useCallback(() => {
    if (!editorRef.current) return;
    
    const links = editorRef.current.querySelectorAll('a[data-linked-content]');
    links.forEach(link => {
      // Remove any existing listeners to prevent duplicates
      link.onclick = null;
      
      link.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // If there's already an active dropdown on a different link, close it
        if (activeDropdown && activeDropdown !== link) {
          activeDropdown.classList.remove('link-active');
          setActiveDropdown(null);
        }
        
        // Parse the linked content
        try {
          const linkedContent = JSON.parse(link.dataset.linkedContent);
          
          // If there's only one destination, navigate directly
          if (linkedContent.length === 1) {
            handleLinkNavigation(linkedContent[0]);
          } else {
            // Toggle dropdown for multiple destinations
            if (activeDropdown === link) {
              // Close if clicking the same link
              link.classList.remove('link-active');
              setActiveDropdown(null);
              setDropdownLinks([]);
            } else {
              // Open dropdown for this link
              link.classList.add('link-active');
              setDropdownLinks(linkedContent);
              setActiveDropdown(link);
            }
          }
        } catch (error) {
          console.error('Error parsing link data:', error);
        }
      };
    });
  }, [activeDropdown]);

  // Handle navigation to a link destination
  const handleLinkNavigation = useCallback((link) => {
    if (onNavigateToLink) {
      onNavigateToLink(link);
    }
    // Close any open dropdown
    closeDropdown();
  }, [onNavigateToLink]);

  // Close dropdown function
  const closeDropdown = useCallback(() => {
    if (activeDropdown) {
      activeDropdown.classList.remove('link-active');
      setActiveDropdown(null);
      setDropdownLinks([]);
    }
  }, [activeDropdown]);

  // Format text
  const formatText = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  }, []);

  // Create advanced link
  const createAdvancedLink = useCallback((links, text) => {
    if (selectedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }
    
    // Create a link element with embedded data
    const linkElement = document.createElement('a');
    linkElement.href = '#';
    linkElement.className = 'text-blue-600 hover:text-blue-800 underline cursor-pointer inline-link';
    linkElement.dataset.linkedContent = JSON.stringify(links);
    linkElement.textContent = text || 'Link';
    
    // Add a small icon to indicate multiple links if applicable
    if (links.length > 1) {
      const badge = document.createElement('sup');
      badge.className = 'text-xs text-gray-500 ml-0.5';
      badge.textContent = `[${links.length}]`;
      linkElement.appendChild(badge);
    }
    
    // Insert the link
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(linkElement);
      range.collapse(false);
    }
    
    onChange(editorRef.current.innerHTML);
    setTimeout(() => attachLinkListeners(), 0);
  }, [selectedRange, onChange, attachLinkListeners]);

  // Insert simple link
  const insertLink = useCallback(() => {
    if (selectedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }
    
    if (linkUrl) {
      formatText('createLink', linkUrl);
      setLinkUrl('');
    }
    setShowLinkDialog(false);
  }, [linkUrl, selectedRange, formatText]);

  // Handle image drop/paste
  const handleImageInsert = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.className = 'my-2 rounded shadow-sm';
      
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.insertNode(img);
      range.collapse(false);
      
      onChange(editorRef.current.innerHTML);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  // Handle paste event
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          handleImageInsert(file);
          return;
        }
      }
    }
  }, [handleImageInsert]);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageInsert(file);
      }
    }
  }, [handleImageInsert]);

  // Save selection before showing dialog
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      setSelectedRange(range);
      setSelectedText(selection.toString());
    }
  }, []);

  // Re-attach listeners when content changes
  useEffect(() => {
    attachLinkListeners();
  }, [content, attachLinkListeners]);

  // Close dropdown when clicking elsewhere in the editor
  useEffect(() => {
    const handleEditorClick = (e) => {
      // If clicking somewhere else in the editor (not on a link)
      if (editorRef.current && editorRef.current.contains(e.target)) {
        if (!e.target.closest('a[data-linked-content]')) {
          closeDropdown();
        }
      }
    };
        const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('mousedown', handleEditorClick);
      return () => editor.removeEventListener('mousedown', handleEditorClick);
    }
  }, [closeDropdown]);

  // Toolbar button component
  const ToolbarButton = ({ command, icon, value, title }) => (
    <button
      type="button"
      onClick={() => formatText(command, value)}
      className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Formatting Toolbar */}
      <div className="border-b bg-gray-50 px-4 py-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            command="bold"
            icon={<span className="font-bold">B</span>}
            title="Bold (Ctrl+B)"
          />
          <ToolbarButton
            command="italic"
            icon={<span className="italic">I</span>}
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton
            command="underline"
            icon={<span className="underline">U</span>}
            title="Underline (Ctrl+U)"
          />
          <ToolbarButton
            command="strikeThrough"
            icon={<span className="line-through">S</span>}
            title="Strikethrough"
          />
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <select
            onChange={(e) => formatText('formatBlock', e.target.value)}
            className="px-2 py-1 border rounded text-sm"
            defaultValue=""
          >
            <option value="">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="p">Paragraph</option>
          </select>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            command="insertUnorderedList"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
            title="Bullet List"
          />
          <ToolbarButton
            command="insertOrderedList"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            }
            title="Numbered List"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowLinkDialog(true);
            }}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Insert URL Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowLinkManager(true);
            }}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Create Content Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          
          <label className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Insert Image">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageInsert(file);
                }
              }}
            />
          </label>

          <ToolbarButton
            command="removeFormat"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            }
            title="Clear Formatting"
          />
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 p-6 overflow-auto relative">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-full outline-none prose prose-lg max-w-none"
          onInput={() => {
            onChange(editorRef.current.innerHTML);
            setTimeout(() => attachLinkListeners(), 0);
          }}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ minHeight: '500px' }}
        />
      </div>

      {/* Link Dropdown - Now rendered conditionally */}
      {activeDropdown && dropdownLinks.length > 0 && (
        <LinkDropdown
          links={dropdownLinks}
          onNavigate={handleLinkNavigation}
          anchorElement={activeDropdown}
          onClose={closeDropdown}
        />
      )}

      {/* URL Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Insert URL Link</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border rounded mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Content Link Manager */}
      {showLinkManager && (
        <LinkManager
          campaign={campaign}
          selectedText={selectedText}
          onCreateLink={createAdvancedLink}
          onClose={() => setShowLinkManager(false)}
        />
      )}
    </div>
  );
};

export default RichTextEditor;