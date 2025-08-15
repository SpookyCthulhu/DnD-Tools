'use client';

import { useRef } from 'react';
import Link from 'next/link';

const NotebookHeader = ({
  campaign,
  setCampaign,
  onExport,
  onImport,
  onSearch,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDirty
}) => {
  const fileInputRef = useRef(null);

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">D&D Campaign Notebook</h1>
          
          {/* Campaign Title */}
          <input
            type="text"
            value={campaign.title}
            onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
            className="px-3 py-1 border rounded text-lg font-semibold"
            placeholder="Campaign Name"
          />

          {isDirty && (
            <span className="text-xs text-gray-500">● Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Link to Map Tool */}
          <Link
            href="/map"
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map Tool
          </Link>

          {/* Search */}
          <button
            onClick={onSearch}
            className="p-2 hover:bg-gray-100 rounded"
            title="Search (Ctrl+F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-l pl-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          {/* Export/Import */}
          <div className="flex items-center gap-1 border-l pl-2">
            <button
              onClick={onExport}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              title="Export Campaign"
            >
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              title="Import Campaign"
            >
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImport(file);
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default NotebookHeader;