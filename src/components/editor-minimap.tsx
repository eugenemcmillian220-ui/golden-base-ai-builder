'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface EditorMinimapProps {
  code: string;
  viewportHeight: number;
  totalLines: number;
  onScroll?: (lineNumber: number) => void;
}

export function EditorMinimap({
  code,
  viewportHeight,
  totalLines,
  onScroll,
}: EditorMinimapProps) {
  const lines = useMemo(() => code.split('\n'), [code]);
  
  // Calculate minimap segments (density visualization)
  const minimapSegments = useMemo(() => {
    const segments: { lineNum: number; density: number }[] = [];
    const segmentSize = Math.max(1, Math.ceil(totalLines / 100)); // 100 segments
    
    for (let i = 0; i < totalLines; i += segmentSize) {
      const chunk = lines.slice(i, Math.min(i + segmentSize, totalLines));
      let density = 0;
      
      chunk.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
          density++;
        }
      });
      
      segments.push({
        lineNum: i + 1,
        density: Math.min(1, density / segmentSize),
      });
    }
    
    return segments;
  }, [code, totalLines, lines]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = y / rect.height;
    const targetLine = Math.floor(percentage * totalLines);
    onScroll?.(targetLine);
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'auto', opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-12 bg-secondary/20 border-l border-border overflow-hidden hover:bg-secondary/40 transition-colors cursor-pointer"
      onClick={handleMinimapClick}
      title="Click to jump to line"
    >
      <div className="w-full h-full flex flex-col">
        {minimapSegments.map((segment, idx) => (
          <motion.div
            key={idx}
            className="flex-1 min-h-px"
            style={{
              backgroundColor: `rgba(34, 197, 94, ${segment.density * 0.6})`,
              opacity: segment.density > 0.1 ? 1 : 0.2,
            }}
            whileHover={{ opacity: 1 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default EditorMinimap;
