// src/app/components/LinkDialog.js
'use client';

import { useState, useMemo } from 'react';

const LinkDialog = ({ campaign, onClose, onInsert, selectedText }) => {
  const [linkType, setLinkType] = useState('internal');
  const [externalUrl, setExternalUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [displayText, setDisplayText] = useState(selectedText || '');

  // Build search index for internal links
  const searchIndex = useMemo(() => {
    const index = [];
    
    campaign.chapters.forEach(chapter => {
      index.push({
        type: 'chapter',
        title: chapter.title,
        chapterId: chapter.id,
        path: [chapter.title]
      });
      
      chapter.sections.forEach(section => {
        index.push({
          type: 'section',
          title: section.title,
          chapterId: chapter.id,
          sectionId: section.id,
          path: [chapter.title, section.title]
        });
        
        section.pages.forEach(page => {
          index.push({
            type: 'page',
            title: page.title,
            chapterId: chapter.id,
            sectionId: section.id,
            pageId: page.id,
            path: [chapter.title, section.title, page.title]
          });
          
          // Extract text snippets for linking to specific text
          if (page.content) {
            const div = document.createElement('div');
            div.innerHTML = page.content;
            const text = div.textContent || '';
            
            // Extract meaningful text chunks (paragraphs, headings)
            const chunks = text.match(/.{1,100}[.!?]|.{1,100}/g) || [];
            chunks.forEach((chunk, idx) => {
              if (chunk.trim().length > 20) {
                index.push({
                  type: 'text',
                  title: chunk.trim().substring(0, 50) + '...',
                  fullText: chunk.trim(),
                  chapterId: chapter.id,
                  sectionId: section.id,
                  pageId: page.id,
                  textId: `${page.id}-text-${idx}`,
                  path: [...[chapter.title, section.title, page.title], 'Text']
                });
              }
            });
          }
        });
      });
    });
    
    return index;
  }, [campaign]);

  // Filter search results
  const filteredResults = useMemo(() => {
    if (!searchQuery) return searchIndex.slice(0, 20);
    
    const query = searchQuery.toLowerCase();
    return searchIndex.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.path.some(p => p.toLowerCase().includes(query))
    ).slice(0, 50);
  }, [searchQuery, searchIndex]);

  // Toggle destination selection
  const toggleDestination = (item) => {
    setSelectedDestinations(prev => {
      const exists = prev.find(d => 
        d.chapterId === item.chapterId &&
        d.sectionId === item.sectionId &&
        d.pageId === item.pageId &&
        d.textId === item.textId
      );
      
      if (exists) {
        return prev.filter(d => d !== exists);
      } else {
        return [...prev, item];
      }
    });
  };

  // Check if destination is selected
  const isSelected = (item) => {
    return selectedDestinations.some(d => 
      d.chapterId === item.chapterId &&
      d.sectionId === item.sectionId &&
      d.pageId === item.pageId &&
      d.textId === item.textId
    );
  };

  // Handle insert
  const handleInsert = () => {
    if (linkType === 'external') {
      onInsert({
        type: 'external',
        url: externalUrl,
        displayText: displayText || externalUrl
      });
    } else {
      if (selectedDestinations.length > 0) {
        const primary = selectedDestinations[0];
        onInsert({
          type: 'internal',
          chapterId: primary.chapterId,
          sectionId: primary.sectionId,
          pageId: primary.pageId,
          textTarget: primary.textId,
          destinations: selectedDestinations,
          displayText: displayText || primary.title
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Insert Link</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Link Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setLinkType('internal')}
              className={`px-4 py-2 rounded ${
                linkType === 'internal' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Internal Link
            </button>
            <button
              onClick={() => setLinkType('external')}
              className={`px-4 py-2 rounded ${
                linkType === 'external' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              External Link
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Display Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Display Text</label>
            <input
              type="text"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
              placeholder="Text to display for the link"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {linkType === 'external' ? (
            /* External Link */
            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border rounded"
                autoFocus
              />
            </div>
          ) : (
            /* Internal Link */
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Search for chapters, sections, pages, or text
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 border rounded"
                  autoFocus
                />
              </div>

              {selectedDestinations.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <div className="text-sm font-medium mb-2">Selected Destinations ({selectedDestinations.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDestinations.map((dest, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs flex items-center gap-1"
                      >
                        {dest.title}
                        <button
                          onClick={() => toggleDestination(dest)}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredResults.map((result, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start p-3 border rounded hover:bg-gray-50 cursor-pointer ${
                      isSelected(result) ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected(result)}
                      onChange={() => toggleDestination(result)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {/* Type Icon */}
                        {result.type === 'chapter' && (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        )}
                        {result.type === 'section' && (
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        )}
                        {result.type === 'page' && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {result.type === 'text' && (
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                        
                        <span className="font-medium">{result.title}</span>
                        
                        {/* Type Badge */}
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          result.type === 'chapter' ? 'bg-blue-100 text-blue-700' :
                          result.type === 'section' ? 'bg-green-100 text-green-700' :
                          result.type === 'page' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {result.type}
                        </span>
                      </div>
                      
                      {/* Path */}
                      <div className="text-xs text-gray-500 mt-1">
                        {result.path.join(' › ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={linkType === 'external' ? !externalUrl : selectedDestinations.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Insert Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkDialog;