'use client';

import { useState, useEffect, useMemo } from 'react';

const SearchModal = ({ campaign, onClose, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState('all');

  // Build search index
  const searchIndex = useMemo(() => {
    const index = [];
    
    campaign.chapters.forEach(chapter => {
      // Index chapter
      index.push({
        type: 'chapter',
        title: chapter.title,
        chapterId: chapter.id,
        path: [chapter.title]
      });
      
      chapter.sections.forEach(section => {
        // Index section
        index.push({
          type: 'section',
          title: section.title,
          chapterId: chapter.id,
          sectionId: section.id,
          path: [chapter.title, section.title]
        });
        
        section.pages.forEach(page => {
          // Index page
          index.push({
            type: 'page',
            title: page.title,
            content: page.content,
            tags: page.tags || [],
            chapterId: chapter.id,
            sectionId: section.id,
            pageId: page.id,
            path: [chapter.title, section.title, page.title]
          });
        });
      });
    });
    
    return index;
  }, [campaign]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    
    return searchIndex.filter(item => {
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      
      // Chapter filter
      if (selectedChapter !== 'all' && item.chapterId !== selectedChapter) return false;
      
      // Search in title
      if (item.title.toLowerCase().includes(query)) return true;
      
      // Search in content (for pages)
      if (item.content) {
        const div = document.createElement('div');
        div.innerHTML = item.content;
        const text = div.textContent || div.innerText || '';
        if (text.toLowerCase().includes(query)) return true;
      }
      
      // Search in tags
      if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))) return true;
      
      return false;
    });
  }, [searchQuery, selectedType, selectedChapter, searchIndex]);

  // Handle navigation
  const handleNavigate = (result) => {
    if (result.type === 'page') {
      onNavigate(result.chapterId, result.sectionId, result.pageId);
    } else if (result.type === 'section') {
      onNavigate(result.chapterId, result.sectionId, null);
    } else if (result.type === 'chapter') {
      onNavigate(result.chapterId, null, null);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Search Campaign</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for chapters, sections, pages, or content..."
              className="flex-1 px-3 py-2 border rounded"
              autoFocus
            />
          </div>
          
          {/*{/* Filters */}
          <div className="flex gap-4 mt-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All Types</option>
              <option value="chapter">Chapters</option>
              <option value="section">Sections</option>
              <option value="page">Pages</option>
            </select>
            
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All Chapters</option>
              {campaign.chapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {searchQuery && filteredResults.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleNavigate(result)}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
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
                        
                        <span className="font-medium">{result.title}</span>
                        
                        {/* Type Badge */}
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          result.type === 'chapter' ? 'bg-blue-100 text-blue-700' :
                          result.type === 'section' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {result.type}
                        </span>
                      </div>
                      
                      {/* Path */}
                      <div className="text-xs text-gray-500 mt-1">
                        {result.path.join(' › ')}
                      </div>
                      
                      {/* Content Preview for Pages */}
                      {result.content && searchQuery && (
                        <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {(() => {
                            const div = document.createElement('div');
                            div.innerHTML = result.content;
                            const text = div.textContent || div.innerText || '';
                            const index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
                            if (index !== -1) {
                              const start = Math.max(0, index - 50);
                              const end = Math.min(text.length, index + searchQuery.length + 50);
                              return '...' + text.substring(start, end) + '...';
                            }
                            return text.substring(0, 150) + '...';
                          })()}
                        </div>
                      )}
                      
                      {/* Tags */}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {result.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 text-sm text-gray-500">
          {searchQuery && (
            <span>
              Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;