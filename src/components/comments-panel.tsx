'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Trash2,
  CheckCircle2,
  X,
  Reply,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentReply {
  id: string;
  author: string;
  authorName: string;
  content: string;
  createdAt: number;
  mentions?: string[];
}

interface Comment {
  id: string;
  author: string;
  authorName: string;
  authorColor: string;
  content: string;
  fileId?: string;
  lineNumber?: number;
  createdAt: number;
  updatedAt: number;
  resolved: boolean;
  replies: CommentReply[];
  tags?: string[];
}

interface CommentsPanelProps {
  projectId: string;
  comments?: Comment[];
  onAddComment?: (
    content: string,
    fileId?: string,
    lineNumber?: number
  ) => Promise<void>;
  onReply?: (commentId: string, content: string) => Promise<void>;
  onResolve?: (commentId: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onDeleteReply?: (commentId: string, replyId: string) => Promise<void>;
  currentUserId?: string;
  currentUserName?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

/**
 * Comments Panel Component
 * Displays comments and code review threads
 */
export function CommentsPanel({
  projectId,
  comments = [],
  onAddComment,
  onReply,
  onResolve,
  onDelete,
  onDeleteReply,
  currentUserId,
  currentUserName = 'You',
  theme = 'dark',
  className,
}: CommentsPanelProps) {
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loadingCommentId, setLoadingCommentId] = useState<string | null>(null);
  const [filterUnresolved, setFilterUnresolved] = useState(false);

  const isDark = theme === 'dark';
  const unresolvedCount = comments.filter((c) => !c.resolved).length;
  const filteredComments = filterUnresolved
    ? comments.filter((c) => !c.resolved)
    : comments;

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !onAddComment) return;

    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [newComment, onAddComment]);

  const handleReply = useCallback(
    async (commentId: string) => {
      if (!replyContent.trim() || !onReply) return;

      setLoadingCommentId(commentId);
      try {
        await onReply(commentId, replyContent);
        setReplyContent('');
        setReplyingTo(null);
      } catch (error) {
        console.error('Failed to reply:', error);
      } finally {
        setLoadingCommentId(null);
      }
    },
    [replyContent, onReply]
  );

  const handleResolve = useCallback(
    async (commentId: string) => {
      if (!onResolve) return;

      setLoadingCommentId(commentId);
      try {
        await onResolve(commentId);
      } catch (error) {
        console.error('Failed to resolve comment:', error);
      } finally {
        setLoadingCommentId(null);
      }
    },
    [onResolve]
  );

  const toggleExpanded = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-lg border',
        isDark
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-slate-200',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b',
          isDark ? 'border-slate-700' : 'border-slate-200'
        )}
      >
        <div className="flex items-center gap-2">
          <MessageCircle
            size={18}
            className={isDark ? 'text-slate-400' : 'text-slate-600'}
          />
          <span
            className={cn(
              'text-sm font-medium',
              isDark ? 'text-slate-200' : 'text-slate-900'
            )}
          >
            Comments & Reviews
          </span>
          {unresolvedCount > 0 && (
            <span
              className={cn(
                'text-xs font-bold px-2 py-1 rounded-full',
                'bg-yellow-500/20 text-yellow-600'
              )}
            >
              {unresolvedCount} unresolved
            </span>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setFilterUnresolved(!filterUnresolved)}
          className={cn(
            'text-xs px-2 py-1 rounded transition-colors',
            filterUnresolved
              ? 'bg-blue-500/20 text-blue-600'
              : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
          )}
        >
          {filterUnresolved ? 'Showing Unresolved' : 'Show Unresolved'}
        </button>
      </div>

      {/* New Comment Input */}
      {onAddComment && (
        <div
          className={cn(
            'p-4 border-b',
            isDark ? 'border-slate-700' : 'border-slate-200'
          )}
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={cn(
              'w-full px-3 py-2 rounded border text-sm resize-none outline-none',
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
            )}
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setNewComment('')}
              className={cn(
                'px-3 py-1 text-sm rounded transition-colors',
                isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className={cn(
                'flex items-center gap-2 px-3 py-1 text-sm rounded font-medium transition-colors',
                newComment.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              )}
            >
              <Send size={14} />
              Comment
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {filteredComments.length === 0 ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center h-full gap-2 text-center',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            <MessageCircle size={32} className="opacity-50" />
            <p className="text-sm">
              {comments.length === 0
                ? 'No comments yet'
                : 'All comments resolved!'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'border-b',
                  isDark ? 'border-slate-700' : 'border-slate-200'
                )}
              >
                {/* Comment */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: comment.authorColor }}
                    >
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isDark ? 'text-slate-100' : 'text-slate-900'
                            )}
                          >
                            {comment.authorName}
                          </p>
                          <p
                            className={cn(
                              'text-xs',
                              isDark
                                ? 'text-slate-500'
                                : 'text-slate-600'
                            )}
                          >
                            {comment.lineNumber
                              ? `Line ${comment.lineNumber}`
                              : 'General comment'}{' '}
                            · {timeAgo(comment.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!comment.resolved && onResolve && (
                            <button
                              onClick={() => handleResolve(comment.id)}
                              disabled={loadingCommentId === comment.id}
                              className={cn(
                                'p-1 rounded transition-colors',
                                isDark
                                  ? 'hover:bg-slate-700'
                                  : 'hover:bg-slate-100'
                              )}
                              title="Mark as resolved"
                            >
                              {loadingCommentId === comment.id ? (
                                <Loader
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <CheckCircle2
                                  size={14}
                                  className="text-green-600"
                                />
                              )}
                            </button>
                          )}
                          {currentUserId === comment.author && onDelete && (
                            <button
                              onClick={() => onDelete(comment.id)}
                              className={cn(
                                'p-1 rounded transition-colors',
                                isDark
                                  ? 'text-slate-500 hover:text-red-400'
                                  : 'text-slate-500 hover:text-red-600'
                              )}
                              title="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {comment.resolved && (
                            <CheckCircle2
                              size={14}
                              className="text-green-600"
                            />
                          )}
                        </div>
                      </div>

                      {/* Comment Text */}
                      <p
                        className={cn(
                          'text-sm mt-2 leading-relaxed',
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        )}
                      >
                        {comment.content}
                      </p>

                      {/* Tags */}
                      {comment.tags && comment.tags.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {comment.tags.map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                'text-xs px-2 py-1 rounded-full',
                                isDark
                                  ? 'bg-slate-700 text-slate-200'
                                  : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Replies Toggle */}
                      {comment.replies.length > 0 && (
                        <button
                          onClick={() => toggleExpanded(comment.id)}
                          className={cn(
                            'text-xs mt-2 font-medium transition-colors',
                            isDark
                              ? 'text-blue-400 hover:text-blue-300'
                              : 'text-blue-600 hover:text-blue-700'
                          )}
                        >
                          {expandedComments.has(comment.id)
                            ? `▼ ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                            : `▶ ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                        </button>
                      )}

                      {/* Replies */}
                      <AnimatePresence>
                        {expandedComments.has(comment.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2"
                          >
                            {comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className={cn(
                                  'p-2 rounded ml-4 border-l-2',
                                  isDark
                                    ? 'bg-slate-800 border-slate-600'
                                    : 'bg-slate-50 border-slate-200'
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p
                                      className={cn(
                                        'text-xs font-medium',
                                        isDark
                                          ? 'text-slate-100'
                                          : 'text-slate-900'
                                      )}
                                    >
                                      {reply.authorName}
                                    </p>
                                    <p
                                      className={cn(
                                        'text-xs',
                                        isDark
                                          ? 'text-slate-500'
                                          : 'text-slate-600'
                                      )}
                                    >
                                      {timeAgo(reply.createdAt)}
                                    </p>
                                  </div>
                                  {currentUserId === reply.author &&
                                    onDeleteReply && (
                                      <button
                                        onClick={() =>
                                          onDeleteReply(
                                            comment.id,
                                            reply.id
                                          )
                                        }
                                        className={cn(
                                          'p-0.5 rounded transition-colors',
                                          isDark
                                            ? 'text-slate-500 hover:text-red-400'
                                            : 'text-slate-500 hover:text-red-600'
                                        )}
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                </div>
                                <p
                                  className={cn(
                                    'text-xs mt-1',
                                    isDark
                                      ? 'text-slate-200'
                                      : 'text-slate-700'
                                  )}
                                >
                                  {reply.content}
                                </p>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Reply Input */}
                      {replyingTo === comment.id && onReply && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2"
                        >
                          <textarea
                            value={replyContent}
                            onChange={(e) =>
                              setReplyContent(e.currentTarget.value)
                            }
                            placeholder="Write a reply..."
                            className={cn(
                              'w-full px-2 py-1 rounded text-xs resize-none outline-none border',
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-100'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            )}
                            rows={2}
                          />
                          <div className="flex justify-end gap-1 mt-1">
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                              className={cn(
                                'px-2 py-1 text-xs rounded transition-colors',
                                isDark
                                  ? 'text-slate-400 hover:text-slate-200'
                                  : 'text-slate-600 hover:text-slate-900'
                              )}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={
                                !replyContent.trim() ||
                                loadingCommentId === comment.id
                              }
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-colors',
                                replyContent.trim()
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                              )}
                            >
                              <Send size={12} />
                              Reply
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Reply Button */}
                      {replyingTo !== comment.id && onReply && (
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className={cn(
                            'text-xs mt-2 font-medium flex items-center gap-1 transition-colors',
                            isDark
                              ? 'text-blue-400 hover:text-blue-300'
                              : 'text-blue-600 hover:text-blue-700'
                          )}
                        >
                          <Reply size={12} />
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
