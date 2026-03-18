'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { GripVertical } from 'lucide-react';

interface EditorSplitViewProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  onSplitChange?: (splitRatio: number) => void;
  minSize?: number;
}

export function EditorSplitView({
  leftContent,
  rightContent,
  leftTitle = 'Editor',
  rightTitle = 'Preview',
  onSplitChange,
  minSize = 20,
}: EditorSplitViewProps) {
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;

    if (newRatio >= minSize && newRatio <= 100 - minSize) {
      setSplitRatio(newRatio);
      onSplitChange?.(newRatio);
    }
  };

  React.useEffect(() => {
    if (isDragging.current) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full w-full bg-background overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Panel */}
      <motion.div
        className="flex flex-col border-r border-border overflow-hidden bg-background"
        style={{ width: `${splitRatio}%` }}
      >
        {leftTitle && (
          <div className="px-4 py-2 border-b border-border bg-secondary/30 text-sm font-semibold text-foreground">
            {leftTitle}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {leftContent}
        </div>
      </motion.div>

      {/* Divider */}
      <motion.div
        onMouseDown={handleMouseDown}
        className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors flex items-center justify-center group"
        whileHover={{ scale: 1.5 }}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        className="flex flex-col border-l border-border overflow-hidden bg-secondary/5"
        style={{ width: `${100 - splitRatio}%` }}
      >
        {rightTitle && (
          <div className="px-4 py-2 border-b border-border bg-secondary/30 text-sm font-semibold text-foreground">
            {rightTitle}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {rightContent}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EditorSplitView;
