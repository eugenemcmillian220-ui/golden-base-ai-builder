'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OTClient } from '@/lib/collab/operational-transformation';
import { ClientCursorTracker } from '@/lib/collab/cursor-tracking';
import { ActivityLogClient } from '@/lib/collab/activity-log';
import type { CursorPosition, UserPresence } from '@/lib/collab/cursor-tracking';
import type { ActivityEvent } from '@/lib/collab/activity-log';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseCollaborationProps {
  projectId: string;
  userId: string;
  userEmail: string;
  userName: string;
  enabled?: boolean;
  onCodeChange?: (code: string) => void;
  onActivityUpdate?: (event: ActivityEvent) => void;
}

interface CollaborationState {
  isConnected: boolean;
  remoteCursors: CursorPosition[];
  activeUsers: UserPresence[];
  recentActivity: ActivityEvent[];
  syncStatus: 'synced' | 'syncing' | 'error';
  error?: string;
}

/**
 * Hook for managing real-time collaborative editing using Supabase Realtime
 * Handles presence tracking, cursor positions, and OT sync
 */
export function useCollaboration({
  projectId,
  userId,
  userEmail,
  userName,
  enabled = true,
  onCodeChange,
  onActivityUpdate,
}: UseCollaborationProps) {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    remoteCursors: [],
    activeUsers: [],
    recentActivity: [],
    syncStatus: 'synced',
  });

  const otClientRef = useRef<OTClient | null>(null);
  const cursorTrackerRef = useRef<ClientCursorTracker | null>(null);
  const activityLogRef = useRef<ActivityLogClient | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userColorRef = useRef<string>(`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`);

  // Initialize collaboration clients
  useEffect(() => {
    if (!userId || !enabled) return;

    try {
      otClientRef.current = new OTClient();
      cursorTrackerRef.current = new ClientCursorTracker(userId);
      activityLogRef.current = new ActivityLogClient(
        projectId,
        userId,
        userEmail,
        userName
      );

      cursorTrackerRef.current.initialize(userEmail, userName);

      // Listen to activity events from the client-side engine
      if (activityLogRef.current) {
        activityLogRef.current.onActivity((event) => {
          setState((prev) => ({
            ...prev,
            recentActivity: [event, ...prev.recentActivity].slice(0, 50),
          }));
          onActivityUpdate?.(event);
        });
      }
    } catch (error) {
      console.error('Failed to initialize collaboration clients:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to initialize collaboration',
        syncStatus: 'error',
      }));
    }
  }, [userId, projectId, enabled, userEmail, userName, onActivityUpdate]);

  // Connect to Supabase Realtime Channel
  useEffect(() => {
    if (!enabled || !userId || !projectId) return;

    console.log(`[Collab] Connecting to channel project:${projectId}`);

    const channel = supabase.channel(`project:${projectId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: UserPresence[] = [];
        
        Object.keys(presenceState).forEach((key) => {
          const userPresences = presenceState[key] as any[];
          userPresences.forEach((p) => {
            users.push({
              userId: p.userId,
              userEmail: p.userEmail,
              userName: p.userName,
              color: p.color,
              lastSeen: Date.now(),
              isOnline: true,
            });
          });
        });

        setState((prev) => ({
          ...prev,
          activeUsers: users,
        }));
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        setState((prev) => ({
          ...prev,
          remoteCursors: [
            ...prev.remoteCursors.filter((c) => c.userId !== payload.userId),
            payload,
          ],
        }));
      })
      .on('broadcast', { event: 'operation' }, ({ payload }) => {
        if (otClientRef.current && payload.userId !== userId) {
          const transformedOp = otClientRef.current.applyRemoteOperation(payload);
          // If content is provided in the operation, use it to update the code
          // In a production app, you'd apply the operation to the editor's text model
          if (payload.content !== undefined || payload.length !== undefined) {
            onCodeChange?.(payload.content || '');
          }
        }
      })
      .on('broadcast', { event: 'activity' }, ({ payload }) => {
        setState((prev) => ({
          ...prev,
          recentActivity: [payload, ...prev.recentActivity].slice(0, 50),
        }));
        onActivityUpdate?.(payload);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Collab] Subscribed to Supabase Realtime');
          setState((prev) => ({
            ...prev,
            isConnected: true,
            syncStatus: 'synced',
          }));

          await channel.track({
            userId,
            userEmail,
            userName,
            color: userColorRef.current,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error(`[Collab] Channel error: ${status}`);
          setState((prev) => ({
            ...prev,
            isConnected: false,
            syncStatus: 'error',
            error: `Connection ${status.toLowerCase()}`,
          }));
        }
      });

    return () => {
      console.log(`[Collab] Leaving channel project:${projectId}`);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [enabled, userId, projectId, userEmail, userName, onCodeChange, onActivityUpdate]);

  // Send cursor position updates
  const updateCursorPosition = useCallback(
    (line: number, column: number) => {
      if (!cursorTrackerRef.current || !channelRef.current) return;

      const cursor = cursorTrackerRef.current.updateCursor(line, column);
      cursor.color = userColorRef.current;

      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: cursor,
      });
    },
    []
  );

  // Send code edits via OT
  const sendCodeEdit = useCallback(
    (
      type: 'insert' | 'delete',
      position: number,
      content?: string,
      length?: number
    ) => {
      if (!otClientRef.current || !channelRef.current) return;

      setState((prev) => ({
        ...prev,
        syncStatus: 'syncing',
      }));

      const operation = otClientRef.current.createOperation(
        userId,
        type,
        position,
        content,
        length
      );

      channelRef.current.send({
        type: 'broadcast',
        event: 'operation',
        payload: operation,
      });

      setState((prev) => ({
        ...prev,
        syncStatus: 'synced',
      }));

      // Log activity in the local activity log
      if (activityLogRef.current) {
        activityLogRef.current.logCodeChange('editor', 1);
      }
    },
    [userId]
  );

  // Add a new comment
  const addComment = useCallback(
    (content: string, lineNumber?: number) => {
      if (!activityLogRef.current || !channelRef.current) return;

      const comment = activityLogRef.current.addComment(
        content,
        'editor',
        lineNumber
      );

      // Broadcast the comment to other users
      channelRef.current.send({
        type: 'broadcast',
        event: 'activity',
        payload: {
          id: comment.id,
          projectId,
          userId,
          userEmail,
          userName,
          action: 'comment',
          entityType: 'comment',
          description: `${userName} added a comment`,
          metadata: { content, lineNumber },
          timestamp: Date.now(),
        },
      });

      // Also persist to Supabase
      supabase.from('comments').insert({
        project_id: projectId,
        user_id: userId,
        content,
        line_number: lineNumber,
      }).then(({ error }) => {
        if (error) console.error('Error persisting comment:', error);
      });

      return comment;
    },
    [projectId, userId, userEmail, userName]
  );

  // Reply to an existing comment
  const replyToComment = useCallback(
    (commentId: string, content: string) => {
      if (!activityLogRef.current || !channelRef.current) return;

      const reply = activityLogRef.current.reply(commentId, content);

      if (reply) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'activity',
          payload: {
            id: `reply-${Date.now()}`,
            projectId,
            userId,
            userEmail,
            userName,
            action: 'comment',
            entityType: 'comment',
            description: `${userName} replied to a comment`,
            metadata: { commentId, content },
            timestamp: Date.now(),
          },
        });

        // Persist reply to Supabase
        supabase.from('comments').insert({
          project_id: projectId,
          user_id: userId,
          content,
          parent_id: commentId,
        }).then(({ error }) => {
          if (error) console.error('Error persisting reply:', error);
        });
      }

      return reply;
    },
    [projectId, userId, userEmail, userName]
  );

  return {
    ...state,
    updateCursorPosition,
    sendCodeEdit,
    addComment,
    replyToComment,
    reconnect: () => {
      if (channelRef.current) {
        channelRef.current.subscribe();
      }
    },
  };
}
