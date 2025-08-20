'use client';

import { useState, useCallback } from 'react';

const NotebookSidebar = ({
  campaign,
  selectedChapterId,
  selectedSectionId,
  selectedPageId,
  expandedNodes,
  collapsed,
  onSelectChapter,
  onSelectSection,
  onSelectPage,
  onToggleExpanded,
  onToggleCollapse,
  onCreateChapter,
  onCreateSection,
  onCreatePage,
  onDeleteChapter,
  onDeleteSection,
  onDeletePage,
  onRenameItem
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEditing = useCallback((type, ids, currentTitle) => {
    setEditingItem({ type, ...ids });
    setEditingTitle(currentTitle);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingItem && editingTitle.trim()) {
      onRenameItem(editingItem.type, editingItem, editingTitle.trim());
    }
    setEditingItem(null);
    setEditingTitle('');
  }, [editingItem, editingTitle, onRenameItem]);

  const cancelEdit = useCallback(() => {
    setEditingItem(null);
    setEditingTitle('');
  }, []);

  const isEditing = useCallback((type, ids) => {
    if (!editingItem) return false;
    if (editingItem.type !== type) return false;
    
    if (type === 'chapter') {
      return editingItem.chapterId === ids.chapterId;
    } else if (type === 'section') {
      return editingItem.chapterId === ids.chapterId && 
             editingItem.sectionId === ids.sectionId;
    } else if (type === 'page') {
      return editingItem.chapterId === ids.chapterId && 
             editingItem.sectionId === ids.sectionId &&
             editingItem.pageId === ids.pageId;
    }
    return false;
  }, [editingItem]);

  return (
    <aside className={`bg-gray-100 border-r transition-all duration-300 flex flex-col ${
      collapsed ? 'w-12' : 'w-80'
    }`}>
      {/* Sidebar Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-semibold text-gray-700">Campaign Structure</h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Add Chapter Button */}
          <div className="p-3 border-b bg-white">
            <button
              onClick={onCreateChapter}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chapter
            </button>
          </div>

          {/* Table of Contents */}
          <div className="flex-1 overflow-y-auto">
            {campaign.chapters.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No chapters yet. Create your first chapter to get started.
              </div>
            ) : (
              <div className="py-2">
                {campaign.chapters.map(chapter => (
                  <div key={chapter.id} className="mb-1">
                    {/* Chapter */}
                    <div
                      id={`chapter-${chapter.id}`}
                      className={`flex items-center px-3 py-1 hover:bg-gray-200 cursor-pointer ${
                        selectedChapterId === chapter.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <button
                        onClick={() => onToggleExpanded(chapter.id)}
                        className="p-1 hover:bg-gray-300 rounded mr-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {expandedNodes.has(chapter.id) ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          )}
                        </svg>
                      </button>
                      
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      
                      {isEditing('chapter', { chapterId: chapter.id }) ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="flex-1 px-1 py-0 border rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="flex-1 text-sm font-medium"
                          onClick={() => onSelectChapter(chapter.id)}
                          onDoubleClick={() => startEditing('chapter', { chapterId: chapter.id }, chapter.title)}
                        >
                          {chapter.title}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onCreateSection(chapter.id)}
                          className="p-1 hover:bg-gray-300 rounded"
                          title="Add section"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteChapter(chapter.id)}
                          className="p-1 hover:bg-red-200 rounded text-red-600"
                          title="Delete chapter"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Sections */}
                    {expandedNodes.has(chapter.id) && (
                      <div className="ml-6">
                        {chapter.sections.map(section => (
                          <div key={section.id}>
                            <div
                              id={`section-${section.id}`}
                              className={`flex items-center px-3 py-1 hover:bg-gray-200 cursor-pointer ${
                                selectedSectionId === section.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <button
                                onClick={() => onToggleExpanded(`${chapter.id}-${section.id}`)}
                                className="p-1 hover:bg-gray-300 rounded mr-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {expandedNodes.has(`${chapter.id}-${section.id}`) ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  )}
                                </svg>
                              </button>
                              
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              
                              {isEditing('section', { chapterId: chapter.id, sectionId: section.id }) ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="flex-1 px-1 py-0 border rounded text-sm"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="flex-1 text-sm"
                                  onClick={() => onSelectSection(section.id)}
                                  onDoubleClick={() => startEditing('section', { chapterId: chapter.id, sectionId: section.id }, section.title)}
                                >
                                  {section.title}
                                </span>
                              )}
                              
                              <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onCreatePage(chapter.id, section.id)}
                                  className="p-1 hover:bg-gray-300 rounded"
                                  title="Add page"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => onDeleteSection(chapter.id, section.id)}
                                  className="p-1 hover:bg-red-200 rounded text-red-600"
                                  title="Delete section"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Pages */}
                            {expandedNodes.has(`${chapter.id}-${section.id}`) && (
                              <div className="ml-6">
                                {section.pages.map(page => (
                                  <div
                                    key={page.id}
                                    id={`page-${page.id}`}
                                    className={`flex items-center px-3 py-1 hover:bg-gray-200 cursor-pointer ${
                                      selectedPageId === page.id ? 'bg-blue-100 border-l-2 border-blue-500' : ''
                                    }`}
                                  >
                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    
                                    {isEditing('page', { chapterId: chapter.id, sectionId: section.id, pageId: page.id }) ? (
                                      <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={saveEdit}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEdit();
                                          if (e.key === 'Escape') cancelEdit();
                                        }}
                                        className="flex-1 px-1 py-0 border rounded text-sm"
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        className="flex-1 text-sm"
                                        onClick={() => {
                                          onSelectChapter(chapter.id);
                                          onSelectSection(section.id);
                                          onSelectPage(page.id);
                                        }}
                                        onDoubleClick={() => startEditing('page', { chapterId: chapter.id, sectionId: section.id, pageId: page.id }, page.title)}
                                      >
                                        {page.title}
                                      </span>
                                    )}
                                    
                                    <button
                                      onClick={() => onDeletePage(chapter.id, section.id, page.id)}
                                      className="p-1 hover:bg-red-200 rounded text-red-600 opacity-0 hover:opacity-100 transition-opacity"
                                      title="Delete page"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default NotebookSidebar;