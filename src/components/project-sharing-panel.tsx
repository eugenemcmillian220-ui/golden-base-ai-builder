'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Users, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Share {
  id: string;
  shared_with_email: string;
  role: 'viewer' | 'editor' | 'admin';
  created_at: string;
  share_token?: string;
}

interface ProjectSharingPanelProps {
  projectId: string;
  onShare?: (share: Share) => void;
}

export function ProjectSharingPanel({
  projectId,
  onShare,
}: ProjectSharingPanelProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Fetch shares
  useEffect(() => {
    const fetchShares = async () => {
      try {
        const response = await fetch(
          `/api/v2/projects/share?projectId=${projectId}`
        );
        if (response.ok) {
          const data = await response.json();
          setShares(data.shares || []);
        }
      } catch (err) {
        console.error('Failed to fetch shares:', err);
      }
    };

    fetchShares();
  }, [projectId]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v2/projects/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sharedWithEmail: email,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to share project');
      }

      const data = await response.json();
      setShares([...shares, data.share]);
      setShareUrl(data.shareUrl);
      setEmail('');
      onShare?.(data.share);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to share project'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const response = await fetch(
        `/api/v2/projects/share?shareId=${shareId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setShares(shares.filter((s) => s.id !== shareId));
      }
    } catch (err) {
      console.error('Failed to remove share:', err);
    }
  };

  const handleCopyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Share Project</h3>
        <form onSubmit={handleShare} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'viewer' | 'editor' | 'admin')
            }
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sharing...' : 'Share'}
          </Button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {shareUrl && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Share link created:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-black/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 overflow-x-auto">
              {shareUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyShareUrl}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {shares.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Shared with ({shares.length})
          </h4>
          <div className="space-y-2">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/20 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium">{share.shared_with_email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {share.role}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveShare(share.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
