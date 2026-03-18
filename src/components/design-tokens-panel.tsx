'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Download, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Token {
  name: string;
  value: string;
  description?: string;
}

interface DesignTokenSet {
  id: string;
  name: string;
  category: 'colors' | 'typography' | 'spacing' | 'borders' | 'shadows';
  tokens: Record<string, Token>;
  description?: string;
}

interface DesignTokensPanelProps {
  projectId?: string;
}

export function DesignTokensPanel({ projectId }: DesignTokensPanelProps) {
  const [tokenSets, setTokenSets] = useState<DesignTokenSet[]>([]);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing'>('colors');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [newToken, setNewToken] = useState({ name: '', value: '', description: '' });
  const [error, setError] = useState('');

  // Fetch design tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/v2/design-tokens');
        if (response.ok) {
          const data = await response.json();
          setTokenSets(data.designTokens || []);
        }
      } catch (err) {
        console.error('Failed to fetch design tokens:', err);
      }
    };

    fetchTokens();
  }, []);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.name || !newToken.value) {
      setError('Name and value are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v2/design-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${activeTab} Tokens`,
          category: activeTab,
          tokens: {
            [newToken.name.toLowerCase().replace(/\s+/g, '_')]: {
              name: newToken.name,
              value: newToken.value,
              description: newToken.description,
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokenSets([...tokenSets, data.designTokens]);
        setNewToken({ name: '', value: '', description: '' });
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTokenSet = async (id: string) => {
    try {
      const response = await fetch(`/api/v2/design-tokens?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTokenSets(tokenSets.filter((ts) => ts.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete token set:', err);
    }
  };

  const handleExportCSS = async (id: string) => {
    try {
      const response = await fetch(`/api/v2/design-tokens?format=css&id=${id}`);
      if (response.ok) {
        const data = await response.json();
        downloadFile(data.content, data.filename, 'text/css');
      }
    } catch (err) {
      console.error('Failed to export CSS:', err);
    }
  };

  const handleExportJSON = async (id: string) => {
    try {
      const response = await fetch(`/api/v2/design-tokens?format=json&id=${id}`);
      if (response.ok) {
        const data = await response.json();
        downloadFile(data.content, data.filename, 'application/json');
      }
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeTokenSet = tokenSets.find((ts) => ts.category === activeTab);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-4">Design Tokens</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          {(['colors', 'typography', 'spacing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 capitalize font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Add new token */}
        <form onSubmit={handleAddToken} className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Token name"
                value={newToken.name}
                onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="Value (e.g., #3B82F6 or 1rem)"
                value={newToken.value}
                onChange={(e) => setNewToken({ ...newToken, value: e.target.value })}
                className="text-sm"
              />
              <Button type="submit" disabled={loading} className="h-9 px-3 py-1 text-sm">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <Input
              placeholder="Description (optional)"
              value={newToken.description}
              onChange={(e) => setNewToken({ ...newToken, description: e.target.value })}
              className="h-9 px-3 py-1 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </form>

        {/* Display tokens */}
        {activeTokenSet && Object.entries(activeTokenSet.tokens).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(activeTokenSet.tokens).map(([key, token]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {activeTab === 'colors' && (
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: token.value }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{token.name}</p>
                    <p className="text-xs text-gray-500">{token.value}</p>
                    {token.description && (
                      <p className="text-xs text-gray-400">{token.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    className="h-9 px-3 py-1 text-sm"
                    variant="ghost"
                    onClick={() => setEditing(key)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    className="h-9 px-3 py-1 text-sm"
                    variant="ghost"
                    onClick={() => handleDeleteTokenSet(activeTokenSet.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No {activeTab} tokens yet. Add one to get started.
          </p>
        )}

        {/* Export buttons */}
        {activeTokenSet && (
          <div className="flex gap-2 mt-4">
            <Button
              className="h-9 px-3 py-1 text-sm flex-1"
              variant="outline"
              onClick={() => handleExportCSS(activeTokenSet.id)}
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSS
            </Button>
            <Button
              className="h-9 px-3 py-1 text-sm flex-1"
              variant="outline"
              onClick={() => handleExportJSON(activeTokenSet.id)}
            >
              <Download className="w-4 h-4 mr-1" />
              Export JSON
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
