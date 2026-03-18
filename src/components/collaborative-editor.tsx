'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RemoteCursor {
  userId: string;
  userName: string;
  userEmail: string;
  line: number;
  column: number;
  color: string;
  isActive: boolean;
}

interface ActiveUser {
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
  isOnline: boolean;
  currentFile?: string;
}

interface ActivityEvent {
  userId: string;
  userName: string;
  action: 'join' | 'leave' | 'edit' | 'comment';
  timestamp: number;
  metadata?: any;
}

interface CollaborativeEditorProps {
  projectId: string;
  code: string;
  onChange: (code: string) => void;
  onCursorMove?: (line: number, column: number) => void;
  onRemoteCursor?: (cursor: RemoteCursor) => void;
  remoteCursors?: RemoteCursor[];
  activeUsers?: ActiveUser[];
  recentActivity?: ActivityEvent[];
  disabled?: boolean;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

/**
 * Collaborative Editor Component
 * Displays code with real-time cursor positions, user presence, and activity tracking
 */
export function CollaborativeEditor({
  projectId,
  code,
  onChange,
  onCursorMove,
  onRemoteCursor,
  remoteCursors = [],
  activeUsers = [],
  recentActivity = [],
  disabled = false,
  readOnly = false,
  theme = 'dark',
  className,
}: CollaborativeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [remoteCursorStates, setRemoteCursorStates] = useState<Map<string, RemoteCursor>>(new Map());
  const [highlightedActivity, setHighlightedActivity] = useState<string | null>(null);

  // Calculate cursor position from textarea
  const calculateCursorPosition = useCallback((textarea: HTMLTextAreaElement) => {
    const text = textarea.value;
    const selectionStart = textarea.selectionStart;

    let line = 1;
    let column = 1;

    for (let i = 0; i < selectionStart; i++) {
      if (text[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }

    return { line, column };
  }, []);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.currentTarget.value;
    onChange(newCode);

    const position = calculateCursorPosition(e.currentTarget);
    setCursorPos(position);

    if (onCursorMove) {
      onCursorMove(position.line, position.column);
    }
  };

  // Handle selection
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    });
  };

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Update remote cursors
  useEffect(() => {
    if (remoteCursors && remoteCursors.length > 0) {
      const newStates = new Map(remoteCursorStates);
      remoteCursors.forEach((cursor) => {
        newStates.set(cursor.userId, cursor);
      });
      setRemoteCursorStates(newStates);
    }
  }, [remoteCursors, remoteCursorStates]);

  // Highlight recent activity
  useEffect(() => {
    if (recentActivity && recentActivity.length > 0) {
      const lastActivity = recentActivity[recentActivity.length - 1];
      setHighlightedActivity(lastActivity.userId);

      const timer = setTimeout(() => {
        setHighlightedActivity(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [recentActivity]);

  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'flex flex-col h-full gap-4 rounded-lg border',
        isDark
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-slate-200',
        className
      )}
    >
      {/* Header: Active Users & Status */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b',
          isDark ? 'border-slate-700' : 'border-slate-200'
        )}
      >
        <div className="flex items-center gap-3">
          <Users
            size={18}
            className={isDark ? 'text-slate-400' : 'text-slate-600'}
          />
          <span
            className={cn(
              'text-sm font-medium',
              isDark ? 'text-slate-200' : 'text-slate-900'
            )}
          >
            {activeUsers.length > 0
              ? `${activeUsers.length} ${activeUsers.length === 1 ? 'person' : 'people'} editing`
              : 'You are alone'}
          </span>
        </div>

        {/* Active Users Avatar Stack */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <AnimatePresence>
              {activeUsers.slice(0, 5).map((user) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2',
                    isDark ? 'border-slate-700' : 'border-white'
                  )}
                  style={{ backgroundColor: user.color }}
                  title={user.userName}
                >
                  {user.userName.charAt(0).toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>

            {activeUsers.length > 5 && (
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-slate-200'
                    : 'bg-slate-200 border-white text-slate-700'
                )}
              >
                +{activeUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 min-h-0">
        {/* Line Numbers */}
        <div
          className={cn(
            'py-4 px-3 text-right select-none overflow-hidden',
            isDark
              ? 'bg-slate-800 text-slate-500'
              : 'bg-slate-50 text-slate-400',
            'font-mono text-sm leading-6 border-r',
            isDark ? 'border-slate-700' : 'border-slate-200'
          )}
        >
          {code.split('\n').map((_, i) => (
            <div key={i + 1} className="h-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Editor */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={editorRef}
            value={code}
            onChange={handleChange}
            onSelect={handleSelect}
            onScroll={handleScroll}
            disabled={disabled || readOnly}
            className={cn(
              'w-full h-full p-4 font-mono text-sm resize-none outline-none',
              isDark
                ? 'bg-slate-900 text-slate-100 caret-blue-400'
                : 'bg-white text-slate-900 caret-blue-600',
              readOnly && 'cursor-not-allowed opacity-75',
              'leading-6 focus:ring-2 focus:ring-blue-500/50'
            )}
            spellCheck="false"
          />

          {/* Remote Cursors Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {Array.from(remoteCursorStates.values()).map((cursor) => (
                <RemoteCursorDisplay
                  key={cursor.userId}
                  cursor={cursor}
                  scrollTop={scrollTop}
                  isHighlighted={highlightedActivity === cursor.userId}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar: Activity Log */}
        <div
          className={cn(
            'w-64 border-l flex flex-col',
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
          )}
        >
          {/* Activity Header */}
          <div
            className={cn(
              'px-4 py-3 font-medium text-sm border-b',
              isDark
                ? 'border-slate-700 text-slate-200'
                : 'border-slate-200 text-slate-900'
            )}
          >
            Activity
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(-10).map((event, idx) => (
                  <ActivityItem
                    key={`${event.userId}-${event.timestamp}-${idx}`}
                    event={event}
                    isHighlighted={highlightedActivity === event.userId}
                    isDark={isDark}
                  />
                ))
              ) : (
                <div
                  className={cn(
                    'p-4 text-center text-sm',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  No activity yet
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer: Status Info */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 text-xs border-t',
          isDark
            ? 'border-slate-700 text-slate-400'
            : 'border-slate-200 text-slate-600'
        )}
      >
        <div className="flex items-center gap-4">
          <span>
            Line {cursorPos.line}, Column {cursorPos.column}
          </span>
          <span>{code.split('\n').length} lines</span>
          <span>{code.length} characters</span>
        </div>
        {readOnly && (
          <span className="flex items-center gap-1 text-yellow-600">
            <AlertCircle size={14} />
            Read-only
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Remote Cursor Display Component
 */
interface RemoteCursorDisplayProps {
  cursor: RemoteCursor;
  scrollTop: number;
  isHighlighted: boolean;
}

function RemoteCursorDisplay({
  cursor,
  scrollTop,
  isHighlighted,
}: RemoteCursorDisplayProps) {
  const lineHeight = 24; // 1.5rem * 16px
  const charWidth = 8; // Approximate monospace char width
  const topOffset = (cursor.line - 1) * lineHeight - scrollTop + 16; // 16px for padding

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute pointer-events-none"
      style={{
        top: `${topOffset}px`,
        left: `${cursor.column * charWidth + 16}px`,
      }}
    >
      {/* Cursor Line */}
      <motion.div
        animate={{
          opacity: isHighlighted ? 1 : 0.7,
          scaleY: isHighlighted ? 1.2 : 1,
        }}
        className="w-0.5 h-6 rounded-full"
        style={{ backgroundColor: cursor.color }}
      />

      {/* User Label */}
      {isHighlighted && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: -8 }}
          exit={{ opacity: 0, y: -5 }}
          className="absolute top-full mt-1 whitespace-nowrap text-xs font-medium text-white px-2 py-1 rounded pointer-events-auto"
          style={{ backgroundColor: cursor.color }}
        >
          {cursor.userName}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Activity Item Component
 */
interface ActivityItemProps {
  event: ActivityEvent;
  isHighlighted: boolean;
  isDark: boolean;
}

function ActivityItem({ event, isHighlighted, isDark }: ActivityItemProps) {
  const getActivityIcon = () => {
    switch (event.action) {
      case 'join':
        return <Users size={14} className="text-green-500" />;
      case 'leave':
        return <Users size={14} className="text-red-500" />;
      case 'edit':
        return <CheckCircle2 size={14} className="text-blue-500" />;
      case 'comment':
        return <Clock size={14} className="text-purple-500" />;
      default:
        return null;
    }
  };

  const getActivityText = () => {
    switch (event.action) {
      case 'join':
        return `${event.userName} joined`;
      case 'leave':
        return `${event.userName} left`;
      case 'edit':
        return `${event.userName} edited code`;
      case 'comment':
        return `${event.userName} commented`;
      default:
        return 'Activity';
    }
  };

  const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000);
  const timeStr =
    timeAgo < 60
      ? `${timeAgo}s ago`
      : timeAgo < 3600
        ? `${Math.floor(timeAgo / 60)}m ago`
        : `${Math.floor(timeAgo / 3600)}h ago`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: 1,
        x: 0,
        backgroundColor: isHighlighted
          ? isDark
            ? 'rgba(59, 130, 246, 0.1)'
            : 'rgba(59, 130, 246, 0.05)'
          : 'transparent',
      }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        'px-4 py-2 border-b',
        isDark ? 'border-slate-700' : 'border-slate-200'
      )}
    >
      <div className="flex items-start gap-2">
        {getActivityIcon()}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-xs font-medium truncate',
              isDark ? 'text-slate-200' : 'text-slate-900'
            )}
          >
            {getActivityText()}
          </p>
          <p
            className={cn(
              'text-xs',
              isDark ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            {timeStr}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
