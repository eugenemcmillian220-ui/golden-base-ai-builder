'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: 'jsx' | 'tsx' | 'css' | 'html' | 'javascript' | 'typescript';
  isDirty: boolean;
  isSaved: boolean;
}

interface MultiTabEditorProps {
  files: EditorFile[];
  activeFileId?: string;
  onFileChange?: (fileId: string, content: string) => void;
  onFileCreate?: (name: string, language: EditorFile['language']) => void;
  onFileDelete?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onActiveFileChange?: (fileId: string) => void;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Multi-tab code editor component
 * Supports multiple files, syntax highlighting, and file management
 */
export function MultiTabEditor({
  files,
  activeFileId,
  onFileChange,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onActiveFileChange,
  readOnly = false,
  theme = 'dark',
}: MultiTabEditorProps) {
  const [currentActiveId, setCurrentActiveId] = useState(activeFileId || files[0]?.id);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const activeFile = files.find((f) => f.id === currentActiveId);
  const isDark = theme === 'dark';

  const handleFileSelect = useCallback(
    (fileId: string) => {
      setCurrentActiveId(fileId);
      onActiveFileChange?.(fileId);
    },
    [onActiveFileChange]
  );

  const handleFileClose = useCallback(
    (fileId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onFileDelete?.(fileId);

      if (currentActiveId === fileId) {
        const remaining = files.filter((f) => f.id !== fileId);
        if (remaining.length > 0) {
          handleFileSelect(remaining[0].id);
        }
      }
    },
    [currentActiveId, files, onFileDelete, handleFileSelect]
  );

  const handleCreateFile = useCallback(() => {
    if (newFileName.trim()) {
      const language = newFileName.endsWith('.css')
        ? 'css'
        : newFileName.endsWith('.html')
          ? 'html'
          : newFileName.endsWith('.ts')
            ? 'typescript'
            : 'jsx';

      onFileCreate?.(newFileName, language);
      setNewFileName('');
      setIsCreatingFile(false);
    }
  }, [newFileName, onFileCreate]);

  const handleContentChange = useCallback(
    (content: string) => {
      if (activeFile && !readOnly) {
        onFileChange?.(activeFile.id, content);
      }
    },
    [activeFile, readOnly, onFileChange]
  );

  const getFileIcon = (language: EditorFile['language']): string => {
    const icons: Record<EditorFile['language'], string> = {
      jsx: '⚛️',
      tsx: '⚛️',
      css: '🎨',
      html: '🔷',
      javascript: '📜',
      typescript: '🔷',
    };
    return icons[language];
  };

  return (
    <div
      className={cn(
        'flex h-full',
        isDark ? 'bg-slate-900' : 'bg-white'
      )}
    >
      {/* File Explorer Sidebar */}
      {showFileExplorer && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className={cn(
            'w-64 border-r flex flex-col',
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
          )}
        >
          {/* File Explorer Header */}
          <div
            className={cn(
              'px-4 py-3 border-b flex items-center justify-between',
              isDark ? 'border-slate-700' : 'border-slate-200'
            )}
          >
            <span className={cn('text-sm font-semibold', isDark ? 'text-slate-200' : 'text-slate-900')}>
              Files
            </span>
            <button
              onClick={() => setIsCreatingFile(true)}
              className={cn(
                'p-1 rounded hover:bg-slate-600 transition-colors',
                isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
              )}
              title="Add new file"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* New File Input */}
          {isCreatingFile && (
            <div className={cn('px-2 py-2 border-b', isDark ? 'border-slate-700' : 'border-slate-200')}>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                  if (e.key === 'Escape') {
                    setNewFileName('');
                    setIsCreatingFile(false);
                  }
                }}
                placeholder="file.jsx"
                autoFocus
                className={cn(
                  'w-full px-2 py-1 rounded text-sm border outline-none',
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-slate-100'
                    : 'bg-white border-slate-300 text-slate-900'
                )}
              />
            </div>
          )}

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            {files.length === 0 ? (
              <div
                className={cn(
                  'p-4 text-sm text-center',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                No files yet
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {files.map((file) => (
                  <motion.button
                    key={file.id}
                    onClick={() => handleFileSelect(file.id)}
                    className={cn(
                      'w-full px-3 py-2 rounded text-sm text-left flex items-center justify-between group transition-colors',
                      currentActiveId === file.id
                        ? isDark
                          ? 'bg-slate-700 text-slate-100'
                          : 'bg-blue-100 text-blue-900'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-700/50'
                          : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span>{getFileIcon(file.language)}</span>
                      <span className="truncate">{file.name}</span>
                      {file.isDirty && <span className="ml-1">●</span>}
                    </div>
                    <button
                      onClick={(e) => handleFileClose(file.id, e)}
                      className={cn(
                        'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                        isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-300'
                      )}
                    >
                      <X size={14} />
                    </button>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        <div
          className={cn(
            'flex items-center border-b overflow-x-auto',
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
          )}
        >
          {/* File Explorer Toggle */}
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className={cn(
              'p-2 hover:bg-slate-700 transition-colors',
              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
            )}
            title={showFileExplorer ? 'Hide file explorer' : 'Show file explorer'}
          >
            {showFileExplorer ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>

          {/* Tabs */}
          <AnimatePresence>
            {files.map((file) => (
              <motion.button
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => handleFileSelect(file.id)}
                className={cn(
                  'px-4 py-3 border-r text-sm whitespace-nowrap transition-colors flex items-center gap-2',
                  currentActiveId === file.id
                    ? isDark
                      ? 'bg-slate-700 text-slate-100 border-slate-600'
                      : 'bg-white text-slate-900 border-slate-300'
                    : isDark
                      ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                )}
              >
                <span>{getFileIcon(file.language)}</span>
                <span>{file.name}</span>
                {file.isDirty && <span className="text-blue-500">●</span>}
                <button
                  onClick={(e) => handleFileClose(file.id, e)}
                  className={cn(
                    'ml-1 p-0.5 rounded opacity-0 hover:opacity-100 transition-opacity',
                    isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-300'
                  )}
                >
                  <X size={14} />
                </button>
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Add File Button */}
          <button
            onClick={() => setIsCreatingFile(true)}
            className={cn(
              'px-4 py-3 hover:bg-slate-700 transition-colors ml-auto',
              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
            )}
            title="Add new file"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          {activeFile ? (
            <motion.div
              key={activeFile.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <textarea
                value={activeFile.content}
                onChange={(e) => handleContentChange(e.target.value)}
                disabled={readOnly}
                className={cn(
                  'w-full h-full p-4 font-mono text-sm resize-none outline-none border-none',
                  isDark
                    ? 'bg-slate-900 text-slate-100 caret-blue-400'
                    : 'bg-white text-slate-900 caret-blue-600',
                  readOnly && 'cursor-not-allowed opacity-75'
                )}
                spellCheck="false"
              />
            </motion.div>
          ) : (
            <div
              className={cn(
                'h-full flex items-center justify-center',
                isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'
              )}
            >
              <p className="text-center">No file selected. Create or open a file to start editing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
