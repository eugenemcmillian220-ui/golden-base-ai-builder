'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, Code, Plus, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Component {
  id: string;
  name: string;
  code: string;
  framework: string;
  design_system?: string;
  tags?: string[];
  documentation?: string;
  version: string;
  created_at: string;
}

interface ComponentMarketplaceProps {
  onImport?: (component: Component) => void;
  projectId?: string;
}

export function ComponentMarketplace({
  onImport,
  projectId,
}: ComponentMarketplaceProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [importing, setImporting] = useState(false);

  // Fetch components
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        let url = '/api/v2/components';
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (selectedFramework) params.append('framework', selectedFramework);
        if (selectedTag) params.append('tag', selectedTag);

        if (params.toString()) {
          url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setComponents(data.components || []);
          setFilteredComponents(data.components || []);
        }
      } catch (error) {
        console.error('Failed to fetch components:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchComponents, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, selectedFramework, selectedTag]);

  const handleImportComponent = async (component: Component) => {
    setImporting(true);
    try {
      // Simulate import - in real app would save to project
      if (onImport) {
        onImport(component);
      }
    } finally {
      setImporting(false);
    }
  };

  const allFrameworks = [...new Set(components.map((c) => c.framework))];
  const allTags = [...new Set(components.flatMap((c) => c.tags || []))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Component Marketplace</h3>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Save Component
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Framework Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFramework(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedFramework === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {allFrameworks.map((framework) => (
            <button
              key={framework}
              onClick={() => setSelectedFramework(framework)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFramework === framework
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {framework}
            </button>
          ))}
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selectedTag === tag
                    ? 'border-purple-600 bg-purple-50 text-purple-600 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Component Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      ) : components.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No components found. Create and save your first component!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedComponent(component)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{component.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {component.framework}
                    {component.design_system && ` • ${component.design_system}`}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  v{component.version}
                </span>
              </div>

              {/* Tags */}
              {component.tags && component.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {component.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {component.tags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{component.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Code Preview */}
              <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-hidden line-clamp-2">
                {component.code.substring(0, 100)}...
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedComponent(component);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImportComponent(component);
                  }}
                  disabled={importing}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Import
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Component Detail Modal */}
      {selectedComponent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedComponent(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="font-semibold">{selectedComponent.name}</h3>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Framework</p>
                  <p>{selectedComponent.framework}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Design System</p>
                  <p>{selectedComponent.design_system || 'Custom'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Version</p>
                  <p>{selectedComponent.version}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Created</p>
                  <p>{new Date(selectedComponent.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Code */}
              <div>
                <p className="text-sm font-medium mb-2">Code</p>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded text-xs font-mono overflow-x-auto max-h-64">
                  <pre>{selectedComponent.code}</pre>
                </div>
              </div>

              {/* Documentation */}
              {selectedComponent.documentation && (
                <div>
                  <p className="text-sm font-medium mb-2">Documentation</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedComponent.documentation}
                  </p>
                </div>
              )}

              {/* Import Button */}
              <Button
                className="w-full"
                onClick={() => {
                  handleImportComponent(selectedComponent);
                  setSelectedComponent(null);
                }}
                disabled={importing}
              >
                <Download className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import Component'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
