'use client';

import React, { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface SearchMatch {
  line: number;
  column: number;
  text: string;
}

interface EditorSearchPanelProps {
  onSearch: (query: string, caseSensitive: boolean, regex: boolean) => SearchMatch[];
  onClose: () => void;
  matchCount: number;
  currentMatch: number;
  onNavigate: (direction: 'next' | 'prev') => void;
}

export function EditorSearchPanel({
  onSearch,
  onClose,
  matchCount,
  currentMatch,
  onNavigate,
}: EditorSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      onSearch(query, caseSensitive, regex);
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-border bg-secondary/50 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded px-2 py-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Find..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            autoFocus
          />
        </div>

        {/* Match Counter */}
        {matchCount > 0 && (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {currentMatch} / {matchCount}
          </div>
        )}

        {/* Navigation Buttons */}
        <button
          onClick={() => onNavigate('prev')}
          disabled={matchCount === 0}
          className="p-1 hover:bg-secondary disabled:opacity-50 rounded transition-colors"
          title="Previous match"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate('next')}
          disabled={matchCount === 0}
          className="p-1 hover:bg-secondary disabled:opacity-50 rounded transition-colors"
          title="Next match"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Options */}
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          title="Case sensitive"
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            caseSensitive
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border hover:bg-secondary'
          }`}
        >
          Aa
        </button>
        <button
          onClick={() => setRegex(!regex)}
          title="Use regular expression"
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            regex
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border hover:bg-secondary'
          }`}
        >
          .*
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-secondary rounded transition-colors"
          title="Close search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default EditorSearchPanel;
