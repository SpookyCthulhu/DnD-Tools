'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RichTextEditor from './RichTextEditor';
import NotebookSidebar from './NotebookSidebar';
import NotebookHeader from './NotebookHeader';
import SearchModal from './SearchModal';
import { v4 as uuidv4 } from 'uuid';

const Notebook = () => {
  // Campaign data structure
  const [campaign, setCampaign] = useState({
    id: uuidv4(),
    title: 'New Campaign',
    chapters: [],
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0'
    }
  });

  // Navigation state
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const autoSaveTimer = useRef(null);

  // Link references
  const sidebarHighlightTimeouts = useRef([]);

  // Initialize with default campaign structure
  useEffect(() => {
    const savedCampaign = localStorage.getItem('dnd-notebook-campaign');
    if (savedCampaign) {
      try {
        const parsed = JSON.parse(savedCampaign);
        setCampaign(parsed);
        if (parsed.chapters.length > 0) {
          setSelectedChapterId(parsed.chapters[0].id);
          if (parsed.chapters[0].sections?.length > 0) {
            setSelectedSectionId(parsed.chapters[0].sections[0].id);
            if (parsed.chapters[0].sections[0].pages?.length > 0) {
              setSelectedPageId(parsed.chapters[0].sections[0].pages[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved campaign:', error);
      }
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        saveCampaign();
        setIsDirty(false);
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [campaign, isDirty]);

  // Handle navigation from links
  const handleLinkNavigation = useCallback((link) => {
    // Clear any existing highlight timeouts
    sidebarHighlightTimeouts.current.forEach(timeout => clearTimeout(timeout));
    sidebarHighlightTimeouts.current = [];

    if (link.type === 'chapter') {
      // Navigate to chapter
      setSelectedChapterId(link.chapterId);
      setExpandedNodes(prev => new Set([...prev, link.chapterId]));
      
      // Highlight the chapter in sidebar
      highlightSidebarItem(`chapter-${link.chapterId}`);
      
    } else if (link.type === 'section') {
      // Navigate to section
      setSelectedChapterId(link.chapterId);
      setSelectedSectionId(link.sectionId);
      setExpandedNodes(prev => new Set([...prev, link.chapterId, `${link.chapterId}-${link.sectionId}`]));
      
      // Highlight the section in sidebar
      highlightSidebarItem(`section-${link.sectionId}`);
      
    } else if (link.type === 'page') {
      // Navigate to page
      setSelectedChapterId(link.chapterId);
      setSelectedSectionId(link.sectionId);
      setSelectedPageId(link.pageId);
      setExpandedNodes(prev => new Set([
        ...prev, 
        link.chapterId, 
        `${link.chapterId}-${link.sectionId}`
      ]));
      
      // Highlight the page in sidebar
      highlightSidebarItem(`page-${link.pageId}`);
      
    } else if (link.type === 'text') {
      // Navigate to page with text
      setSelectedChapterId(link.chapterId);
      setSelectedSectionId(link.sectionId);
      setSelectedPageId(link.pageId);
      setExpandedNodes(prev => new Set([
        ...prev, 
        link.chapterId, 
        `${link.chapterId}-${link.sectionId}`
      ]));
      
      // Highlight text after page loads
      setTimeout(() => {
        highlightTextInPage(link.highlightText || link.title);
      }, 100);
    }
  }, []);

  // Highlight sidebar item temporarily
  const highlightSidebarItem = useCallback((itemId) => {
    setTimeout(() => {
      const element = document.getElementById(itemId);
      if (element) {
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class
        element.classList.add('sidebar-highlight');
        
        // Remove highlight after 3 seconds with fade
        const timeout = setTimeout(() => {
          element.classList.add('sidebar-highlight-fade');
          
          setTimeout(() => {
            element.classList.remove('sidebar-highlight', 'sidebar-highlight-fade');
          }, 500);
        }, 3000);
        
        sidebarHighlightTimeouts.current.push(timeout);
      }
    }, 100);
  }, []);

  // Highlight text in the page
  const highlightTextInPage = useCallback((text) => {
    if (!text) return;
    
    const editorElement = document.querySelector('[contenteditable="true"]');
    if (!editorElement) return;
    
    const walker = document.createTreeWalker(
      editorElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const nodeText = node.textContent;
      const index = nodeText.toLowerCase().indexOf(text.toLowerCase());
      
      if (index !== -1) {
        // Create a range and selection
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + text.length);
        
        // Highlight the text
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Add temporary highlight
        const span = document.createElement('span');
        span.className = 'text-highlight';
        range.surroundContents(span);
        
        // Scroll to the highlighted text
        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          span.classList.add('text-highlight-fade');
          setTimeout(() => {
            const parent = span.parentNode;
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
          }, 500);
        }, 3000);
        
        break;
      }
    }
  }, []);

  // Save campaign to localStorage
  const saveCampaign = useCallback(() => {
    const updatedCampaign = {
      ...campaign,
      metadata: {
        ...campaign.metadata,
        lastModified: new Date().toISOString()
      }
    };
    localStorage.setItem('dnd-notebook-campaign', JSON.stringify(updatedCampaign));
    console.log('Campaign auto-saved');
  }, [campaign]);

  // Add to history for undo/redo
  const addToHistory = useCallback((newCampaign) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newCampaign)));
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo action
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setCampaign(JSON.parse(JSON.stringify(history[newIndex])));
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Redo action
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setCampaign(JSON.parse(JSON.stringify(history[newIndex])));
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Create new chapter
  const createChapter = useCallback(() => {
    const newChapter = {
      id: uuidv4(),
      title: `Chapter ${campaign.chapters.length + 1}`,
      sections: [],
      created: new Date().toISOString()
    };
    
    const updatedCampaign = {
      ...campaign,
      chapters: [...campaign.chapters, newChapter]
    };
    
    setCampaign(updatedCampaign);
    setSelectedChapterId(newChapter.id);
    setSelectedSectionId(null);
    setSelectedPageId(null);
    setIsDirty(true);
    addToHistory(updatedCampaign);
  }, [campaign, addToHistory]);

  // Create new section
  const createSection = useCallback((chapterId) => {
    const updatedChapters = campaign.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        const newSection = {
          id: uuidv4(),
          title: `Section ${chapter.sections.length + 1}`,
          pages: [],
          created: new Date().toISOString()
        };
        return {
          ...chapter,
          sections: [...chapter.sections, newSection]
        };
      }
      return chapter;
    });
    
    const updatedCampaign = {
      ...campaign,
      chapters: updatedChapters
    };
    
    setCampaign(updatedCampaign);
    setIsDirty(true);
    addToHistory(updatedCampaign);
  }, [campaign, addToHistory]);

  // Create new page
  const createPage = useCallback((chapterId, sectionId) => {
    const updatedChapters = campaign.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        const updatedSections = chapter.sections.map(section => {
          if (section.id === sectionId) {
            const newPage = {
              id: uuidv4(),
              title: `Page ${section.pages.length + 1}`,
              content: '',
              tags: [],
              links: [],
              created: new Date().toISOString(),
              modified: new Date().toISOString()
            };
            return {
              ...section,
              pages: [...section.pages, newPage]
            };
          }
          return section;
        });
        return {
          ...chapter,
          sections: updatedSections
        };
      }
      return chapter;
    });
    
    const updatedCampaign = {
      ...campaign,
      chapters: updatedChapters
    };
    
    setCampaign(updatedCampaign);
    setIsDirty(true);
    addToHistory(updatedCampaign);
  }, [campaign, addToHistory]);

  // Update page content
  const updatePageContent = useCallback((chapterId, sectionId, pageId, content) => {
    const updatedChapters = campaign.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        const updatedSections = chapter.sections.map(section => {
          if (section.id === sectionId) {
            const updatedPages = section.pages.map(page => {
              if (page.id === pageId) {
                return {
                  ...page,
                  content,
                  modified: new Date().toISOString()
                };
              }
              return page;
            });
            return {
              ...section,
              pages: updatedPages
            };
          }
          return section;
        });
        return {
          ...chapter,
          sections: updatedSections
        };
      }
      return chapter;
    });
    
    setCampaign({
      ...campaign,
      chapters: updatedChapters
    });
    setIsDirty(true);
  }, [campaign]);

  // Delete functions
  const deleteChapter = useCallback((chapterId) => {
    if (window.confirm('Are you sure you want to delete this chapter and all its contents?')) {
      const updatedCampaign = {
        ...campaign,
        chapters: campaign.chapters.filter(ch => ch.id !== chapterId)
      };
      setCampaign(updatedCampaign);
      setIsDirty(true);
      addToHistory(updatedCampaign);
      
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(null);
        setSelectedSectionId(null);
        setSelectedPageId(null);
      }
    }
  }, [campaign, selectedChapterId, addToHistory]);

  const deleteSection = useCallback((chapterId, sectionId) => {
    if (window.confirm('Are you sure you want to delete this section and all its pages?')) {
      const updatedChapters = campaign.chapters.map(chapter => {
        if (chapter.id === chapterId) {
          return {
            ...chapter,
            sections: chapter.sections.filter(sec => sec.id !== sectionId)
          };
        }
        return chapter;
      });
      
      const updatedCampaign = {
        ...campaign,
        chapters: updatedChapters
      };
      
      setCampaign(updatedCampaign);
      setIsDirty(true);
      addToHistory(updatedCampaign);
      
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
        setSelectedPageId(null);
      }
    }
  }, [campaign, selectedSectionId, addToHistory]);

  const deletePage = useCallback((chapterId, sectionId, pageId) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      const updatedChapters = campaign.chapters.map(chapter => {
        if (chapter.id === chapterId) {
          const updatedSections = chapter.sections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                pages: section.pages.filter(page => page.id !== pageId)
              };
            }
            return section;
          });
          return {
            ...chapter,
            sections: updatedSections
          };
        }
        return chapter;
      });
      
      const updatedCampaign = {
        ...campaign,
        chapters: updatedChapters
      };
      
      setCampaign(updatedCampaign);
      setIsDirty(true);
      addToHistory(updatedCampaign);
      
      if (selectedPageId === pageId) {
        setSelectedPageId(null);
      }
    }
  }, [campaign, selectedPageId, addToHistory]);

  // Export campaign as JSON
  const exportCampaign = useCallback(() => {
    const dataStr = JSON.stringify(campaign, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaign.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [campaign]);

  // Import campaign from JSON
  const importCampaign = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setCampaign(imported);
        setIsDirty(true);
        addToHistory(imported);
        alert('Campaign imported successfully!');
      } catch (error) {
        alert('Error importing campaign. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [addToHistory]);

  // Get current page
  const getCurrentPage = useCallback(() => {
    if (!selectedChapterId || !selectedSectionId || !selectedPageId) return null;
    
    const chapter = campaign.chapters.find(ch => ch.id === selectedChapterId);
    if (!chapter) return null;
    
    const section = chapter.sections.find(sec => sec.id === selectedSectionId);
    if (!section) return null;
    
    return section.pages.find(page => page.id === selectedPageId);
  }, [campaign, selectedChapterId, selectedSectionId, selectedPageId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Search
      else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      // Save
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCampaign();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveCampaign]);

  const currentPage = getCurrentPage();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <NotebookHeader
        campaign={campaign}
        setCampaign={setCampaign}
        onExport={exportCampaign}
        onImport={importCampaign}
        onSearch={() => setSearchModalOpen(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isDirty={isDirty}
      />

      <div className="flex-1 flex overflow-hidden">
        <NotebookSidebar
          campaign={campaign}
          selectedChapterId={selectedChapterId}
          selectedSectionId={selectedSectionId}
          selectedPageId={selectedPageId}
          expandedNodes={expandedNodes}
          collapsed={sidebarCollapsed}
          onSelectChapter={setSelectedChapterId}
          onSelectSection={setSelectedSectionId}
          onSelectPage={setSelectedPageId}
          onToggleExpanded={(nodeId) => {
            const newExpanded = new Set(expandedNodes);
            if (newExpanded.has(nodeId)) {
              newExpanded.delete(nodeId);
            } else {
              newExpanded.add(nodeId);
            }
            setExpandedNodes(newExpanded);
          }}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCreateChapter={createChapter}
          onCreateSection={createSection}
          onCreatePage={createPage}
          onDeleteChapter={deleteChapter}
          onDeleteSection={deleteSection}
          onDeletePage={deletePage}
          onRenameItem={(type, ids, newTitle) => {
            // Handle renaming logic here
            const updatedCampaign = { ...campaign };
            if (type === 'chapter') {
              const chapter = updatedCampaign.chapters.find(ch => ch.id === ids.chapterId);
              if (chapter) chapter.title = newTitle;
            } else if (type === 'section') {
              const chapter = updatedCampaign.chapters.find(ch => ch.id === ids.chapterId);
              if (chapter) {
                const section = chapter.sections.find(sec => sec.id === ids.sectionId);
                if (section) section.title = newTitle;
              }
            } else if (type === 'page') {
              const chapter = updatedCampaign.chapters.find(ch => ch.id === ids.chapterId);
              if (chapter) {
                const section = chapter.sections.find(sec => sec.id === ids.sectionId);
                if (section) {
                  const page = section.pages.find(p => p.id === ids.pageId);
                  if (page) page.title = newTitle;
                }
              }
            }
            setCampaign(updatedCampaign);
            setIsDirty(true);
          }}
        />

<main className="flex-1 flex flex-col bg-white">
          {currentPage ? (
            <>
              <div className="border-b px-6 py-3 bg-gray-50">
                <div className="flex items-center text-sm text-gray-600">
                  <span>{campaign.chapters.find(ch => ch.id === selectedChapterId)?.title}</span>
                  <span className="mx-2">/</span>
                  <span>{campaign.chapters.find(ch => ch.id === selectedChapterId)?.sections.find(sec => sec.id === selectedSectionId)?.title}</span>
                  <span className="mx-2">/</span>
                  <span className="font-semibold text-gray-900">{currentPage.title}</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                <RichTextEditor
                  content={currentPage.content}
                  onChange={(content) => updatePageContent(selectedChapterId, selectedSectionId, selectedPageId, content)}
                  campaign={campaign}
                  onNavigateToLink={handleLinkNavigation}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium mb-2">No page selected</h3>
                <p className="text-sm">Select a page from the sidebar or create a new one to get started</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {searchModalOpen && (
        <SearchModal
          campaign={campaign}
          onClose={() => setSearchModalOpen(false)}
          onNavigate={(chapterId, sectionId, pageId) => {
            setSelectedChapterId(chapterId);
            setSelectedSectionId(sectionId);
            setSelectedPageId(pageId);
            setSearchModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Notebook;