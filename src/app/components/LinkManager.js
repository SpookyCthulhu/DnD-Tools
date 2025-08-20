'use client';

import { useState, useEffect, useMemo } from 'react';
import SearchModal from './SearchModal';

const LinkManager = ({ 
  campaign, 
  onCreateLink, 
  onClose, 
  selectedText = '',
  existingLinks = []
}) => {
  const [selectedDestinations, setSelectedDestinations] = useState(new Set(existingLinks.map(l => l.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [linkType, setLinkType] = useState('all'); // all, chapter, section, page, text
  const [textToHighlight, setTextToHighlight] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  // Build searchable index of all campaign content
  const contentIndex = useMemo(() => {
    const index = [];
    
    campaign.chapters.forEach(chapter => {
      // Add chapter
      index.push({
        id: `chapter-${chapter.id}`,
        type: 'chapter',
        title: chapter.title,
        chapterId: chapter.id,
        path: [chapter.title]
      });
      
      chapter.sections.forEach(section => {
        // Add section
        index.push({
          id: `section-${section.id}`,
          type: 'section',
          title: section.title,
          chapterId: chapter.id,
          sectionId: section.id,
          path: [chapter.title, section.title]
        });
        
        section.pages.forEach(page => {
          // Add page
          index.push({
            id: `page-${page.id}`,
            type: 'page',
            title: page.title,
            chapterId: chapter.id,
            sectionId: section.id,
            pageId: page.id,
            path: [chapter.title, section.title, page.title]
          });
          
          // Extract text snippets from page content for text linking
          if (page.content) {
            const div = document.createElement('div');
            div.innerHTML = page.content;
            const text = div.textContent || div.innerText || '';
            
            // Create text snippet entries (every 100 characters as potential link targets)
            const snippets = [];
            for (let i = 0; i < text.length; i += 50) {
              const snippet = text.substring(i, Math.min(i + 100, text.length));
              if (snippet.trim().length > 20) {
                snippets.push({
                  id: `text-${page.id}-${i}`,
                  type: 'text',
                  title: snippet.substring(0, 50) + (snippet.length > 50 ? '...' : ''),
                  fullText: snippet,
                  chapterId: chapter.id,
                  sectionId: section.id,
                  pageId: page.id,
                  textPosition: i,
                  path: [...[chapter.title, section.title, page.title], 'Text snippet']
                });
              }
            }
            index.push(...snippets);
          }
        });
      });
    });
    
    return index;
  }, [campaign]);

  // Filter content based on search and type
  const filteredContent = useMemo(() => {
    let filtered = contentIndex;
    
    // Filter by type
    if (linkType !== 'all') {
      filtered = filtered.filter(item => item.type === linkType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.path.some(p => p.toLowerCase().includes(query)) ||
        (item.fullText && item.fullText.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [contentIndex, linkType, searchQuery]);

  // Toggle destination selection
  const toggleDestination = (destination) => {
    const newSelected = new Set(selectedDestinations);
    if (newSelected.has(destination.id)) {
      newSelected.delete(destination.id);
    } else {
      newSelected.add(destination.id);
      
      // If selecting a text destination, prompt for highlight text
      if (destination.type === 'text') {
        setShowTextInput(true);
        setTextToHighlight(destination.fullText.substring(0, 30));
      }
    }
    setSelectedDestinations(newSelected);
  };

  // Create the links
  const handleCreateLinks = () => {
    const links = Array.from(selectedDestinations).map(destId => {
      const destination = contentIndex.find(item => item.id === destId);
      if (!destination) return null;
      
      return {
        id: destId,
        type: destination.type,
        title: destination.title,
        chapterId: destination.chapterId,
        sectionId: destination.sectionId,
        pageId: destination.pageId,
        textPosition: destination.textPosition,
        highlightText: destination.type === 'text' ? textToHighlight : null,
        path: destination.path
      };
    }).filter(Boolean);
    
    onCreateLink(links, selectedText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Create Links</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {selectedText && (
            <div className="mb-3 p-2 bg-blue-50 rounded">
              <span className="text-sm text-gray-600">Linking text: </span>
              <span className="font-medium">"{selectedText}"</span>
            </div>
          )}
          
          {/* Search and Filters */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for content to link..."
              className="flex-1 px-3 py-2 border rounded"
              autoFocus
            />
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="chapter">Chapters</option>
              <option value="section">Sections</option>
              <option value="page">Pages</option>
              <option value="text">Text Snippets</option>
            </select>
          </div>
          
          {/* Selected count */}
          <div className="mt-2 text-sm text-gray-600">
            {selectedDestinations.size} destination(s) selected
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {showTextInput && (
            <div className="mb-4 p-3 bg-yellow-50 rounded">
              <label className="block text-sm font-medium mb-2">
                Text to highlight when navigating to text link:
              </label>
              <input
                type="text"
                value={textToHighlight}
                onChange={(e) => setTextToHighlight(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter text to highlight..."
              />
            </div>
          )}
          
          <div className="space-y-2">
            {filteredContent.map(item => (
              <div
                key={item.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedDestinations.has(item.id) 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleDestination(item)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedDestinations.has(item.id)}
                    onChange={() => toggleDestination(item)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {/* Type Icon */}
                      {item.type === 'chapter' && (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                      {item.type === 'section' && (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      )}
                      {item.type === 'page' && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {item.type === 'text' && (
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      )}
                      
                      <span className="font-medium">{item.title}</span>
                      
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        item.type === 'chapter' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'section' ? 'bg-green-100 text-green-700' :
                        item.type === 'page' ? 'bg-gray-100 text-gray-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {item.path.join(' › ')}
                    </div>
                    
                    {item.type === 'text' && item.fullText && (
                      <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                        "{item.fullText}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateLinks}
            disabled={selectedDestinations.size === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create {selectedDestinations.size} Link{selectedDestinations.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkManager;