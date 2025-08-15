'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

const RichTextEditor = ({ content, onChange, campaign }) => {
  const editorRef = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current && content !== undefined) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  // Format text
  const formatText = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  }, []);

  // Insert link
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

  // Create internal link to another page
  const createInternalLink = useCallback((pageId, pageTitle) => {
    const link = document.createElement('a');
    link.href = `#page-${pageId}`;
    link.className = 'internal-link text-blue-600 hover:text-blue-800 underline';
    link.dataset.pageId = pageId;
    link.textContent = pageTitle;
    link.onclick = (e) => {
      e.preventDefault();
      // This would trigger navigation in the parent component
      console.log('Navigate to page:', pageId);
    };
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.insertNode(link);
    range.collapse(false);
    
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  // Save selection before showing dialog
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSelectedRange(selection.getRangeAt(0).cloneRange());
    }
  }, []);

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
          <ToolbarButton
            command="outdent"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
            title="Decrease Indent"
          />
          <ToolbarButton
            command="indent"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
            title="Increase Indent"
          />
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            command="justifyLeft"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            }
            title="Align Left"
          />
          <ToolbarButton
            command="justifyCenter"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
              </svg>
            }
            title="Align Center"
          />
          <ToolbarButton
            command="justifyRight"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
              </svg>
            }
            title="Align Right"
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
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          
          <label className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Insert Image">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 20 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12z" />
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
      <div className="flex-1 p-6 overflow-auto">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-full outline-none prose prose-lg max-w-none"
          onInput={() => onChange(editorRef.current.innerHTML)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ minHeight: '500px' }}
        />
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
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
    </div>
  );
};

export default RichTextEditor;