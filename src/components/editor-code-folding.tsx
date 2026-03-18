'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface FoldRegion {
  startLine: number;
  endLine: number;
  type: string;
  level: number;
}

interface EditorCodeFoldingProps {
  code: string;
  onFoldChange?: (foldedRegions: number[]) => void;
}

export function EditorCodeFolding({
  code,
  onFoldChange,
}: EditorCodeFoldingProps) {
  const [foldedRegions, setFoldedRegions] = useState<Set<number>>(new Set());

  // Detect foldable regions (functions, classes, blocks)
  const foldRegions = useMemo(() => {
    const regions: FoldRegion[] = [];
    const lines = code.split('\n');
    const stack: { line: number; type: string; level: number }[] = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const indent = line.search(/\S/);
      const level = indent >= 0 ? Math.floor(indent / 2) : 0;

      // Opening patterns
      if (/^\s*(function|class|interface|type|const|let|var|if|for|while|switch|try)/.test(line) && line.includes('{')) {
        stack.push({ line: lineNum, type: line.match(/function|class|interface|type|if|for|while|switch|try/)?.[0] || 'block', level });
      }

      // Closing braces
      if (line.includes('}') && stack.length > 0) {
        const start = stack.pop()!;
        if (lineNum - start.line > 1) {
          regions.push({
            startLine: start.line,
            endLine: lineNum,
            type: start.type,
            level: start.level,
          });
        }
      }
    });

    return regions;
  }, [code]);

  const handleToggleFold = (regionIdx: number) => {
    const newFolded = new Set(foldedRegions);
    if (newFolded.has(regionIdx)) {
      newFolded.delete(regionIdx);
    } else {
      newFolded.add(regionIdx);
    }
    setFoldedRegions(newFolded);
    onFoldChange?.(Array.from(newFolded));
  };

  // Get visible lines based on folds
  const visibleLines = useMemo(() => {
    const lines = code.split('\n');
    const hiddenRanges = Array.from(foldedRegions).map(idx => foldRegions[idx]);
    
    return lines
      .map((line, idx) => ({ line, lineNum: idx + 1 }))
      .filter(({ lineNum }) => {
        return !hiddenRanges.some(region => 
          region && lineNum > region.startLine && lineNum < region.endLine
        );
      });
  }, [code, foldedRegions, foldRegions]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-secondary/10 rounded border border-border/50">
      <div className="text-xs font-semibold text-muted-foreground">Code Folding</div>
      
      <div className="space-y-1">
        {foldRegions.length === 0 ? (
          <div className="text-xs text-muted-foreground">No foldable regions detected</div>
        ) : (
          foldRegions.map((region, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleToggleFold(idx)}
              className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-secondary/50 transition-colors text-left"
              whileHover={{ x: 4 }}
            >
              {foldedRegions.has(idx) ? (
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="text-muted-foreground">{region.type}</span>
              <span className="text-xs text-muted-foreground/60">
                {region.startLine}-{region.endLine}
              </span>
              {foldedRegions.has(idx) && (
                <span className="ml-auto text-xs text-primary">• folded</span>
              )}
            </motion.button>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
        <div>Total lines: {code.split('\n').length}</div>
        <div>Visible lines: {visibleLines.length}</div>
        {foldedRegions.size > 0 && (
          <div>Hidden lines: {code.split('\n').length - visibleLines.length}</div>
        )}
      </div>
    </div>
  );
}

export default EditorCodeFolding;
